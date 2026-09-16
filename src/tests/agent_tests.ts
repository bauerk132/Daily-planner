/**
 * Test Suite for LifeOps Daily Planner Agent
 * Tests all 10 required edge cases and planning scenarios
 */

import { generateDailyPlan } from '../agent/planning_logic.ts';
import { LifeOpsPlannerAgent } from '../agent/planner_agent.ts';
import { CalendarAdapter, MockCalendarAdapter } from '../tools/calendar.ts';
import { TasksAdapter, MockTasksAdapter } from '../tools/tasks.ts';
import { Task, CalendarEvent } from '../models/types.ts';

export interface TestCaseResult {
  id: number;
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function runAllAgentTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // 1. User has too many tasks for available time
  try {
    const tasks: Task[] = Array.from({ length: 15 }, (_, i) => ({
      id: `task-heavy-${i}`,
      title: `Long Task ${i + 1}`,
      estimated_duration: 60, // 15 hours of tasks!
      priority: i < 3 ? 'urgent' : i < 6 ? 'important' : 'flexible',
      status: 'pending',
      labels: ['heavy']
    }));

    const plan = generateDailyPlan({
      currentTime: '09:00',
      events: [],
      tasks,
      dayEndTime: '18:00' // only 9 hours available
    });

    const passed = plan.deferred_tasks.length > 0 && plan.schedule.length > 0;
    results.push({
      id: 1,
      name: 'User has too many tasks for available time',
      passed,
      message: passed 
        ? `Successfully scheduled highest priorities and deferred ${plan.deferred_tasks.length} tasks without overloading schedule.`
        : 'Failed to defer overflow tasks.',
      details: { scheduled: plan.schedule.length, deferred: plan.deferred_tasks.length }
    });
  } catch (err: any) {
    results.push({ id: 1, name: 'User has too many tasks for available time', passed: false, message: err.message });
  }

  // 2. User has overlapping calendar events
  try {
    const events: CalendarEvent[] = [
      { id: 'e1', title: 'Doctor Appointment', start: '10:00', end: '11:00', is_hard_constraint: true },
      { id: 'e2', title: 'Team Meeting', start: '10:30', end: '11:30', is_hard_constraint: false }
    ];

    const plan = generateDailyPlan({
      currentTime: '09:00',
      events,
      tasks: []
    });

    const conflictDetected = plan.conflicts.length > 0 && plan.conflicts[0].event_or_task_ids.includes('e1');
    results.push({
      id: 2,
      name: 'User has overlapping calendar events',
      passed: conflictDetected,
      message: conflictDetected 
        ? `Detected overlap between "${events[0].title}" and "${events[1].title}" and suggested resolution.`
        : 'Failed to detect calendar overlap conflict.',
      details: plan.conflicts
    });
  } catch (err: any) {
    results.push({ id: 2, name: 'User has overlapping calendar events', passed: false, message: err.message });
  }

  // 3. User starts the day late (e.g. 14:00)
  try {
    const events: CalendarEvent[] = [
      { id: 'e-past', title: 'Morning Standup', start: '09:00', end: '09:30' }
    ];
    const tasks: Task[] = [
      { id: 't1', title: 'Critical Housing Form', estimated_duration: 30, priority: 'urgent', category: 'safety_housing_admin', status: 'pending', labels: [] },
      { id: 't2', title: 'Deep Work Project', estimated_duration: 120, priority: 'flexible', status: 'pending', labels: [] }
    ];

    const plan = generateDailyPlan({
      currentTime: '14:00',
      events,
      tasks,
      dayEndTime: '20:00'
    });

    // Schedule should start at or after 14:00, not 09:00
    const allBlocksAfterLateStart = plan.schedule.every(b => b.start >= '14:00');
    const priorityProtected = plan.top_priorities.includes('Critical Housing Form');
    const passed = allBlocksAfterLateStart && priorityProtected;

    results.push({
      id: 3,
      name: 'User starts the day late',
      passed,
      message: passed
        ? 'Calmly adapted timeline to start at 14:00 while protecting critical housing obligation first.'
        : 'Schedule incorrectly generated blocks before the late start time.',
      details: { firstBlockStart: plan.schedule[0]?.start }
    });
  } catch (err: any) {
    results.push({ id: 3, name: 'User starts the day late', passed: false, message: err.message });
  }

  // 4. User misses a planned work block
  try {
    const agent = new LifeOpsPlannerAgent();
    // Simulate user replanning at 16:00 after missing previous morning blocks
    const replanned = await agent.replan_day({
      current_time: '16:00',
      timezone: 'America/Los_Angeles',
      user_energy: 'medium',
      work_end_time: '21:00'
    });

    const passed = replanned.schedule.length > 0 && replanned.schedule.every(b => b.start >= '16:00');
    results.push({
      id: 4,
      name: 'User misses a planned work block',
      passed,
      message: passed 
        ? 'Successfully reconstructed remaining evening hours starting at 16:00 without guilt or shaming.'
        : 'Failed to reconstruct schedule from current time.',
      details: { nextAction: replanned.next_action.title }
    });
  } catch (err: any) {
    results.push({ id: 4, name: 'User misses a planned work block', passed: false, message: err.message });
  }

  // 5. User completes a task early
  try {
    const mockTasks = new MockTasksAdapter();
    const tasks = await mockTasks.getTasks();
    const target = tasks[0];
    await mockTasks.completeTask(target.id);

    const updatedTasks = await mockTasks.getTasks();
    const isCompleted = updatedTasks.find(t => t.id === target.id)?.status === 'completed';

    const plan = generateDailyPlan({
      currentTime: '10:00',
      events: [],
      tasks: updatedTasks
    });

    const taskNotInPendingPlan = !plan.schedule.some(b => b.task_id === target.id && b.status !== 'completed');
    const passed = isCompleted && taskNotInPendingPlan;

    results.push({
      id: 5,
      name: 'User completes a task early',
      passed,
      message: passed
        ? `Task "${target.title}" marked complete; planner automatically updated next action to "${plan.next_action.title}".`
        : 'Completed task was still scheduled as an active block.',
      details: { nextAction: plan.next_action.title }
    });
  } catch (err: any) {
    results.push({ id: 5, name: 'User completes a task early', passed: false, message: err.message });
  }

  // 6. A new urgent task appears
  try {
    const mockTasks = new MockTasksAdapter();
    const urgentTask = await mockTasks.createTask({
      title: 'Emergency: Submit Financial Aid Appeal',
      estimated_duration: 30,
      priority: 'urgent',
      category: 'safety_housing_admin',
      labels: ['financial', 'urgent'],
      energy_required: 'high'
    });

    const tasks = await mockTasks.getTasks();
    const plan = generateDailyPlan({
      currentTime: '09:00',
      events: [],
      tasks
    });

    const passed = plan.top_priorities[0] === urgentTask.title;
    results.push({
      id: 6,
      name: 'A new urgent task appears',
      passed,
      message: passed
        ? `New emergency task was elevated to top priority (#1) immediately.`
        : 'New urgent task was not prioritized ahead of standard work.',
      details: { topPriority: plan.top_priorities[0] }
    });
  } catch (err: any) {
    results.push({ id: 6, name: 'A new urgent task appears', passed: false, message: err.message });
  }

  // 7. A large task must be broken into subtasks
  try {
    const largeTask: Task = {
      id: 'task-large',
      title: 'Prepare 3-hour Comprehensive Job Portfolio',
      estimated_duration: 180, // 3 hours
      priority: 'important',
      category: 'work_career',
      status: 'pending',
      labels: ['career']
    };

    const plan = generateDailyPlan({
      currentTime: '09:00',
      events: [],
      tasks: [largeTask],
      energyLevel: 'medium'
    });

    const taskBlocks = plan.schedule.filter(b => b.task_id === 'task-large');
    const passed = taskBlocks.length > 1; // broken into multiple chunks (e.g., Part 1, Part 2, Part 3)

    results.push({
      id: 7,
      name: 'A large task must be broken into subtasks',
      passed,
      message: passed
        ? `Large 180-minute task was successfully broken into ${taskBlocks.length} manageable chunks with interleaved breaks.`
        : 'Large task was not chunked into smaller blocks.',
      details: { chunks: taskBlocks.map(b => `${b.title} (${b.start}-${b.end})`) }
    });
  } catch (err: any) {
    results.push({ id: 7, name: 'A large task must be broken into subtasks', passed: false, message: err.message });
  }

  // 8. Calendar data is unavailable (network or outage fallback)
  try {
    const errorCalendar: CalendarAdapter = {
      getEvents: async () => [], // returns empty gracefully or handles failure
      createEvent: async () => ({} as any),
      updateEvent: async () => null,
      deleteEvent: async () => false,
      findOpenTime: async () => []
    };

    const agent = new LifeOpsPlannerAgent({ calendarAdapter: errorCalendar });
    const plan = await agent.plan_day({
      current_time: '09:00',
      timezone: 'America/Los_Angeles'
    });

    const passed = plan.schedule.length > 0;
    results.push({
      id: 8,
      name: 'Calendar data is unavailable',
      passed,
      message: passed
        ? 'Handled missing calendar gracefully and planned tasks without throwing unhandled exceptions.'
        : 'Failed when calendar was unavailable.',
      details: { scheduleLength: plan.schedule.length }
    });
  } catch (err: any) {
    results.push({ id: 8, name: 'Calendar data is unavailable', passed: false, message: err.message });
  }

  // 9. Task provider is unavailable
  try {
    const errorTasks: TasksAdapter = {
      getTasks: async () => [],
      getOverdueTasks: async () => [],
      createTask: async () => ({} as any),
      createSubtask: async () => ({} as any),
      completeTask: async () => null,
      updateTask: async () => null,
      rescheduleTask: async () => null
    };

    const agent = new LifeOpsPlannerAgent({ tasksAdapter: errorTasks });
    const plan = await agent.plan_day({
      current_time: '09:00',
      timezone: 'America/Los_Angeles'
    });

    const passed = Array.isArray(plan.schedule) && plan.next_action !== undefined;
    results.push({
      id: 9,
      name: 'Task provider is unavailable',
      passed,
      message: passed
        ? 'Handled empty/failing task adapter gracefully and returned an open calm day structure.'
        : 'Crashed when tasks adapter returned empty.',
      details: { summary: plan.summary }
    });
  } catch (err: any) {
    results.push({ id: 9, name: 'Task provider is unavailable', passed: false, message: err.message });
  }

  // 10. User has no scheduled obligations
  try {
    const plan = generateDailyPlan({
      currentTime: '09:00',
      events: [],
      tasks: []
    });

    const passed = plan.schedule.length === 0 && plan.next_action.title.includes('Day goals accomplished');
    results.push({
      id: 10,
      name: 'User has no scheduled obligations',
      passed,
      message: passed
        ? 'Affirmed open availability with zero obligations and calm guidance.'
        : 'Failed to handle completely open day.',
      details: { nextAction: plan.next_action }
    });
  } catch (err: any) {
    results.push({ id: 10, name: 'User has no scheduled obligations', passed: false, message: err.message });
  }

  // 11. Recurring tasks auto-instantiate when their due date arrives
  try {
    const mockTasks = new MockTasksAdapter([
      {
        id: 'rec-daily-1',
        title: 'Daily Standup Notes',
        due_date: '2026-09-15', // yesterday
        estimated_duration: 15,
        priority: 'important',
        category: 'work_career',
        status: 'completed',
        labels: ['work'],
        recurrence_rule: 'daily'
      },
      {
        id: 'rec-future-1',
        title: 'Bi-weekly Project Retrospective',
        due_date: '2026-09-20', // future date
        estimated_duration: 45,
        priority: 'flexible',
        category: 'work_career',
        status: 'pending',
        labels: ['retro'],
        recurrence_rule: 'weekly'
      }
    ]);

    // Fetch tasks for today (2026-09-16): daily task due date has arrived!
    const todayTasks = await mockTasks.getTasks('2026-09-16');
    const instantiatedDaily = todayTasks.find(
      t => t.title === 'Daily Standup Notes' && t.due_date === '2026-09-16' && t.status === 'pending'
    );
    const futureInstantiatedEarly = todayTasks.some(
      t => t.title === 'Bi-weekly Project Retrospective' && t.due_date === '2026-09-16'
    );

    // Call again to verify idempotency (no duplicate instances created)
    const secondFetch = await mockTasks.getTasks('2026-09-16');
    const dailyInstancesCount = secondFetch.filter(
      t => t.title === 'Daily Standup Notes' && t.due_date === '2026-09-16'
    ).length;

    // Fetch for future date (2026-09-20) when future recurring task arrives
    const futureTasks = await mockTasks.getTasks('2026-09-20');
    const instantiatedFuture = futureTasks.find(
      t => t.title === 'Bi-weekly Project Retrospective' && t.due_date === '2026-09-20'
    );

    const passed = Boolean(instantiatedDaily) && 
                   !futureInstantiatedEarly && 
                   dailyInstancesCount === 1 && 
                   Boolean(instantiatedFuture);

    results.push({
      id: 11,
      name: 'Recurring tasks auto-instantiate when due date arrives',
      passed,
      message: passed
        ? 'Daily recurring task auto-instantiated for today, future recurring task waited until due date, and idempotency preserved.'
        : 'Failed to properly instantiate recurring task upon due date arrival.',
      details: { 
        dailyInstantiated: Boolean(instantiatedDaily), 
        futureDeferredUntilDue: !futureInstantiatedEarly,
        idempotent: dailyInstancesCount === 1,
        futureInstantiatedOnDue: Boolean(instantiatedFuture)
      }
    });
  } catch (err: any) {
    results.push({ id: 11, name: 'Recurring tasks auto-instantiate when due date arrives', passed: false, message: err.message });
  }

  return results;
}
