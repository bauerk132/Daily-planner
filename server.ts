import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { LifeOpsPlannerAgent } from './src/agent/planner_agent.ts';
import { MockCalendarAdapter } from './src/tools/calendar.ts';
import { MockTasksAdapter } from './src/tools/tasks.ts';
import { MockEmailAdapter } from './src/tools/email.ts';
import { runAllAgentTests } from './src/tests/agent_tests.ts';
import { AgentContext, ChatMessage, StructuredPlan } from './src/models/types.ts';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Shared in-memory tool adapters for the session
  const calendarAdapter = new MockCalendarAdapter();
  const tasksAdapter = new MockTasksAdapter();
  const emailAdapter = new MockEmailAdapter();

  const agent = new LifeOpsPlannerAgent({
    calendarAdapter,
    tasksAdapter,
    emailAdapter,
    geminiApiKey: process.env.GEMINI_API_KEY
  });

  // Keep active plan cache
  let currentSimulatedTime = '09:00';
  let currentUserEnergy: 'low' | 'medium' | 'high' = 'medium';
  let chatHistory: ChatMessage[] = [
    {
      id: 'msg-init',
      sender: 'agent',
      text: "Good morning! I'm your LifeOps Daily Planner. I've reviewed your commitments and set up a balanced plan protecting your hard appointments and exams first. What's on your mind today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  let cachedPlan: StructuredPlan | null = null;

  const getContext = (): AgentContext => ({
    current_time: currentSimulatedTime,
    timezone: 'America/Los_Angeles',
    user_energy: currentUserEnergy,
    work_start_time: '08:30',
    work_end_time: '21:00'
  });

  // ================= API ROUTES =================

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: currentSimulatedTime, energy: currentUserEnergy });
  });

  // Get current plan & briefing
  app.get('/api/plan', async (_req: Request, res: Response) => {
    try {
      const context = getContext();
      if (!cachedPlan) {
        cachedPlan = await agent.plan_day(context);
      }
      const briefing = await agent.create_morning_briefing(context);
      const tasks = await tasksAdapter.getTasks();
      const events = await calendarAdapter.getEvents('', '');

      res.json({
        plan: cachedPlan,
        briefing,
        tasks,
        events,
        simulatedTime: currentSimulatedTime,
        userEnergy: currentUserEnergy,
        chatHistory
      });
    } catch (err: any) {
      console.error('Error fetching plan:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Replan day
  app.post('/api/replan', async (req: Request, res: Response) => {
    try {
      if (req.body.currentTime) {
        currentSimulatedTime = req.body.currentTime;
      }
      if (req.body.userEnergy) {
        currentUserEnergy = req.body.userEnergy;
      }

      const context = getContext();
      cachedPlan = await agent.replan_day(context);

      res.json({
        success: true,
        plan: cachedPlan,
        simulatedTime: currentSimulatedTime,
        userEnergy: currentUserEnergy
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Conversational chat
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(userMsg);

      const context = getContext();
      if (!cachedPlan) {
        cachedPlan = await agent.plan_day(context);
      }

      const result = await agent.chat(message, chatHistory, context, cachedPlan);

      if (result.updatedPlan) {
        cachedPlan = result.updatedPlan;
      }

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plan_action: result.actionTaken as any
      };
      chatHistory.push(agentMsg);

      res.json({
        message: agentMsg,
        plan: cachedPlan,
        actionTaken: result.actionTaken
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Task operations
  app.get('/api/tasks', async (req: Request, res: Response) => {
    const date = (req.query.date as string) || undefined;
    const tasks = await tasksAdapter.getTasks(date);
    res.json(tasks);
  });

  app.post('/api/tasks/instantiate-recurring', async (req: Request, res: Response) => {
    try {
      const targetDate = (req.body.date as string) || undefined;
      const instantiated = tasksAdapter.instantiateRecurringTasks 
        ? await tasksAdapter.instantiateRecurringTasks(targetDate)
        : [];
      const tasks = await tasksAdapter.getTasks(targetDate);
      cachedPlan = await agent.replan_day(getContext());
      res.json({ instantiated, tasks, plan: cachedPlan });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks', async (req: Request, res: Response) => {
    try {
      const newTask = await tasksAdapter.createTask(req.body);
      // Auto replan
      cachedPlan = await agent.replan_day(getContext());
      res.json({ task: newTask, plan: cachedPlan });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/complete', async (req: Request, res: Response) => {
    try {
      const task = await tasksAdapter.completeTask(req.params.id);
      cachedPlan = await agent.replan_day(getContext());
      res.json({ task, plan: cachedPlan });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Calendar operations
  app.get('/api/events', async (_req: Request, res: Response) => {
    const events = await calendarAdapter.getEvents('', '');
    res.json(events);
  });

  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const newEvent = await calendarAdapter.createEvent(req.body);
      cachedPlan = await agent.replan_day(getContext());
      res.json({ event: newEvent, plan: cachedPlan });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Project breakdown endpoint
  app.post('/api/project-breakdown', async (req: Request, res: Response) => {
    try {
      const { project } = req.body;
      const breakdown = await agent.break_down_project(project || 'Sample Project');
      res.json(breakdown);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Run automated tests
  app.get('/api/tests', async (_req: Request, res: Response) => {
    try {
      const results = await runAllAgentTests();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= VITE MIDDLEWARE / STATIC =================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeOps Daily Planner server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
