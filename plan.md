1. **Optimize `src/ui/TaskBacklog.tsx`**
   - Combine multiple `tasks.filter` loops into a single `useMemo` block that calculates `pending`, `completed`, `recurring`, and `all` counts simultaneously.
   - Replace the multiple `tabCounts` related lines and `recurringCount` with a unified `tabCounts` object.
   - Run verification step immediately to check changes.

2. **Optimize `src/ui/EveningReviewView.tsx`**
   - Replace the two `tasks.filter` loops that calculate `completedTasks` and `pendingTasks` with a single `useMemo` block that returns an object containing both arrays via a single pass over `tasks`.
   - Run verification step immediately to check changes.

3. **Improve UX/Accessibility in `src/ui/Header.tsx`**
   - Add `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-stone-500` to interactive buttons in `src/ui/Header.tsx` to align with the rest of the application's accessibility standards.
   - The interactive elements include the quick time jump buttons, energy selector buttons, replan button, and navigation tabs.
   - Run verification step immediately to check changes.

4. **Improve UX/Accessibility in `src/ui/DailyAnalytics.tsx`**
   - Add `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-stone-500` to the interactive View toggle buttons in `src/ui/DailyAnalytics.tsx`.
   - Run verification step immediately to check changes.

5. **Ensure Code Quality & Tests Pass**
   - Run `pnpm run lint` and `pnpm run build` and `pnpm dlx tsx src/tests/run_cli_tests.ts` to make sure there are no regression or syntax errors.

6. **Pre-Commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit Changes**
   - Commit the changes and request human review.
