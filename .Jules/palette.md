## 2024-05-18 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons across this application (ChatPanel, MorningBriefingCard, Timeline) consistently rely on visual context or `title` attributes alone, lacking proper `aria-label`s and `focus-visible` keyboard focus indicators.
**Action:** When implementing or modifying icon-only buttons, always ensure they have an explicit `aria-label` and `focus-visible:ring-2` to support screen readers and keyboard navigation.
