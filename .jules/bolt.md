## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.
## 2026-10-26 - React Performance: Memoizing O(N) Array Operations in Loops
**Learning:** Performing O(N) operations inside a mapping loop (e.g. `array.map(() => array.filter(...))`) results in O(N^2) complexity which causes major performance bottlenecks.
**Action:** Extract expensive filtering logic outside the loop into a dictionary/object at the component root level, wrapped with `useMemo`, and access values via O(1) object lookup inside the JSX loop.
