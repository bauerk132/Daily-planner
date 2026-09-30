## 2024-03-31 - [Daily Analytics Performance Fix]
**Learning:** React performance can degrade significantly when performing O(N) or worse operations (filters, sorts, aggregations for charts) derived from large arrays without memoization on every render.
**Action:** Always wrap expensive operations derived from large datasets (like `tasks` arrays) in `useMemo` hooks to prevent application-wide re-render slowdowns.
