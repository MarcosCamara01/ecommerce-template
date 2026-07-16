# Requirements: <Feature Name>

> **Decisions and trade-offs only — no implementation.** Code snippets are allowed
> only when they reduce ambiguity (e.g. a function signature, an example input/output,
> a concrete error shape). If a snippet is doing anything more than that, it belongs
> in `2-plan.md`, not here.

## Status

- [ ] Draft
- [ ] Reviewed
- [ ] Ready for /spec-plan — all open questions resolved, all scenarios written

---

## Problem Statement

<!-- Who has this problem? What is the pain? How often does it happen?
     What is the cost of NOT solving it?

     ✗ Weak:  "Users want to see their files better."
     ✓ Strong: "Users who manage 100+ files have no way to know which files
               they recently opened — they re-navigate from scratch every session,
               which wastes time and causes them to re-open the wrong version." -->

## Goals

<!-- Label each goal so plans and tasks can reference them by ID.
     Write in measurable, user-visible terms.
     ✗ Weak:  "Improve the file browsing experience."
     ✓ Strong: "Users can see the last-opened timestamp on any file." -->

- **G1**:
- **G2**:
- **G3**: <!-- add or remove lines as needed -->

## Non-Goals

<!-- Explicitly state what this does NOT cover.
     This section is as important as Goals — it prevents scope creep before planning starts.

     Example:
     - Does not include sorting files by last-opened date (separate feature)
     - Does not track access history — only the most recent timestamp
     - Does not apply to folders -->

## Acceptance Criteria

<!-- Each scenario is a verifiable contract. Write them so a test can be derived
     directly from the prose. Name real fields, status codes, UI elements, routes.

Scenario: file that has been opened shows its last-opened timestamp
  Given: a file has been opened at least once (last_accessed_at is not null)
  When: the user opens the file info modal
  Then: a "Last opened" row is visible with the formatted timestamp
    And: the timestamp matches the most recent recorded access time

Scenario: file that has never been opened hides the timestamp row
  Given: a file has never been opened (last_accessed_at is null)
  When: the user opens the file info modal
  Then: the "Last opened" row is not rendered

Scenario: <add one scenario per distinct behavior>
  Given: <precondition — system state before the action>
  When: <action or event that triggers the behavior>
  Then: <primary expected outcome>
    And: <secondary outcome, if any>
-->

## Constraints

<!-- Group by type. Be explicit — vague constraints produce unexpected tradeoffs.

     Technical:  "Must not add a DB migration — the column already exists with a default."
     Business:   "Must ship before the Q2 demo on May 15."
     UX:         "Must match the existing row layout in the info modal — no redesign." -->

## Assumptions

<!-- What this document is taking as given about users, business rules, or scope.
     Different from Constraints (hard rules from outside) and Open Questions (unresolved).
     Each assumption must be **falsifiable** — something the reader could correct.
     Generic filler ("users want a good experience") is not an assumption.

     Format: what + why we're assuming it + what changes if it's wrong.

     Example:
     1. **Users only need the most recent open timestamp, not a history.** — based on
        the original feature request; nobody asked for history.
        If wrong: the data model needs an access_log table, not a single column.

     2. **"Opening" means clicking into the file viewer, not previewing in a list.** —
        list previews are passive, not deliberate access.
        If wrong: the trigger surface expands and we'd record many more events. -->

## Open Questions

<!-- Mark each question by whether it blocks planning or can be decided during it.

     ⛔ Blocking — /spec-plan cannot start until this is resolved:
        Does folder navigation count as "opening" a file?

     ⚠️ Non-blocking — can be decided during planning with a reasonable default:
        Should the timestamp be relative ("3 days ago") or absolute ("Apr 12, 14:30")? -->

## Clarifications

<!-- Populated by /spec-clarify (pre-plan) or appended by /spec-amend (post-approval).

     Format — use checkboxes so /spec-plan can detect unanswered blocking questions:
       - [ ] ⛔ BLOCKING — <question>
       - [x] ⛔ BLOCKING — <question> → <answer>
       - [ ] ⚠️ NON-BLOCKING — <question> (default if unanswered: <assumed default>)
       - [x] ⚠️ NON-BLOCKING — <question> → <answer>

     /spec-plan must stop if any "[ ] ⛔ BLOCKING" entry exists with no answer.
     Non-blocking questions without an answer proceed with the stated default.

     Example:
     - [x] ⛔ BLOCKING — Does folder navigation count as "opening" a file? → No. Only files opened in the viewer count. Trigger surface stays narrow.
     - [x] ⚠️ NON-BLOCKING — Timestamp format? → Relative ("3 days ago"); switch to absolute on hover.
-->
