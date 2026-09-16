/**
 * LifeOps Daily Planner Agent
 * Standalone personal operations agent ready for sub-agent orchestration
 */

import { GoogleGenAI } from '@google/genai';
import { 
  Task, 
  CalendarEvent, 
  DailyPlanBlock, 
  StructuredPlan, 
  MorningBriefing, 
  ProjectBreakdown, 
  NextAction,
  AgentContext,
  ChatMessage
} from '../models/types.ts';
import { generateDailyPlan } from './planning_logic.ts';
import { 
  LIFEOPS_PLANNER_SYSTEM_PROMPT, 
  MORNING_BRIEFING_PROMPT, 
  PROJECT_BREAKDOWN_PROMPT 
} from './prompts.ts';
import { CalendarAdapter, MockCalendarAdapter } from '../tools/calendar.ts';
import { TasksAdapter, MockTasksAdapter } from '../tools/tasks.ts';
import { EmailAdapter, MockEmailAdapter } from '../tools/email.ts';
import { parseHHMM } from '../tools/time.ts';

export interface PlannerAgentDependencies {
  calendarAdapter?: CalendarAdapter;
  tasksAdapter?: TasksAdapter;
  emailAdapter?: EmailAdapter;
  geminiApiKey?: string;
}

export class LifeOpsPlannerAgent {
  private calendar: CalendarAdapter;
  private tasks: TasksAdapter;
  private email: EmailAdapter;
  private aiClient: GoogleGenAI | null = null;

  constructor(deps?: PlannerAgentDependencies) {
    this.calendar = deps?.calendarAdapter || new MockCalendarAdapter();
    this.tasks = deps?.tasksAdapter || new MockTasksAdapter();
    this.email = deps?.emailAdapter || new MockEmailAdapter();

    const apiKey = deps?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize Gemini AI client:', err);
      }
    }
  }

  /**
   * Primary interface: Plan Day
   */
  async plan_day(context: AgentContext): Promise<StructuredPlan> {
    const today = new Date().toISOString().split('T')[0];
    const events = await this.calendar.getEvents(today, today);
    const taskList = await this.tasks.getTasks(today);

    return generateDailyPlan({
      currentTime: context.current_time,
      events,
      tasks: taskList,
      energyLevel: context.user_energy || 'medium',
      dayEndTime: context.work_end_time || '21:00'
    });
  }

  /**
   * Primary interface: Replan Day
   * Calmly rebuilds schedule from current time without judging the user
   */
  async replan_day(context: AgentContext, completedBlocks?: DailyPlanBlock[]): Promise<StructuredPlan> {
    const today = new Date().toISOString().split('T')[0];
    const events = await this.calendar.getEvents(today, today);
    const taskList = await this.tasks.getTasks(today);

    return generateDailyPlan({
      currentTime: context.current_time,
      events,
      tasks: taskList,
      energyLevel: context.user_energy || 'medium',
      dayEndTime: context.work_end_time || '21:00',
      preserveCompletedBlocks: completedBlocks
    });
  }

  /**
   * Primary interface: Create Morning Briefing
   */
  async create_morning_briefing(context: AgentContext): Promise<MorningBriefing> {
    const today = new Date().toISOString().split('T')[0];
    const events = await this.calendar.getEvents(today, today);
    const tasks = await this.tasks.getTasks(today);
    const overdue = await this.tasks.getOverdueTasks();

    const plan = await this.plan_day(context);

    const greeting = 'Good morning! Here is your clear, calm game plan for today.';
    const calSummary = events.length > 0 
      ? `You have ${events.length} scheduled event${events.length > 1 ? 's' : ''}: ${events.map(e => `${e.title} at ${e.start}`).join(', ')}.`
      : 'No fixed calendar meetings on the books today.';
    
    const taskSummary = `${tasks.length} tasks on your radar, with ${plan.top_priorities.length} key priorities protected first.`;
    const deadlines = tasks.filter(t => !!t.deadline).map(t => `${t.title} (due: ${t.deadline})`);
    const overdueItems = overdue.map(t => t.title);

    return {
      date: today,
      greeting,
      calendar_summary: calSummary,
      task_summary: taskSummary,
      overdue_items: overdueItems,
      deadlines,
      top_3_priorities: plan.top_priorities,
      suggested_schedule: plan.schedule,
      likely_conflicts: plan.conflicts,
      recommended_first_action: plan.next_action
    };
  }

  /**
   * Primary interface: Break Down Project
   */
  async break_down_project(projectDescription: string): Promise<ProjectBreakdown> {
    // If Gemini client is available, leverage it for smart contextual breakdowns
    if (this.aiClient) {
      try {
        const prompt = `${LIFEOPS_PLANNER_SYSTEM_PROMPT}\n${PROJECT_BREAKDOWN_PROMPT}\nProject: ${projectDescription}\nReturn valid JSON matching this schema:
{
  "project_title": "string",
  "total_estimated_hours": number,
  "milestones": [
    {
      "id": "m1",
      "title": "Milestone title",
      "subtasks": [
        {
          "id": "s1",
          "title": "Subtask title",
          "estimated_minutes": number,
          "dependencies": [],
          "order": 1
        }
      ]
    }
  ],
  "suggested_first_step": "A single 15-30 min step to start right now"
}`;
        const response = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        const text = response.text?.trim();
        if (text) {
          return JSON.parse(text) as ProjectBreakdown;
        }
      } catch (err) {
        console.warn('Gemini breakdown failed, falling back to deterministic breakdown:', err);
      }
    }

    // High quality deterministic breakdown fallback
    return {
      project_title: projectDescription,
      total_estimated_hours: 4.5,
      milestones: [
        {
          id: 'm-1',
          title: 'Foundation & Scope Definition',
          subtasks: [
            { id: 'st-1', title: 'Audit core requirements and gather baseline docs', estimated_minutes: 30, dependencies: [], order: 1 },
            { id: 'st-2', title: 'Outline architecture / draft preliminary structure', estimated_minutes: 45, dependencies: ['st-1'], order: 2 }
          ]
        },
        {
          id: 'm-2',
          title: 'Execution & Iteration',
          subtasks: [
            { id: 'st-3', title: 'Execute primary deliverable section 1', estimated_minutes: 60, dependencies: ['st-2'], order: 3 },
            { id: 'st-4', title: 'Execute primary deliverable section 2', estimated_minutes: 60, dependencies: ['st-3'], order: 4 }
          ]
        },
        {
          id: 'm-3',
          title: 'Review & Polish',
          subtasks: [
            { id: 'st-5', title: 'QA check, verify edge cases, and finalize submission', estimated_minutes: 30, dependencies: ['st-4'], order: 5 }
          ]
        }
      ],
      suggested_first_step: 'Spend 20 minutes gathering required materials and drafting the outline.'
    };
  }

  /**
   * Primary interface: Get Next Action (Focus Mode)
   */
  async get_next_action(context: AgentContext): Promise<NextAction> {
    const plan = await this.plan_day(context);
    return plan.next_action;
  }

  /**
   * Conversational Interface
   * Supports natural dialogue, conversational task check-offs, late starts, and schedule replanning
   */
  async chat(
    userMessage: string, 
    history: ChatMessage[], 
    context: AgentContext,
    currentPlan: StructuredPlan
  ): Promise<{ reply: string; updatedPlan?: StructuredPlan; actionTaken?: string }> {
    const lower = userMessage.toLowerCase();

    // Check for conversational task check-off
    if (lower.includes('done') || lower.includes('finished') || lower.includes('completed') || lower.includes('checked off')) {
      const activeBlock = currentPlan.schedule.find(b => b.type === 'task' && b.status === 'current') 
        || currentPlan.schedule.find(b => b.type === 'task' && b.status === 'upcoming');
      
      if (activeBlock && activeBlock.task_id) {
        await this.tasks.completeTask(activeBlock.task_id);
      }

      // Replan smoothly
      const replanned = await this.replan_day(context);
      const nextTask = replanned.next_action.title;
      return {
        reply: `Great progress. I have marked that completed. Up next: "${nextTask}" (${replanned.next_action.duration_minutes}m). Whenever you're ready, dive in.`,
        updatedPlan: replanned,
        actionTaken: 'task_completed'
      };
    }

    // Check for late start / replanning request ("didn't get anything done", "it's already 4 pm", "replan")
    if (
      lower.includes("didn't get anything done") || 
      lower.includes('replan') || 
      lower.includes('behind') || 
      lower.includes('late') ||
      lower.includes('reset my day')
    ) {
      // Extract time if mentioned (e.g. "4 pm", "16:00", "2 pm")
      let replanTime = context.current_time;
      if (lower.includes('4 pm') || lower.includes('4pm')) replanTime = '16:00';
      if (lower.includes('2 pm') || lower.includes('2pm')) replanTime = '14:00';
      if (lower.includes('3 pm') || lower.includes('3pm')) replanTime = '15:00';
      if (lower.includes('5 pm') || lower.includes('5pm')) replanTime = '17:00';
      if (lower.includes('noon') || lower.includes('12 pm')) replanTime = '12:00';

      const replanned = await this.replan_day({ ...context, current_time: replanTime });
      return {
        reply: `No worries at all—let's reset from right now (${replanTime}). I've trimmed out the pressure, protected your hard commitments, and rescheduled remaining items into realistic, bite-sized blocks. Your immediate next move is: "${replanned.next_action.title}" (${replanned.next_action.duration_minutes}m).`,
        updatedPlan: replanned,
        actionTaken: 'replan'
      };
    }

    // If Gemini client is available, generate a thoughtful, grounded response adhering to prompt rules
    if (this.aiClient) {
      try {
        const prompt = `
${LIFEOPS_PLANNER_SYSTEM_PROMPT}

CURRENT SYSTEM CONTEXT:
Current Time: ${context.current_time}
User Energy: ${context.user_energy || 'medium'}
Top Priorities: ${currentPlan.top_priorities.join(', ')}
Next Action: ${currentPlan.next_action.title} (${currentPlan.next_action.duration_minutes} mins)
Schedule Blocks:
${currentPlan.schedule.map(s => `- ${s.start}–${s.end}: ${s.title} [${s.type}]`).join('\n')}

RECENT CHAT HISTORY:
${history.slice(-4).map(h => `${h.sender.toUpperCase()}: ${h.text}`).join('\n')}

USER: "${userMessage}"

INSTRUCTIONS:
Respond in a calm, practical, supportive voice. Be direct and concise. Avoid corporate jargon or unsolicited cheerleading. Focus on the next concrete move.
`;
        const response = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return { reply: replyText };
        }
      } catch (err) {
        console.warn('Gemini chat generation failed, using fallback:', err);
      }
    }

    // High quality deterministic conversational response
    return {
      reply: `Got it. Let's keep things straightforward. Your best next action right now is to tackle "${currentPlan.next_action.title}" for ${currentPlan.next_action.duration_minutes} minutes. Definition of done: ${currentPlan.next_action.definition_of_done || 'Complete this block'}. After that, we'll take a quick breather.`
    };
  }
}
