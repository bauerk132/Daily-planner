## 2024-05-18 - Init
## 2025-03-09 - Accessible Icon Buttons and Efficient Interval Handling
**Learning:** UX improvements must prioritize accessibility such as ARIA labels for icon-only buttons and visible focus states, while React timer intervals must cleanly mount and unmount to prevent memory leaks and unnecessary rerenders.
**Action:** Always include aria-label attributes and Tailwind's focus-visible utilities on icon buttons. Ensure any setInterval cleanly cleans up on effect dismount and only runs when actively needed.
