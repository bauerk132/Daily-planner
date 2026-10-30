## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.
## 2026-10-30 - [Extracting O(N) Array Operations from JSX Loops]
**Learning:** [When dealing with large arrays, filtering inside JSX map loops can lead to significant application-wide slow-downs due to repeated O(N) recalculations on every render. ]
**Action:** [Extract the filtering calculation into a dictionary at the component root level and wrap it in a useMemo hook, so that the mapped elements can access O(1) dictionary properties instead.]
