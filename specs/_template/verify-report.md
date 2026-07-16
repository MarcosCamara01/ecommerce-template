# Verify Report — <Feature Name>

Date: <YYYY-MM-DD>
Spec: specs/<feature>/
Result: <PASS|FAIL>

<!-- Fill `Result:` with exactly `PASS` or `FAIL` (no bold, no extra text).
     `sddguard status` reads this line, and `gate finish` also requires
     every check row below to have PASS/FAIL status plus concrete evidence. -->

---

## Checks

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | All tasks in `3-tasks.md` marked complete | | |
| 2 | Every goal (G1, G2…) has a referencing task and an observable artifact | | |
| 3 | Every acceptance scenario has a corresponding passing test | | |
| 4 | Full test suite passes | | |
| 5 | No files modified outside "Components Affected" in `2-plan.md` | | |
| 6 | No unresolved `/impl-gap` entries | | |
| 7 | No CRs in "Pending approval" status | | |

<!-- Replace every blank Status cell with PASS or FAIL, and every blank Evidence
     cell with the concrete command, file, test, or artifact that proves it. -->

---

## Detail

### Tasks
<!-- List each task from 3-tasks.md and its completion artifact (file, test, route, etc.) -->

### Goals
<!-- List each G-ID from 1-requirements.md with the task(s) that implement it -->

### Scenarios
<!-- List each BDD scenario with its test file and pass/fail status -->

### Scope
<!-- List all modified files and confirm each appears in "Components Affected" -->

### Gaps and CRs
<!-- State of any open impl-gaps.md or amendments.md entries -->

---

## Conclusion

<!-- One sentence summary. If `Result: FAIL`, name each failing check and the artifact needed to resolve it. -->
