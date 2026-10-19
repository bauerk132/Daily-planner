## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2025-03-04 - React Performance: Extracting O(N) Arrays Outside Render Loops
**Learning:** Performing array aggregations, filtering, or sorts inside of a JSX render loop (`.map()`) causes React to execute O(N) operations repeatedly during rendering, which rapidly scales up and causes application lag.
**Action:** Always extract O(N) array calculations to a root-level dictionary or object using `useMemo` ahead of the `.map()` loop (e.g. creating `const counts = useMemo(() => ..., [tasks])` before returning the JSX), ensuring these calculations are done once per state change rather than on every iteration of the loop during render.
