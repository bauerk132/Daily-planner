## 2025-03-04 - React Performance: Memoizing O(N) Array Operations
**Learning:** Found that non-memoized array filtering operations in components like `EveningReviewView`, `TestRunnerView`, and `TaskBacklog` can cause significant UI re-render slowdowns across the application when tasks are updated.
**Action:** Always wrap O(N) or worse operations derived from large arrays in `useMemo` hooks (e.g. `const completedTasks = useMemo(() => tasks.filter(...), [tasks])`).
