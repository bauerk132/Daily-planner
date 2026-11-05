## 2024-05-24 - Optimize O(N) array filtering in JSX loops
**Learning:** Performing O(N) array operations (like `.filter()` or `.map()`) directly inside JSX loops triggers those operations multiple times per render, which can cause serious application-wide slowdowns as data scales.
**Action:** Extract expensive filtering or sorting logic out of the JSX loops, compute the values once at the component root level, and store them in an object/dictionary wrapped in `useMemo`. Then, simply access those pre-computed values by key inside the loop.
