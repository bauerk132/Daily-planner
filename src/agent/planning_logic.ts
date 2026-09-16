/**
 * Planning Engine for LifeOps Daily Planner
 * Implements the 10-step deterministic reasoning pattern and constraint hierarchy
 */

import { 
  Task, 
  CalendarEvent, 
  DailyPlanBlock, 
  StructuredPlan, 
  ScheduleConflict, 
  NextAction,
  AgentContext,
  TaskPriority,
  TaskCategory
} from '../models/types.ts';
import { parseHHMM, minutesToHHMM, addMinutesToHHMM, doIntervalsOverlap } from '../tools/time.ts';

// Priority weight lookup based on LifeOps planning guidelines
export function getTaskPriorityWeight(task: Task): number {
  // Category weighting
  let score = 0;
  switch (task.category) {
    case 'safety_housing_admin':
      score += 1000;
      break;
    case 'appointment':
      score += 800;
      break;
    case 'academic':
      score += 700;
      break;
    case 'work_career':
      score += 500;
      break;
    case 'admin':
      score += 300;
      break;
    case 'project':
      score += 200;
      break;
    case 'personal':
      score += 100;
      break;
    default:
      score += 200;
  }

  // Priority level modifier
  switch (task.priority) {
    case 'urgent':
      score += 500;
      break;
    case 'important':
      score += 300;
      break;
    case 'flexible':
      score += 100;
      break;
    case 'optional':
      score += 20;
      break;
  }

  // Overdue or tight deadline boost
  if (task.deadline) {
    score += 200;
  }

  // Emergency boost
  if (task.title.toLowerCase().includes('emergency') || task.labels.includes('emergency') || task.labels.includes('crisis')) {
    score += 800;
  }

  return score;
}

export interface PlanningInput {
  currentTime: string; // HH:mm
  events: CalendarEvent[];
  tasks: Task[];
  energyLevel?: 'low' | 'medium' | 'high';
  dayEndTime?: string; // default "21:00"
  preserveCompletedBlocks?: DailyPlanBlock[];
}

export function generateDailyPlan(input: PlanningInput): StructuredPlan {
  const {
    currentTime,
    events,
    tasks,
    energyLevel = 'medium',
    dayEndTime = '21:00',
    preserveCompletedBlocks = []
  } = input;

  const currentMinutes = parseHHMM(currentTime);
  const dayEndMinutes = parseHHMM(dayEndTime);
  const conflicts: ScheduleConflict[] = [];

  // 1. Detect Calendar Conflicts
  const sortedEvents = [...events].sort((a, b) => parseHHMM(a.start) - parseHHMM(b.start));
  for (let i = 0; i < sortedEvents.length; i++) {
    for (let j = i + 1; j < sortedEvents.length; j++) {
      const e1 = sortedEvents[i];
      const e2 = sortedEvents[j];
      if (doIntervalsOverlap(e1.start, e1.end, e2.start, e2.end)) {
        conflicts.push({
          id: `conflict-${e1.id}-${e2.id}`,
          description: `Conflict: "${e1.title}" (${e1.start}-${e1.end}) overlaps with "${e2.title}" (${e2.start}-${e2.end}).`,
          event_or_task_ids: [e1.id, e2.id],
          severity: 'conflict',
          suggested_resolution: e1.is_hard_constraint && !e2.is_hard_constraint
            ? `Reschedule "${e2.title}" as "${e1.title}" is a hard appointment.`
            : `Choose between ${e1.title} and ${e2.title} or shorten meeting lengths.`
        });
      }
    }
  }

  // 2. Gather Unfinished Tasks & Sort by Priority Hierarchy
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const sortedTasks = [...pendingTasks].sort((a, b) => getTaskPriorityWeight(b) - getTaskPriorityWeight(a));

  // 3. Top priorities (up to 3)
  const topPriorities = sortedTasks.slice(0, 3).map(t => t.title);

  // 4. Time Blocking Engine
  const schedule: DailyPlanBlock[] = [];
  const deferredTasks: Array<{ task_id: string; title: string; reason: string; suggested_date?: string }> = [];

  // Re-add previously completed blocks that occurred before or around now
  for (const block of preserveCompletedBlocks) {
    if (block.status === 'completed') {
      schedule.push(block);
    }
  }

  // Convert hard events into fixed blocks
  const fixedBlocks: DailyPlanBlock[] = sortedEvents
    .filter(e => parseHHMM(e.end) > currentMinutes)
    .map(e => ({
      id: `block-evt-${e.id}`,
      title: e.title,
      start: e.start,
      end: e.end,
      type: 'appointment',
      priority: 'fixed',
      status: parseHHMM(e.start) <= currentMinutes && parseHHMM(e.end) > currentMinutes ? 'current' : 'upcoming',
      notes: e.location ? `Location: ${e.location}. ${e.notes || ''}` : e.notes
    }));

  // Build the unified timeline from current time upwards
  let cursorMinutes = Math.max(currentMinutes, 9 * 60); // start at current time or 9:00

  // If user provided a specific current time (e.g., 16:00 replan), cursor begins right at currentMinutes
  if (currentMinutes > 9 * 60) {
    cursorMinutes = currentMinutes;
  }

  // Helper to test if a time interval collides with fixed events
  const findCollision = (startMins: number, endMins: number) => {
    return fixedBlocks.find(b => {
      const bStart = parseHHMM(b.start);
      const bEnd = parseHHMM(b.end);
      return Math.max(startMins, bStart) < Math.min(endMins, bEnd);
    });
  };

  // Helper to insert travel buffer if an event has a location and isn't immediate
  for (const evt of fixedBlocks) {
    const evtStartM = parseHHMM(evt.start);
    if (evtStartM > cursorMinutes && evt.notes && evt.notes.includes('Location:')) {
      const travelStartM = Math.max(cursorMinutes, evtStartM - 25);
      if (travelStartM < evtStartM && !findCollision(travelStartM, evtStartM)) {
        schedule.push({
          id: `buffer-travel-${evt.id}`,
          title: `Get ready / Travel to ${evt.title}`,
          start: minutesToHHMM(travelStartM),
          end: evt.start,
          type: 'travel',
          priority: 'fixed',
          status: 'upcoming',
          notes: 'Travel and transition window'
        });
      }
    }
    // Add the event itself to schedule
    schedule.push(evt);
  }

  // Now fit tasks into open gaps between now and dayEndMinutes
  // Max task block size based on energy
  const maxBlockDuration = energyLevel === 'low' ? 30 : energyLevel === 'medium' ? 50 : 75;

  for (const task of sortedTasks) {
    let remainingDuration = task.estimated_duration;
    let chunkIndex = 1;
    const totalChunks = Math.ceil(remainingDuration / maxBlockDuration);

    while (remainingDuration > 0) {
      if (cursorMinutes >= dayEndMinutes) {
        deferredTasks.push({
          task_id: task.id,
          title: task.title,
          reason: `Not enough daylight hours remaining (past ${dayEndTime}). Preserved for tomorrow without penalty.`,
          suggested_date: 'Tomorrow'
        });
        break;
      }

      // Check if cursor is inside a fixed block
      const collidingFixed = fixedBlocks.find(b => {
        const bStart = parseHHMM(b.start);
        const bEnd = parseHHMM(b.end);
        return cursorMinutes >= bStart && cursorMinutes < bEnd;
      });

      if (collidingFixed) {
        // Advance cursor past this fixed block plus a 10m buffer
        cursorMinutes = parseHHMM(collidingFixed.end) + 10;
        continue;
      }

      // Find next fixed block
      const upcomingFixed = fixedBlocks
        .filter(b => parseHHMM(b.start) > cursorMinutes)
        .sort((a, b) => parseHHMM(a.start) - parseHHMM(b.start))[0];

      const availableMinutesUntilNextFixed = upcomingFixed 
        ? parseHHMM(upcomingFixed.start) - cursorMinutes 
        : dayEndMinutes - cursorMinutes;

      // If open window is tiny (< 15 mins), add a short breather or jump
      if (availableMinutesUntilNextFixed < 15) {
        if (upcomingFixed) {
          cursorMinutes = parseHHMM(upcomingFixed.end) + 10;
        } else {
          cursorMinutes = dayEndMinutes;
        }
        continue;
      }

      // Determine chunk size
      const currentChunkDuration = Math.min(
        remainingDuration, 
        maxBlockDuration, 
        availableMinutesUntilNextFixed - 5 // keep small 5m buffer
      );

      if (currentChunkDuration < 15) {
        // Can't fit a meaningful slice here, advance
        if (upcomingFixed) {
          cursorMinutes = parseHHMM(upcomingFixed.end) + 10;
        } else {
          cursorMinutes = dayEndMinutes;
        }
        continue;
      }

      const chunkStart = minutesToHHMM(cursorMinutes);
      const chunkEnd = minutesToHHMM(cursorMinutes + currentChunkDuration);

      const chunkTitle = totalChunks > 1 
        ? `${task.title} (Part ${chunkIndex}/${totalChunks})`
        : task.title;

      schedule.push({
        id: `block-task-${task.id}-${chunkIndex}`,
        task_id: task.id,
        title: chunkTitle,
        start: chunkStart,
        end: chunkEnd,
        type: 'task',
        priority: task.priority,
        status: parseHHMM(chunkStart) <= currentMinutes && parseHHMM(chunkEnd) > currentMinutes ? 'current' : 'upcoming',
        definition_of_done: task.definition_of_done || `Finish ${chunkTitle}`,
        notes: task.description
      });

      remainingDuration -= currentChunkDuration;
      cursorMinutes += currentChunkDuration;
      chunkIndex++;

      // Suggest short break after a sustained block
      if (currentChunkDuration >= 45 && cursorMinutes + 15 <= dayEndMinutes) {
        const breakEnd = cursorMinutes + 15;
        // ensure break doesn't overlap next fixed block
        if (!upcomingFixed || breakEnd <= parseHHMM(upcomingFixed.start)) {
          schedule.push({
            id: `break-${cursorMinutes}`,
            title: 'Rest / Hydration Break',
            start: minutesToHHMM(cursorMinutes),
            end: minutesToHHMM(breakEnd),
            type: 'break',
            priority: 'flexible',
            status: 'upcoming',
            notes: 'Step away from screen, drink water, breathe.'
          });
          cursorMinutes = breakEnd;
        }
      }
    }
  }

  // Sort schedule strictly by start time
  schedule.sort((a, b) => parseHHMM(a.start) - parseHHMM(b.start));

  // Determine Next Action
  let nextAction: NextAction;
  const currentOrNextTaskBlock = schedule.find(b => 
    (b.type === 'task' || b.type === 'appointment') && 
    (b.status === 'current' || parseHHMM(b.end) > currentMinutes)
  );

  if (currentOrNextTaskBlock) {
    const duration = Math.max(15, parseHHMM(currentOrNextTaskBlock.end) - parseHHMM(currentOrNextTaskBlock.start));
    nextAction = {
      task_id: currentOrNextTaskBlock.task_id,
      title: currentOrNextTaskBlock.title,
      duration_minutes: duration,
      definition_of_done: currentOrNextTaskBlock.definition_of_done || 'Complete current focused milestone',
      rationale: `Prioritized to protect key deadlines without overloading.`,
      next_break_in_minutes: duration
    };
  } else {
    nextAction = {
      title: 'Day goals accomplished',
      duration_minutes: 0,
      definition_of_done: 'All planned blocks completed or deferred calmly.',
      rationale: 'No further urgent tasks for today.'
    };
  }

  // Concise Summary
  const taskCount = schedule.filter(s => s.type === 'task').length;
  const summary = `Constructed a calm ${taskCount}-block schedule prioritizing critical obligations first, reserving generous buffers and breaks.`;

  return {
    summary,
    top_priorities: topPriorities,
    schedule,
    conflicts,
    deferred_tasks: deferredTasks,
    next_action: nextAction,
    energy_level_assumed: energyLevel,
    generated_at: new Date().toISOString()
  };
}
