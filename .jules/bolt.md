## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** In React applications, especially those dealing with frequent state updates (like a ticking clock or live schedule), recalculating derived state (filtering, sorting, aggregation) from large arrays on every render can cause significant performance bottlenecks and application-wide slowdowns.
**Action:** Always wrap O(N) or worse operations derived from large arrays (e.g., `tasks.filter(...)`, `schedule.reduce(...)`) in `useMemo` hooks to ensure these expensive calculations are only re-run when their specific dependencies (`tasks`, `schedule`) change, not on every component re-render.

## 2026-10-18 - React Performance: Strict Memoization for Complex Derived UI Arrays
**Learning:** Inline array operations (like `.filter()`) used frequently in loops (e.g. inside JSX `.map()` callbacks) multiply performance issues as application state grows.
**Action:** Extract expensive logic (like counting tabs via `.filter()`) outside of loops into an object or dictionary structure, and strictly wrap them with `useMemo` at the component root level according to React's Rules of Hooks.
