/**
 * Core Data Models for LifeOps Daily Planner
 * Compatible with future LifeOps Multi-Agent Orchestrator
 */

export type TaskPriority = 'urgent' | 'important' | 'flexible' | 'optional';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deferred';

export type TaskCategory = 'safety_housing_admin' | 'appointment' | 'academic' | 'work_career' | 'admin' | 'project' | 'personal';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'weekdays' | 'monthly';

export interface RecurrenceRuleObject {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g., 1 (every 1 day/week), 2 (every 2 weeks)
  days_of_week?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  end_date?: string; // ISO date string (YYYY-MM-DD)
}

export type RecurrenceRule = RecurrenceFrequency | RecurrenceRuleObject;

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string; // ISO date string (YYYY-MM-DD)
  deadline?: string; // ISO datetime string or time (e.g. 17:00)
  estimated_duration: number; // in minutes (e.g., 20, 30, 60)
  priority: TaskPriority;
  category?: TaskCategory;
  status: TaskStatus;
  project?: string;
  parent_task_id?: string;
  labels: string[];
  energy_required?: 'low' | 'medium' | 'high';
  definition_of_done?: string;
  recurrence_rule?: RecurrenceRule;
  recurring_parent_id?: string; // ID of the origin or template recurring task
  last_instantiated_date?: string; // ISO date string (YYYY-MM-DD) when instance was last created
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime string or HH:mm
  end: string;   // ISO datetime string or HH:mm
  location?: string;
  notes?: string;
  is_hard_constraint?: boolean; // Hard appointments cannot be moved
}

export type BlockType = 'task' | 'appointment' | 'buffer' | 'break' | 'travel';
export type BlockStatus = 'upcoming' | 'current' | 'completed' | 'skipped';

export interface DailyPlanBlock {
  id: string;
  title: string;
  start: string; // HH:mm format, e.g., "09:00"
  end: string;   // HH:mm format, e.g., "09:30"
  task_id?: string;
  type: BlockType;
  priority: TaskPriority | 'fixed';
  status: BlockStatus;
  notes?: string;
  definition_of_done?: string;
}

export interface ScheduleConflict {
  id: string;
  description: string;
  event_or_task_ids: string[];
  severity: 'warning' | 'conflict';
  suggested_resolution?: string;
}

export interface NextAction {
  task_id?: string;
  title: string;
  duration_minutes: number;
  definition_of_done?: string;
  rationale: string;
  next_break_in_minutes?: number;
}

export interface StructuredPlan {
  summary: string;
  top_priorities: string[];
  schedule: DailyPlanBlock[];
  conflicts: ScheduleConflict[];
  deferred_tasks: Array<{
    task_id: string;
    title: string;
    reason: string;
    suggested_date?: string;
  }>;
  next_action: NextAction;
  energy_level_assumed?: 'low' | 'medium' | 'high';
  generated_at: string;
}

export interface MorningBriefing {
  date: string;
  greeting: string;
  calendar_summary: string;
  task_summary: string;
  overdue_items: string[];
  deadlines: string[];
  top_3_priorities: string[];
  suggested_schedule: DailyPlanBlock[];
  likely_conflicts: ScheduleConflict[];
  recommended_first_action: NextAction;
}

export interface ProjectSubtask {
  id: string;
  title: string;
  estimated_minutes: number;
  dependencies: string[];
  order: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  subtasks: ProjectSubtask[];
}

export interface ProjectBreakdown {
  project_title: string;
  total_estimated_hours: number;
  milestones: ProjectMilestone[];
  suggested_first_step: string;
}

export interface EveningReview {
  date: string;
  completed_tasks: Task[];
  partially_completed_tasks: Task[];
  uncompleted_tasks: Task[];
  reflection_notes: string;
  tomorrow_priorities: string[];
  suggested_tomorrow_start: string;
}

export interface AgentContext {
  current_time: string; // HH:mm or ISO
  timezone: string;
  user_energy?: 'low' | 'medium' | 'high';
  work_start_time?: string; // e.g., "08:30"
  work_end_time?: string;   // e.g., "18:00"
  preferred_block_duration?: number; // e.g., 45 mins
  recent_user_message?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  plan_action?: 'plan_updated' | 'task_completed' | 'replan' | 'focus';
}
