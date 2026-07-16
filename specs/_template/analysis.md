# Cross-Consistency Analysis — <Feature Name>

Date: <YYYY-MM-DD>
Re-runs overwrite this file. Output is advisory — the human decides whether to amend or accept each gap.

---

## 1. Goal-to-Task Coverage

Every goal ID (G1, G2…) from `1-requirements.md` must appear in at least one task in `3-tasks.md`.

| Goal | Referenced in task(s) | Status |
|------|-----------------------|--------|
| G1   | | ✅ / ❌ |

### Missing goals
<!-- Goals with no referencing task — these are coverage gaps -->

---

## 2. Plan-to-Task Coverage

Every entry in "Components Affected" in `2-plan.md` must appear in at least one task's Changes field.

| Component | Referenced in task(s) | Status |
|-----------|-----------------------|--------|
|           | | ✅ / ❌ |

### Missing components
<!-- Components with no referencing task — may indicate unplanned work or an incomplete task list -->

---

## 3. Scope Creep

Tasks that do not reference any goal ID may be out of scope.

| Task | Goals referenced |
|------|-----------------|
|      |                 |

### Findings
<!-- Tasks with no goal reference — flag for human review. May be legitimate (housekeeping) or genuine scope creep. -->

---

## Conclusion

<!-- Advisory summary. For each miss: state whether to add a task, add a goal, or accept the gap as intentional. -->
