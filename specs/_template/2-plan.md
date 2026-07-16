# Technical Plan: <Feature Name>

## Status

- [ ] Draft
- [ ] **Approved** ← AI must not write code until this is checked

---

## Goals This Plan Addresses

<!-- List the goal IDs from 1-requirements.md that this plan covers.
     If a goal is out of scope for this plan, say so explicitly.

     G1 ✓ — covered by Tasks 1–2
     G2 ✓ — covered by Task 3
     G3 ✗ — out of scope for this plan (deferred to specs/payments-v2/) -->

## Assumptions

<!-- Every assumption that shapes this plan. Format: what + why + impact if false.
     Run /assume before writing this section — list what came up there.

     1. **`last_accessed_at` column already exists on `files`** — confirmed in schema.ts.
        If false: a migration is required before any task in this plan can run.

     2. **Fire-and-forget is acceptable for access recording** — a missed event
        is not a product defect for this use case.
        If false: need a queue with guaranteed delivery (significant scope increase). -->

## Approach

<!-- The simplest solution that satisfies the requirements. State it directly.
     If you considered a simpler approach and rejected it, say why in one line.

     Example: "A dedicated POST /api/files/[id]/access endpoint that issues a
     targeted UPDATE on last_accessed_at only, leaving updated_at untouched.
     Alternative: updating last_accessed_at in the existing PATCH /api/files/[id]
     — rejected because it would bump updated_at on every read, corrupting
     the 'modified' timestamp shown to users." -->

<!-- Optional artifacts: if this plan needs more depth in a specific area, /spec-plan
     may produce additional files alongside this one — reference them here:
       - 2a-data-model.md   — when persistence is non-trivial (schemas, migrations, ER)
       - 2b-api-contracts.md — when new external HTTP/RPC/event contracts are introduced
       - 2c-research.md      — when outstanding /research output belongs in the plan
     If unused, just delete this comment. -->

## Tradeoffs

<!-- Conscious sacrifices the chosen approach makes. Only include if they exist.
     Format: what we gain → what we give up → why that's acceptable here.

     Example:
     - Fire-and-forget for access recording → we may miss an event if the request
       fails silently → acceptable because a missed timestamp is not a product defect;
       showing a slightly stale "last opened" is better than adding latency to every open.
     - Separate POST endpoint instead of reusing PATCH → one extra HTTP round-trip
       per file open → acceptable because it keeps updated_at semantics clean,
       which is more important than saving a request.

     If the approach has no meaningful tradeoffs, write "none." -->

## Components Affected

<!-- Every file that will be modified or deliberately inspected. Use exact
     repo-relative paths only; no prose-only entries, directory summaries, or globs.
     Role must be New, Modified, or Reference. /spec-conflicts reads the Exact path
     column, so keep one path per row. -->

| Exact path | Role | Notes |
|---|---|---|
| `app/api/files/[id]/access/route.ts` | New | Add access-recording endpoint |
| `components/file-manager/itemButton.tsx` | Modified | Call recordFileAccess on open |
| `components/file-manager/FileInfoModal.tsx` | Modified | Add "Last opened" row |
| `lib/db/schema.ts` | Reference | Verify column type only; no changes |

## New Artifacts

<!-- New files, types, DB objects, or migrations that don't exist yet.

     File:      lib/file-manager/recordFileAccess.ts — client-side fire-and-forget helper
     Migration: none — column already exists
     Type:      none — reuses existing FileRecord -->

## What This Plan Does NOT Do

<!-- Mirror the non-goals from 1-requirements.md. Keeps the agent from drifting.

     - Does not sort files by last-opened date
     - Does not track access history — only the single most recent timestamp
     - Does not apply to folders — folder navigation is intentionally excluded -->

## External Dependencies

<!-- New packages, APIs, or services this plan introduces. If none, write "none". -->

## Risks & Open Questions

<!-- Technical risks that could change this plan. Unresolved items block approval.

     Risk: concurrent writes to last_accessed_at from multiple tabs.
     → Acceptable — last-write-wins is fine; no ordering guarantee needed.

     Open: should the client retry the POST if it fails silently?
     → Decision needed before Task 2 starts. -->

## Abort Criteria

<!-- Conditions that require stopping /spec-tasks and returning to this plan.
     Define them before starting — not when you're already stuck mid-execution.

     - Any assumption above is found to be false
     - recordFileAccess introduces measurable latency on file open (> 50ms p95)
     - A component listed in "Components Affected" has been significantly refactored
       since this plan was written, changing its interface
     - A task requires touching files not listed here -->

## Gap Handling

<!-- Implementation-time ambiguities, contradictions, or technical impossibilities
     are NOT recorded in this plan. Run /impl-gap and append to
     specs/<feature>/impl-gaps.md. If the resolution changes requirements or plan,
     escalate via /spec-amend before editing approved spec files. -->

## Verification

<!-- How to confirm each task is done. Link explicitly to scenarios in 1-requirements.md.

     Task 1: POST /api/files/[id]/access returns 200 and updates only last_accessed_at
             (run: check DB row — last_accessed_at changed, updated_at unchanged)
     Task 2: opening a file via any of the four paths triggers the POST
             (run: network tab or test spy — POST fires on lightbox, drawer, viewer, canvas)
     Task 3: "Scenario: file that has been opened…" and "Scenario: file that has
             never been opened…" both pass as integration tests -->

## Task Count Estimate

<!-- Rough count: N tasks -->

---

## Approval

Date:
Approved by:
Notes:
