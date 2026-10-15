## 2026-10-15 - React Performance: Memoizing O(N) Array Operations
**Learning:** Re-computing expensive O(N) operations like `.filter()`, `.reduce()`, or `.sort()` derived from large arrays directly inside the component body can cause application-wide slowdowns, particularly if the component frequently re-renders.
**Action:** Always wrap O(N) or worse operations (e.g., filters, sorts, aggregations for charts) derived from large arrays in `useMemo` hooks to prevent application-wide re-render slowdowns. Include comments explaining the optimization within the code.
