## 2024-06-25 - Prevent UI Rerenders via Hook Memoization
**Learning:** Functions passed as props down a large component tree cause child components to re-render constantly if not memoized, destroying performance in complex UI views.
**Action:** Use `useCallback` for event handlers passed down to multiple children, and `React.memo` for heavy pure visual components (like Timeline) that map over large arrays.
