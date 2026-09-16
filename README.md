# LifeOps Daily Planner

A production-quality personal operations AI agent that organizes your day, prioritizes critical obligations, manages calendar commitments, breaks complex projects into manageable steps, and dynamically replans schedules based on available time and energy.

Designed as a standalone agent today, and architected as a clean sub-agent component for the future multi-agent **LifeOps** ecosystem.

---

## Key Capabilities

1. **Deterministic & AI-Assisted Scheduling**: Uses a 10-step constraint engine to construct realistic time blocks (30–90m) with buffers, meals, and transition times.
2. **Prioritization Hierarchy**:
   - Level 1: Immediate safety, housing, critical administrative deadlines (protected first)
   - Level 2: Hard appointments
   - Level 3: Exams and hard academic deadlines
   - Level 4: Work/career commitments
   - Level 5: Important administrative tasks
   - Level 6: Flexible project work
   - Level 7: Optional improvements
3. **Calm, Non-Judgmental Replanning**: When circumstances shift (e.g. *"I didn't get anything done and it's already 4 PM"*), the agent reconstructs the rest of the day starting from current time without scolding or shaming.
4. **Focus Mode**: Clears away the intimidating backlog to display **only** the single active task, duration, definition of done, and next break.
5. **Project Deconstruction**: Deconstructs high-friction projects into sequential milestones, subtasks with dependencies, and a low-friction initial action.
6. **Morning Briefing & Evening Review**: Daily start-of-day digest and reflective wrap-up preparing tomorrow's anchors.
7. **Tool Abstraction Layer**: Clean interfaces for `CalendarAdapter`, `TasksAdapter`, and `EmailAdapter` allowing mock testing today and live Google Calendar, Outlook, Todoist, or Gmail integrations tomorrow without altering agent logic.

---

## Architecture Overview

```
/
├── server.ts                 # Express API server & Vite middleware
├── src/
│   ├── models/
│   │   └── types.ts          # Core data models (Task, CalendarEvent, DailyPlanBlock, etc.)
│   ├── tools/
│   │   ├── calendar.ts       # CalendarAdapter interface & mock implementation
│   │   ├── tasks.ts          # TasksAdapter interface & mock implementation
│   │   ├── email.ts          # EmailAdapter interface (safety confirmed)
│   │   └── time.ts           # Time math & interval conflict detection
│   ├── agent/
│   │   ├── prompts.ts        # Behavioral instructions & conversational tone
│   │   ├── planning_logic.ts # 10-step deterministic constraint engine
│   │   └── planner_agent.ts  # LifeOpsPlannerAgent sub-agent interface
│   ├── ui/
│   │   ├── Header.tsx        # Top navigation & simulated time controls
│   │   ├── FocusCard.tsx     # Focused active task widget & timer
│   │   ├── Timeline.tsx      # Visual schedule & time blocks
│   │   ├── DailyAnalytics.tsx # Recharts progress & priority distribution charts
│   │   ├── MorningBriefingCard.tsx # Start-of-day digest
│   │   ├── TaskBacklog.tsx   # Priority queues & deferred task insight
│   │   ├── ChatPanel.tsx     # Conversational assistant
│   │   ├── ProjectBreakdownView.tsx # Milestone & subtask decomposer
│   │   ├── EveningReviewView.tsx    # Daily closure & reflection
│   │   └── TestRunnerView.tsx       # Live in-browser test suite runner
│   ├── tests/
│   │   ├── agent_tests.ts    # 10 automated test scenarios
│   │   └── run_cli_tests.ts  # Node/CLI test runner
│   └── App.tsx               # Primary UI coordinator
```

---

## Future Multi-Agent Compatibility

The `LifeOpsPlannerAgent` class strictly exposes clean hooks designed to be callable by a parent **LifeOps Orchestrator**:

```typescript
import { LifeOpsPlannerAgent } from './agent/planner_agent.ts';

const agent = new LifeOpsPlannerAgent({
  calendarAdapter: myCalendarProvider,
  tasksAdapter: myTasksProvider,
  emailAdapter: myEmailProvider
});

// Orchestration hooks:
const plan = await agent.plan_day(context);
const replanned = await agent.replan_day(context);
const briefing = await agent.create_morning_briefing(context);
const projectRoadmap = await agent.break_down_project("Move to new apartment");
const nextMove = await agent.get_next_action(context);
```

---

## Automated Test Suite (10 Core Scenarios)

The test suite covers:
1. **Overloaded Schedule**: User has too many tasks for available daylight hours -> defers excess without guilt.
2. **Calendar Collisions**: User has overlapping events -> detects conflict and suggests resolution.
3. **Late Start**: User starts day late (e.g. 14:00) -> builds schedule from 14:00 forward while protecting critical obligations.
4. **Missed Work Block**: User misses earlier blocks -> reconstructs remaining evening hours without penalty.
5. **Early Task Completion**: User checks off a task -> advances next action seamlessly.
6. **New Urgent Task**: New emergency or deadline appears -> elevated immediately to #1 priority.
7. **Large Task Chunking**: A 180-minute task is broken into 30–60m manageable parts with rest buffers.
8. **Calendar Outage**: Calendar API fails or is unavailable -> fails gracefully with open schedule.
9. **Task Provider Outage**: Task service fails or is empty -> handles gracefully without unhandled crashes.
10. **Zero Obligations**: User has an empty day -> returns calm guidance and affirms open rest.

Run the test suite via CLI:
```bash
npm run test
# or
npx tsx src/tests/run_cli_tests.ts
```

Or view and execute them interactively inside the web app under the **Automated Tests** tab.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- npm

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Add your Gemini API key (optional for local deterministic logic, recommended for full conversational AI features):
```env
GEMINI_API_KEY="YOUR_KEY_HERE"
```

### 3. Local Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Production Build & Start
```bash
npm run build
npm run start
```
