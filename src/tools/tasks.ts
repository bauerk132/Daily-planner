/**
 * Task Tool Interface and Adapters
 * Separates task operations from agent reasoning
 */

import { Task, TaskPriority, RecurrenceRule, RecurrenceFrequency } from '../models/types.ts';

export function parseRecurrenceRule(rule?: RecurrenceRule): {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
} | null {
  if (!rule) return null;
  if (typeof rule === 'string') {
    return { frequency: rule, interval: 1 };
  }
  return {
    frequency: rule.frequency,
    interval: rule.interval && rule.interval > 0 ? rule.interval : 1,
    daysOfWeek: rule.days_of_week,
    endDate: rule.end_date
  };
}

export function isTaskDueOnDate(
  dueDateStr: string | undefined, 
  targetDateStr: string, 
  ruleParsed: ReturnType<typeof parseRecurrenceRule>
): boolean {
  if (!dueDateStr) return true;
  if (dueDateStr > targetDateStr) {
    // Due date has not arrived yet!
    return false;
  }
  if (!ruleParsed) {
    return dueDateStr <= targetDateStr;
  }
  if (ruleParsed.endDate && targetDateStr > ruleParsed.endDate) {
    return false;
  }

  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(tY, tM - 1, tD, 12, 0, 0));
  const [dY, dM, dD] = dueDateStr.split('-').map(Number);
  const anchorDate = new Date(Date.UTC(dY, dM - 1, dD, 12, 0, 0));

  const diffDays = Math.round((targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return false;

  const targetDayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  switch (ruleParsed.frequency) {
    case 'daily':
      return diffDays % ruleParsed.interval === 0;
    case 'weekdays':
      return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
    case 'weekly':
      if (ruleParsed.daysOfWeek && ruleParsed.daysOfWeek.length > 0) {
        return ruleParsed.daysOfWeek.includes(targetDayOfWeek);
      }
      return diffDays % (7 * ruleParsed.interval) === 0;
    case 'monthly':
      return tD === dD;
    default:
      return true;
  }
}

export interface TasksAdapter {
  getTasks(date?: string): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'status'>): Promise<Task>;
  createSubtask(parentTaskId: string, title: string, durationMinutes: number): Promise<Task>;
  completeTask(id: string): Promise<Task | null>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
  rescheduleTask(id: string, newDate: string): Promise<Task | null>;
  instantiateRecurringTasks?(targetDate?: string): Promise<Task[]>;
}

export class MockTasksAdapter implements TasksAdapter {
  private tasks: Task[];

  constructor(initialTasks?: Task[]) {
    const todayStr = new Date().toISOString().split('T')[0];
    this.tasks = initialTasks || [
      {
        id: 'task-1',
        title: 'Call assistance office',
        description: 'Verify paperwork status and benefits eligibility',
        due_date: todayStr,
        deadline: '17:00',
        estimated_duration: 20,
        priority: 'urgent',
        category: 'safety_housing_admin',
        status: 'pending',
        labels: ['housing', 'administrative'],
        energy_required: 'medium',
        definition_of_done: 'Spoke with representative and received confirmation number'
      },
      {
        id: 'task-2',
        title: 'Submit 3 job applications',
        description: 'Frontend engineer positions at Stripe, Figma, and Vercel',
        due_date: todayStr,
        estimated_duration: 180, // 3 hours (will split into 3 x 60m blocks)
        priority: 'important',
        category: 'work_career',
        status: 'pending',
        labels: ['job_search', 'career'],
        energy_required: 'high',
        definition_of_done: 'Submitted tailored resumes and custom questionnaires'
      },
      {
        id: 'task-3',
        title: 'Study for Chemistry exam tomorrow',
        description: 'Practice questions on chapters 4-6',
        due_date: todayStr,
        deadline: 'Tomorrow 09:00',
        estimated_duration: 120, // 2 hours
        priority: 'urgent',
        category: 'academic',
        status: 'pending',
        labels: ['exam', 'study'],
        energy_required: 'high',
        definition_of_done: 'Completed 2 mock exams and reviewed incorrect solutions'
      },
      {
        id: 'task-4',
        title: 'Sort apartment lease paperwork',
        description: 'Sign addendum and email to landlord',
        due_date: todayStr,
        estimated_duration: 25,
        priority: 'important',
        category: 'safety_housing_admin',
        status: 'pending',
        labels: ['housing'],
        energy_required: 'low',
        definition_of_done: 'Signed PDF sent to landlord email'
      },
      {
        id: 'task-5',
        title: 'Organize desktop downloads folder',
        description: 'Archive old files and screenshots',
        due_date: todayStr,
        estimated_duration: 30,
        priority: 'optional',
        category: 'personal',
        status: 'pending',
        labels: ['maintenance'],
        energy_required: 'low',
        definition_of_done: 'Downloads folder cleaned and organized'
      },
      {
        id: 'task-recur-1',
        title: 'Daily morning review & priorities check',
        description: 'Review day plan, hydrate, and align with top objectives',
        due_date: todayStr,
        estimated_duration: 15,
        priority: 'important',
        category: 'personal',
        status: 'pending',
        labels: ['routine', 'wellness', 'recurring'],
        energy_required: 'low',
        recurrence_rule: 'daily',
        definition_of_done: 'Day plan confirmed and top priorities marked'
      },
      {
        id: 'task-recur-2',
        title: 'Weekly paperwork & budget reconciliation',
        description: 'Log weekly expenses and organize receipts',
        due_date: todayStr,
        estimated_duration: 30,
        priority: 'flexible',
        category: 'admin',
        status: 'pending',
        labels: ['finance', 'weekly', 'recurring'],
        energy_required: 'medium',
        recurrence_rule: 'weekly',
        definition_of_done: 'All weekly expenditures reconciled'
      }
    ];
  }

  async instantiateRecurringTasks(targetDate?: string): Promise<Task[]> {
    const todayStr = targetDate || new Date().toISOString().split('T')[0];
    const newlyInstantiated: Task[] = [];

    // Identify all recurring tasks with a recurrence rule
    const recurringRoots = this.tasks.filter(t => t.recurrence_rule);

    for (const baseTask of recurringRoots) {
      const parsed = parseRecurrenceRule(baseTask.recurrence_rule);
      if (!parsed) continue;

      // Has the recurring task's due date arrived for targetDate?
      const isDue = isTaskDueOnDate(baseTask.due_date, todayStr, parsed);
      if (!isDue) {
        continue;
      }

      // Check if an instance already exists for targetDate
      const parentId = baseTask.recurring_parent_id || baseTask.id;
      const alreadyHasInstanceForToday = this.tasks.some(t => {
        const isSameSeries = t.id === baseTask.id || 
                             t.recurring_parent_id === parentId ||
                             (t.title === baseTask.title && Boolean(t.recurrence_rule));
        return isSameSeries && t.due_date === todayStr;
      });

      if (!alreadyHasInstanceForToday) {
        const newInstanceId = `task-rec-${parentId.replace(/^task-rec-/, '')}-${todayStr}`;
        const newInstance: Task = {
          id: newInstanceId,
          title: baseTask.title,
          description: baseTask.description,
          due_date: todayStr,
          deadline: baseTask.deadline,
          estimated_duration: baseTask.estimated_duration,
          priority: baseTask.priority,
          category: baseTask.category,
          status: 'pending',
          project: baseTask.project,
          labels: Array.from(new Set([...(baseTask.labels || []), 'recurring', 'recurring_instance'])),
          energy_required: baseTask.energy_required,
          definition_of_done: baseTask.definition_of_done,
          recurrence_rule: baseTask.recurrence_rule,
          recurring_parent_id: parentId,
          last_instantiated_date: todayStr
        };

        this.tasks.push(newInstance);
        newlyInstantiated.push(newInstance);
        baseTask.last_instantiated_date = todayStr;
      }
    }

    return newlyInstantiated;
  }

  async getTasks(date?: string): Promise<Task[]> {
    const todayStr = date || new Date().toISOString().split('T')[0];
    await this.instantiateRecurringTasks(todayStr);
    return [...this.tasks];
  }

  async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today);
  }

  async createTask(taskData: Omit<Task, 'id' | 'status'>): Promise<Task> {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      due_date: taskData.due_date || todayStr,
      status: 'pending'
    };
    this.tasks.push(newTask);

    if (newTask.recurrence_rule) {
      await this.instantiateRecurringTasks(newTask.due_date || todayStr);
    }

    return newTask;
  }

  async createSubtask(parentTaskId: string, title: string, durationMinutes: number): Promise<Task> {
    const parent = this.tasks.find(t => t.id === parentTaskId);
    const subtask: Task = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      parent_task_id: parentTaskId,
      project: parent?.project || parent?.title,
      estimated_duration: durationMinutes,
      priority: parent?.priority || 'important',
      category: parent?.category,
      status: 'pending',
      labels: parent?.labels ? [...parent.labels, 'subtask'] : ['subtask'],
      energy_required: parent?.energy_required || 'medium'
    };
    this.tasks.push(subtask);
    return subtask;
  }

  async completeTask(id: string): Promise<Task | null> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    task.status = 'completed';
    return { ...task };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...updates };
    return { ...this.tasks[idx] };
  }

  async rescheduleTask(id: string, newDate: string): Promise<Task | null> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    task.due_date = newDate;
    task.status = 'deferred';
    return { ...task };
  }
}
