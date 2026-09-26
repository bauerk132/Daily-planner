## 2024-05-24 - Optimizing setInterval Hooks in React
**Learning:** Using variables from a `useEffect` dependency array inside a `setInterval` causes the interval to be repeatedly cleared and recreated on every value change, creating unnecessary overhead and potentially imprecise timing.
**Action:** When a timer depends on its own previous state (e.g., a countdown), use a functional state update (like `setSecondsRemaining(prev => prev - 1)`) and remove the state variable from the `useEffect` dependency array to ensure the interval is instantiated only once.
