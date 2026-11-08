## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.
## 2026-11-08 - Accessibility: Focus-Visible State
**Learning:** UX improvements must prioritize accessibility (e.g., ARIA labels for icon-only buttons, focus-visible states), reuse existing Tailwind classes.
**Action:** When applying focus-visible states for accessibility consistency across UI elements, use the Tailwind classes `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-stone-500`.
