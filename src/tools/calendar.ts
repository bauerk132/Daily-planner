/**
 * Calendar Tool Interface and Adapters
 * Clean abstraction separating tool execution from agent reasoning
 */

import { CalendarEvent } from '../models/types.ts';

export interface CalendarAdapter {
  getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
  findOpenTime(date: string, durationMinutes: number): Promise<Array<{ start: string; end: string }>>;
}

export class MockCalendarAdapter implements CalendarAdapter {
  private events: CalendarEvent[];

  constructor(initialEvents?: CalendarEvent[]) {
    this.events = initialEvents || [
      {
        id: 'evt-1',
        title: 'Appointment with advisor / specialist',
        start: '12:00',
        end: '13:00',
        location: 'Downtown Health Center',
        notes: 'Bring ID and medical intake documents',
        is_hard_constraint: true
      },
      {
        id: 'evt-2',
        title: 'Weekly Team Sync',
        start: '15:00',
        end: '15:30',
        location: 'Virtual Meet',
        notes: 'Project status check',
        is_hard_constraint: false
      }
    ];
  }

  async getEvents(_startDate: string, _endDate: string): Promise<CalendarEvent[]> {
    // Return sorted by start time
    return [...this.events].sort((a, b) => a.start.localeCompare(b.start));
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt-${Date.now()}`
    };
    this.events.push(newEvent);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const idx = this.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.events[idx] = { ...this.events[idx], ...updates };
    return this.events[idx];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const initialLen = this.events.length;
    this.events = this.events.filter(e => e.id !== id);
    return this.events.length < initialLen;
  }

  async findOpenTime(_date: string, durationMinutes: number): Promise<Array<{ start: string; end: string }>> {
    const sorted = await this.getEvents(_date, _date);
    const dayStartMinutes = 9 * 60; // 09:00
    const dayEndMinutes = 18 * 60;  // 18:00
    const openSlots: Array<{ start: string; end: string }> = [];

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeStr = (totalMins: number) => {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    let currentCursor = dayStartMinutes;
    for (const evt of sorted) {
      const evtStart = toMinutes(evt.start);
      const evtEnd = toMinutes(evt.end);

      if (evtStart > currentCursor && evtStart - currentCursor >= durationMinutes) {
        openSlots.push({
          start: toTimeStr(currentCursor),
          end: toTimeStr(evtStart)
        });
      }
      currentCursor = Math.max(currentCursor, evtEnd);
    }

    if (dayEndMinutes - currentCursor >= durationMinutes) {
      openSlots.push({
        start: toTimeStr(currentCursor),
        end: toTimeStr(dayEndMinutes)
      });
    }

    return openSlots;
  }
}
