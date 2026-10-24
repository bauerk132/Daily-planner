## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2026-10-24 - Extracting O(N) operations out of JSX map loops
**Learning:** Performing O(N) operations like `.filter()` or `.reduce()` inside of a JSX loop (e.g., `.map()`) results in O(N*M) complexity (where M is the number of mapped elements), which can severely degrade performance on every render.
**Action:** Extract the expensive logic outside the JSX loop into a root-level dictionary/object and wrap it with a `useMemo` hook so the heavy work is only done once per data change, and the loop just accesses properties O(1).
