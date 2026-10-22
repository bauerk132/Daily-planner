## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2025-03-05 - Optimizing Array Mapping in JSX
**Learning:** Performing O(N) operations inside `Array.map` within a component return statement (JSX) can cause a severe slowdown, as these calculations run repeatedly for every render cycle.
**Action:** Extract O(N) calculations from within JSX mapping loops into a standalone object or dictionary defined at the root of the component. Wrap the creation of this dictionary in `useMemo` so it evaluates only when the underlying data source changes.
