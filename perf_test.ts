import { generateDailyPlan } from './src/agent/planning_logic.ts';
import { Task, CalendarEvent } from './src/models/types.ts';

const tasks: Task[] = Array.from({ length: 1000 }).map((_, i) => ({
  id: `task-${i}`,
  title: `Task ${i}`,
  category: i % 2 === 0 ? 'work_career' : 'personal',
  priority: i % 3 === 0 ? 'urgent' : 'flexible',
  estimated_duration: 30,
  status: 'pending',
  labels: []
}));

const events: CalendarEvent[] = Array.from({ length: 100 }).map((_, i) => {
  const startHr = 9 + Math.floor(i / 10);
  const startMin = (i % 10) * 5;
  return {
    id: `event-${i}`,
    title: `Event ${i}`,
    start: `${startHr.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
    end: `${startHr.toString().padStart(2, '0')}:${(startMin + 5).toString().padStart(2, '0')}`,
    is_hard_constraint: true
  };
});

const start = performance.now();
for (let i = 0; i < 50; i++) {
  generateDailyPlan({
    currentTime: '09:00',
    events,
    tasks
  });
}
const end = performance.now();
console.log(`Execution time: ${end - start} ms`);
