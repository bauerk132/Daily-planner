## 2023-10-27 - Performance Optimization in React UI Components
**Learning:** O(N) operations like `filter`, `map`, and `reduce` on arrays can cause application-wide re-render slowdowns if not memoized, especially with large datasets in complex views like analytics dashboards.
**Action:** Always wrap these operations in `useMemo` hooks, with proper dependency arrays, to ensure they only recompute when their dependent state changes.
