/**
 * Time utility functions for LifeOps Daily Planner
 */

export function getCurrentDateTime(): Date {
  return new Date();
}

export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
}

export function formatTimeHHMM(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function parseHHMM(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function minutesToHHMM(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function addMinutesToHHMM(timeStr: string, minutesToAdd: number): string {
  const currentMinutes = parseHHMM(timeStr);
  return minutesToHHMM(currentMinutes + minutesToAdd);
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const t = parseHHMM(time);
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  return t >= s && t <= e;
}

export function doIntervalsOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = parseHHMM(s1);
  const end1 = parseHHMM(e1);
  const start2 = parseHHMM(s2);
  const end2 = parseHHMM(e2);
  return Math.max(start1, start2) < Math.min(end1, end2);
}
