## 2025-03-01 - React Re-render Optimization
**Learning:** O(N) operations deriving data from large arrays in React functional components can cause application-wide slowdowns if recalculated on every render.
**Action:** Always wrap these operations (filters, sorts, aggregations) in `useMemo` hooks with correct dependency arrays.
