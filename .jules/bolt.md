## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2025-03-05 - React Performance: Single-Pass Memoization for Multiple Aggregations
**Learning:** When multiple related counts or metrics need to be derived from the same array (e.g., calculating counts for different status tabs), performing separate `.filter()` operations for each metric results in multiple passes over the array. If this happens inside a loop (like a `.map()` for rendering tabs), it compounds the performance cost.
**Action:** Instead of calling `.filter()` multiple times, use a single-pass `useMemo` block that iterates over the array once and aggregates all necessary counts into an object or dictionary. The derived object can then be used safely during rendering without redundant iterations.
