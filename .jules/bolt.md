## 2025-02-28 - [Memoizing Derived State in UI Components]
**Learning:** Heavy array aggregations (like grouping tasks by priority or calculating completion percentages from large lists) can cause significant UI blocking if calculated inline during every render cycle.
**Action:** Always wrap non-trivial derived state computations in `React.useMemo` to skip recalculation unless the dependencies (e.g. the base data array) actually change.
