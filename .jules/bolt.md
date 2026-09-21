## 2025-03-09 - Memoizing derived data in React
**Learning:** Using `useMemo` in React components prevents unnecessary recalculations of derived data (like analytics charts and complex array manipulations), improving render performance especially when toggling views.
**Action:** When a component derives expensive data from props, always use `useMemo` to cache the calculation until the props change.
