# Tasks: <Feature Name>

## Status

Plan approved: <!-- date -->

---

## Rules

- One task at a time — finish it completely before moving on
- Write the test first — it must fail (red) before any implementation; implement until green; then run the full suite
- Each task touches only what's needed — no cleanup of adjacent code
- If a task reveals ambiguity, contradiction, impossibility, or new scope, STOP and run /impl-gap. If requirements or plan must change, escalate to /spec-amend before editing approved spec files.

---

## Tasks

- [ ] **Task 1**: <!-- Single-line description of what this task does.
                      Example: "Create POST /api/files/[id]/access route that updates
                      last_accessed_at without bumping updated_at" -->
  - Test: <!-- What to write first, and what "red" looks like before implementation.
              Example: "POST /api/files/[id]/access with a valid fileId returns 200
              and the DB row shows last_accessed_at updated, updated_at unchanged
              — must fail before the route file exists." -->
  - Changes: <!-- Files to touch and what specifically changes in each.
                 Example: "create app/api/files/[id]/access/route.ts — PATCH targeting
                 only last_accessed_at; create lib/files/recordFileAccess.ts — thin
                 fetch wrapper, fire-and-forget, no return value." -->
  - Goal: <!-- Goal ID from 1-requirements.md this task moves forward. Example: "G1" -->
  - Criterion: <!-- Acceptance scenario this task satisfies. Example: "Scenario: file that has been opened shows its last-opened timestamp" -->
  - Tradeoff: <!-- what we gain → what we give up → why acceptable. Omit if not applicable. -->

- [ ] **Task 2**: <!-- description -->
  - Test: <!-- what to write first and what red looks like -->
  - Changes: <!-- files + specific changes in each -->
  - Goal: <!-- goal ID from 1-requirements.md -->
  - Criterion: <!-- scenario name from 1-requirements.md -->
  - Tradeoff: <!-- omit if not applicable -->

<!-- Add tasks as needed. One logical change per task.
     If two changes always need to happen together to keep tests green, they are one task.
     If two changes can be verified independently, they are two tasks. -->

---

## Completion

- [ ] All tasks done
- [ ] Every acceptance scenario in 1-requirements.md covered by a passing test
- [ ] /verify completed
- [ ] /review completed with `review-report.md`
- [ ] Spec moved to `specs/_done/<name>/`
