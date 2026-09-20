## 2024-03-05 - Time parsing optimization in loops
**Learning:** Calling `parseHHMM` inside loops dynamically when sorting or comparing `fixedBlocks` and events added massive overhead.
**Action:** Pre-compute and store parsed times (`startMins`, `endMins`) when preparing lists of events/blocks before the constraint checking loops.