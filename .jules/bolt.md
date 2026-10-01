## 2026-10-01 - React Re-render Optimization for Analytics Aggregation
**Learning:** Found multiple instances where large arrays were mapped, filtered, or reduced inside standard component renders without memoization. This triggers expensive O(N) calculations multiple times unnecessarily, heavily impacting rendering performance, particularly in heavy analytical dashboards.
**Action:** Always wrap heavy data aggregation logic (like filtering list of objects or reducing attributes) inside a `useMemo` hook, referencing only the relevant dependencies, to maintain low render times.
