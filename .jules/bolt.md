## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2026-11-12 - React Performance: Single-Pass Aggregations with Standard For Loops
**Learning:** For performance micro-optimizations in array iterations inside `useMemo` blocks, standard `for` loops are typically faster in V8 than higher-order array methods like `.forEach` or `.filter`. Chaining multiple array methods also creates intermediate arrays which increases garbage collection overhead.
**Action:** When deriving multiple related metrics or counts from the same large array in React components, use a single-pass `useMemo` block with a standard `for` loop to aggregate counts or derived data into an object, rather than calling `.filter()` or `.reduce()` multiple times.
