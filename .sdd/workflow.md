# SDD Protocol — Workflow

This file defines how AI agents interact with this codebase.
Read it before starting any task.

---

## Execution Principles

These rules apply to every command. They are not suggestions.

1. **Surface assumptions** — before writing code, state what you're assuming. If something is unclear, stop and ask. Do not pick an interpretation silently. If a simpler approach exists, say so — push back when warranted.
2. **Minimum code** — implement only what was asked. No extra abstractions, no "while I'm here" cleanups, no speculative flexibility, no error handling for impossible scenarios. Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
3. **Surgical changes** — touch only the lines the task requires. Do not reformat, rename, or refactor adjacent code. Match existing style, even if you'd do it differently. Remove imports, variables, and functions that *your* changes made unused — do not remove pre-existing dead code unless asked. Test: every changed line should trace directly to the user's request.
4. **Verify before moving on** — define what "done" looks like before you start. Transform vague tasks into verifiable goals: "Fix the bug" → "Write a test that reproduces it, then make it pass." Strong success criteria let you loop independently without constant clarification. A task isn't done until its verification passes.
5. **Use the right channel for changes** — once `1-requirements.md` and `2-plan.md` are approved, they are read-only. To change them, use `/spec-amend`. When an ambiguity blocks execution, use `/impl-gap`. Never edit approved spec files silently.

---

## Autonomy Policy

Read `.sdd/autonomy.md`, identify its `Mode`, and apply its `Operating Mode` before
deciding whether a stop point requires human approval or has been delegated to the
agent. Delegated self-approval is allowed only when that policy explicitly permits it.
If the policy does not clearly allow self-approval for the current situation, stop and
ask.

Delegated approvals must leave the same artifact trail as human approvals: update the
plan approval marker, CR status, gap resolution, review report, or finish summary with
a note that the decision was self-approved per `.sdd/autonomy.md`.

Hard stops still stop. Ambiguity, contradiction, unresolved gaps, pending CRs, failing
tests, unlisted scope, destructive changes, new dependencies, high-risk domains, and
release/publish actions require the handling defined by this workflow and the policy.

---

## Commands

### /bootstrap
**Purpose:** Populate `.sdd/project-overview.md` and `.sdd/conventions.md` with real project context. Run once at project start, or when joining an existing codebase.

Two modes:

**New project — interview mode:**
Ask the following questions one at a time, waiting for a full answer before continuing:

1. What problem does this app solve? Who is it for?
2. What is the tech stack? (framework, database, auth, hosting, key libraries)
3. What are the explicit non-goals — what will this app intentionally NOT do?
4. Are there architecture decisions already made? (patterns, constraints, things that cannot change)
5. What are the main business domains? (e.g. auth, payments, orders, notifications)
6. What does "production ready" mean here? (performance targets, compliance, security requirements)

**Existing project — scan mode (`/bootstrap --scan`):**
Before asking anything, read the codebase:
- Project structure, `package.json` / dependency manifests, environment files
- Schema definitions, migration files, route declarations
- Main entry points and key components

Infer what you can from the code. Ask only about what the code cannot answer:
- Business intent behind models or patterns ("I see `Order` and `Product` — is this B2C or B2B?")
- Whether patterns are deliberate or shortcuts ("Is X intentional or a workaround?")
- Non-goals that aren't visible in code
- What "done" means for this team

> For discovery-only without writing anything, use `/scan` instead. `/bootstrap --scan` is the shortcut that does scan + bootstrap in one.

⛔ **STOP. Present the full draft of `project-overview.md` and `conventions.md` for review before writing anything. Do not save files until both are explicitly approved.**

After approval:
- Write `.sdd/project-overview.md`
- Update `.sdd/conventions.md` with confirmed stack and patterns
- Update `CLAUDE.md` to reference `.sdd/project-overview.md`

---

### /scan
**Purpose:** Discovery pass over an existing codebase. Writes no `.sdd/` files — produces a report only.

Use when: you want to understand a project before committing to `/bootstrap`, or to refresh awareness of structural changes.

Process:
1. Read `package.json` / dependency manifests, environment files
2. Scan directory structure, naming conventions, import patterns
3. Identify ORM, router, state-management, auth, lint/format configs
4. Detect existing patterns the agent should preserve (file layout, exports style, test structure)
5. Write `scan-report.md` at repo root with findings — frameworks detected, observed conventions, open questions about intent

Rules:
- No file outside `scan-report.md` is created or modified
- Report is advisory; nothing is enforced
- If the user wants `.sdd/` populated from the scan, they re-run `/bootstrap --scan` (which uses this report as input)

---

### /ask
**Purpose:** Research and exploration. No code changes.

Use when: understanding a system, gathering context, analyzing options, investigating a bug.

Rules:
- Read files, search, analyze — never modify
- If the question has multiple valid interpretations, surface all of them; do not pick one silently
- If something is ambiguous or surprising, name it explicitly
- End with a clear summary and explicit options or recommendations
- Do NOT proceed to implementation without explicit instruction

---

### /research
**Purpose:** Targeted exploration that produces a non-binding research artifact.

Usage: `/research <feature> <topic>`

Use when: comparing frameworks, libraries, patterns, or architectures *before* drafting a plan. Separates exploration from commitment.

Process:
1. Read the relevant `specs/<feature>/1-requirements.md` to understand context
2. Investigate options (web search if available, codebase scan, dependency analysis)
3. Write `specs/<feature>/research-<topic>.md` (slugify `<topic>` for the filename) with:
   - **Options** — each candidate (framework, library, approach)
   - **Pros and cons** — concrete tradeoffs, not generic ones
   - **Current state** — latest version, maintenance status, community signals
   - **Recommendation (non-binding)** — agent's pick with a one-line justification

Rules:
- The artifact is exploratory; `/spec-plan` decides what gets adopted
- The agent does not write to `2-plan.md` from this command
- Multiple `research-*.md` files per feature are fine (one per topic)

---

### /assume
**Purpose:** Surface all assumptions before acting on a task.

Use when: before running /spec-plan, before a complex diagnosis in /bugfix, or any time you realize you're making an unstated guess about requirements, codebase state, or technical decisions.

Process:
1. List every assumption, numbered, in plain language
2. For each one: what you're assuming, why, and what would change if it's wrong
3. ⛔ **STOP — do not proceed until every assumption is confirmed or corrected**
4. After confirmation: confirmed assumptions land in `2-plan.md` "Assumptions".
   If running /assume mid-/spec-tasks (after plan approval), append via
   /spec-amend rather than editing the approved plan directly.

Format:
```
Assumptions for <task>:

1. **<assumption>** — because <reason>.
   If wrong: <what changes>.

2. **<assumption>** — because <reason>.
   If wrong: <what changes>.
```

Rules:
- No assumption is too obvious — name it anyway
- "I don't know X" is a valid assumption; it means the answer must be found before proceeding
- One wrong assumption can invalidate an entire plan — surface them cheap, not mid-execution

---

### /bugfix
**Purpose:** Lightweight flow for confirmed bugs.

Stages (in order, no skipping):
1. **Reproduce** — if the repo has a test suite, write a failing test that captures the bug before doing anything else. If no suite exists or a test is not feasible, document a deterministic minimal repro (exact steps, inputs, observed vs. expected output) and state explicitly why a test isn't viable. If the bug cannot be reproduced at all, STOP and report — do not guess at a fix.
2. **Diagnose** — identify the root cause, not the symptom. State the root cause in one sentence before proposing any fix. If you cannot, run /assume and surface what's missing.
3. **Fix** — the minimum change that addresses the stated root cause. Do not refactor surrounding code, rename adjacent symbols, tidy formatting, or fix unrelated issues you notice along the way (note them, don't fix them).
4. **Validate** — the failing test from Reproduce now passes, and the full suite is green. If Reproduce used a manual repro, walk it again and confirm the original symptom is gone.

Stop points:
- After Reproduce: if unable to reproduce, STOP and report
- After Diagnose: if fix scope exceeds ~1 file or ~50 lines, escalate to /spec-new

---

### /refactor
**Purpose:** Restructure code without changing external behavior.

The invariant: every observable behavior before the refactor must be identical after it.

Process:
1. Run existing tests — establish a green baseline; if any fail, fix them first as a separate /bugfix
2. Run /assume — list structural assumptions: file dependencies, public interfaces, callers
3. Define scope: which files change, which stay untouched
4. Implement in small steps; run tests after each step — they must stay green throughout
5. Run /finish when done

Rules:
- No new features, no bug fixes mixed in — if you find a bug, note it; don't fix it now
- No new tests for new behavior — only tests that verify unchanged behavior
- If tests go red mid-refactor, revert the last step immediately; do not continue on a red baseline
- If scope expands beyond the original definition, STOP and escalate to /spec-new

⛔ If the refactor reveals a structural problem that requires new behavior to fix properly, stop and escalate to /spec-new.

---

### /spec-new
**Purpose:** Scaffold a spec folder for a feature or significant change.

Process:
1. Create `specs/<name>/` directory
2. Copy `specs/_template/1-requirements.md` → `specs/<name>/1-requirements.md`
3. Copy `specs/_template/2-plan.md` → `specs/<name>/2-plan.md`
4. Copy `specs/_template/3-tasks.md` → `specs/<name>/3-tasks.md`
5. Replace `<Feature Name>` in each file title with the actual feature name

Then: fill out `1-requirements.md`, resolve blocking questions, and check
`- [x] Ready for /spec-plan` before running /spec-plan.

---

### /spec-clarify
**Purpose:** Structured clarification of a draft `1-requirements.md` before planning.

Use when: a draft is complete but you suspect open ambiguities that would corrupt the plan.

Process:
1. Read `specs/<feature>/1-requirements.md`
2. Generate a list of clarification questions, categorized:
   - ⛔ **Blocking** — `/spec-plan` cannot start until answered
   - ⚠️ **Non-blocking** — can be decided during planning with a reasonable default
3. Present the questions to the user, wait for answers
4. Record both questions and answers in a **Clarifications** section of `1-requirements.md` (append-only, dated)

Rules:
- Use the checkbox format: `- [ ] ⛔ BLOCKING — <question>` / `- [x] ⛔ BLOCKING — <question> → <answer>`; same for `⚠️ NON-BLOCKING`
- `/spec-plan` must scan for `[ ] ⛔ BLOCKING` entries (unchecked blocking questions) and stop if any are found
- Non-blocking questions without answers proceed with the documented default
- This command modifies `1-requirements.md` only by appending to the Clarifications section — no other field is touched

---

### /spec-plan
**Purpose:** Generate a technical plan from an approved requirements doc.

Input: ready `specs/<name>/1-requirements.md`

Process:
1. Read requirements and acceptance criteria
2. Check Status — if `- [x] Ready for /spec-plan` is not checked, STOP and finish requirements first
3. Check Clarifications section — if any `[ ] ⛔ BLOCKING` entry (unchecked blocking question) exists, STOP and run /spec-clarify
4. Run /assume — list every assumption about requirements, codebase state, and technical decisions; STOP and wait for confirmation before continuing
5. Consider the simplest approach that satisfies the requirements; if you reject it, explain why
6. Analyze codebase impact
7. Define abort criteria: conditions under which tasks must stop and return to planning
8. Draft technical plan in `specs/<name>/2-plan.md`
9. **Optionally**, when context warrants, emit additional artifacts alongside `2-plan.md`:
   - `2a-data-model.md` — only if persistence is non-trivial (new tables, schemas, migrations)
   - `2b-api-contracts.md` — only if new external HTTP/RPC/event contracts are introduced
   - `2c-research.md` — only if outstanding research material from `/research` belongs in the plan

⛔ **STOP HERE. Do not write any code until the plan is explicitly approved.**

The plan must include:
- Goals coverage — which goal IDs (G1, G2…) from requirements this plan addresses, and which are out of scope
- Explicit assumptions — confirmed via /assume before drafting
- The simplest viable approach and why it was chosen or rejected
- Tradeoffs — conscious sacrifices the chosen approach makes (write "none" if there are none)
- Components affected as a Markdown table with columns `Exact path`, `Role`, and `Notes`
- New artifacts (files, types, schemas, migrations)
- What the plan explicitly does NOT do (mirrors non-goals)
- External dependencies, if any
- Risks and open questions — unresolved items block approval
- Abort criteria — conditions that trigger a stop and return to planning
- Verification criteria for each task (define "done" before executing)
- Estimated task count

---

### /spec-tasks
**Purpose:** Execute an approved plan as atomic tasks.

Input: approved `specs/<name>/2-plan.md`

Rules:
- One task at a time — complete it fully before moving to the next
- **Before writing implementation code for each task: write the test that defines "done" first.** It must fail (red) before any implementation exists
- Implement until that test passes (green), then run the full test suite to catch regressions
- Do NOT batch tasks or run ahead
- Each task touches only what it requires — no cleanup of adjacent code, no style fixes, no refactors of nearby functions
- If you notice something broken or worth improving nearby, note it in the spec — do not fix it now
- If a task reveals a contradiction, ambiguity, or impossibility that blocks progress: STOP and run `/impl-gap`
- If `/impl-gap` resolution requires changing the requirements or plan: escalate to `/spec-amend` — never edit approved specs directly

Generates / updates: `specs/<name>/3-tasks.md` checklist.

---

### /impl-gap
**Purpose:** Formal stop-and-report channel when implementation hits an ambiguity, contradiction, or technical impossibility.

Usage: `/impl-gap <feature>`

Use when: during `/spec-tasks`, a task cannot proceed because the spec is unclear, internally inconsistent, or technically infeasible as written.

Process:
1. STOP the current task — do not improvise a fix
2. Create `specs/<feature>/impl-gaps.md` from the template if it does not exist
3. Append an entry to `specs/<feature>/impl-gaps.md`:

```markdown
## GAP-<NNN> — <date>
- **Task:** T-<id> (<short description>)
- **Problem:** <what the spec says vs. what's blocking>
- **Impact:** <which tasks are blocked by this>
- **Proposed resolution:** <agent's suggestion, non-binding>
- **Action required:** <"Approval" if resolvable in-scope, "Escalate to /spec-amend" if spec must change>
- **Resolution:** <filled only after human direction>
```

4. Report the gap to the user and wait for direction
5. If the resolution is approved as-is, document the decision in the gap entry and resume
6. If the resolution requires spec changes, escalate via `/spec-amend` — the resulting CR ID is appended to the gap entry

Rules:
- Never modify `1-requirements.md` or `2-plan.md` from this command
- Never record implementation gaps inside `2-plan.md`; `impl-gaps.md` is the only gap log
- The agent's proposed resolution is always non-binding — only the human decides
- Multiple gaps per feature are normal; keep numbering monotonic

---

### /spec-amend
**Purpose:** Documented change-request mechanism for post-approval changes to `1-requirements.md` or `2-plan.md`.

Usage: `/spec-amend <feature> <change-summary>`

Use when: after a spec has been approved, real-world discovery reveals that requirements or plan need to change. Edits to approved spec files are not allowed without an amendment.

Process:
1. Identify the trigger — typically an `/impl-gap` escalation or a user-initiated change
2. Create `specs/<feature>/amendments.md` from the template if it does not exist
3. Append an entry to `specs/<feature>/amendments.md`:

```markdown
## CR-<NNN> — <date>
- **Trigger:** <user-requested | gap-<id> | review-finding>
- **Motive:** <why this change is necessary>
- **Change in requirements:** <what sections of 1-requirements.md change, and how>
- **Change in plan:** <what sections of 2-plan.md change, and how>
- **Affected tasks:** <T-XX, T-YY — tasks that may need to redo work or whose verification changes>
- **Status:** Pending approval
```

4. ⛔ **STOP. Present the CR for approval — do not modify any other file yet.**
5. After explicit approval:
   - Apply the documented changes to `1-requirements.md` and `2-plan.md`
   - Update CR status to "Approved" with the date
   - If tasks are affected, update `3-tasks.md` accordingly (mark stale, add new)

Rules:
- One CR per logical change — do not bundle unrelated changes in a single CR
- CR numbering is per-spec, not global (CR-001 in feature A is unrelated to CR-001 in feature B)
- Rejected CRs stay in `amendments.md` with status "Rejected" and a one-line reason — never delete history

---

### /verify
**Purpose:** Strict mechanical audit. Read-only. Produces a report. Does not modify code or specs.

Use after `/spec-tasks` completes and before `/review`.

Checks (deterministic, listed in the report):
- All tasks in `3-tasks.md` are marked complete
- Every goal (G1, G2…) in `1-requirements.md` has at least one task that references it and at least one observable artifact (file change, test, route)
- Every acceptance scenario in `1-requirements.md` has a corresponding passing test
- Test suite passes (full suite, not only new tests)
- No files were modified outside the exact paths listed with write roles in `2-plan.md` "Components Affected"
- No outstanding `/impl-gap` entries marked unresolved
- No outstanding `/spec-amend` CRs in "Pending approval" status

Output: `specs/<feature>/verify-report.md` with all seven check rows populated with
PASS/FAIL status and concrete evidence. The Detail sections must be filled in; a
bare `Result: PASS` line is not a valid verify report.

The report's header MUST include a `Result:` line with exactly `PASS` or `FAIL` — no bold, no extra text. This line is necessary but not sufficient: `sddguard gate finish` also requires the expected checks, evidence, and detail sections.

Rules:
- This command never modifies code, spec files, or tasks — output is the report only
- If a check fails, the report names the failure and the artifact that should resolve it
- `/verify` does not propose fixes — that is `/review`'s territory (or a new `/spec-amend` if the failure is structural)

---

### /review
**Purpose:** Lighter human-touch final pass after `/verify`. Produces a durable review report.

Use after `/verify` reports green (or after explicit acknowledgement of remaining warnings).

Focus:
- Qualitative reading of the implementation — clarity, naming, simplicity
- Catch things mechanical checks miss: unclear variable names, leaky abstractions, copy-paste smell, comments that lie
- Note minor follow-ups (not blockers — these can be filed as separate bugfix items)
- Confirm that the implementation feels like the simplest one that satisfies the requirements

Rules:
- This is a recommendation-only pass — `/review` writes `review-report.md` but does not apply code or spec changes
- If `/review` finds a structural issue, set `Result: ESCALATED`, name the required `/spec-amend` or `/bugfix` path, and stop before editing anything else
- If `/review` finds minor follow-ups (naming, dead comment, etc.), record them in `review-report.md` for the user to act on — file a separate `/bugfix` task if the user accepts them
- `/review` never edits code directly or any spec file beyond `review-report.md`
- If `/review` proceeds with acknowledged warnings (rather than a green `/verify`), record the date and acknowledged warning(s) in `review-report.md`

Output: `specs/<feature>/review-report.md`.

The report's header MUST include a `Result:` line with exactly `PASS`, `FOLLOW_UPS`, or `ESCALATED`.

---

### /spec-status
**Purpose:** Show the state of all active specs.

Process:
1. List directories under `specs/` excluding `_template` and `_done`
2. For each, infer current phase from file state:
   - Only `1-requirements.md`: **drafting requirements**
   - `2-plan.md` exists but unchecked: **awaiting plan approval**
   - `2-plan.md` approved and `3-tasks.md` has incomplete tasks: **in /spec-tasks (N/M done)**
   - All tasks complete, no `verify-report.md`: **awaiting /verify**
   - `verify-report.md` present: **verified** or **review pending**
3. Print a table: Feature | Phase | Progress | Outstanding (CRs, gaps)

Rules:
- This is a status view; no spec files are modified
- Completed specs (moved to `_done/`) are not listed

---

### /spec-conflicts
**Purpose:** Detect file-level conflicts between active specs.

Process:
1. For each active spec, read the `2-plan.md` "Components Affected" table
2. Use only exact paths from the `Exact path` column; preserve each row's `Role`
3. Cross-reference: any exact path listed by two or more active specs with write roles (`New` or `Modified`) is a potential conflict
4. Print a table: Exact path | Specs touching it | Role(s) | Recommendation (sequence them, merge plans, or escalate)

Rules:
- Detection only — resolution is always human-decided
- Do not infer conflicts from prose, `Notes`, directory names, globs, imports, or task text
- "Components Affected" exact paths are the source of truth; if a plan understates its surface, conflicts will be missed (user education, not enforcement)
- Specs whose `3-tasks.md` is fully checked (all `[x]`) are excluded even if
  not yet moved to `_done/` — moving is a human action and conflict detection
  should not block on it.

---

### /spec-analyze
**Purpose:** Cross-consistency analysis between requirements, plan, and tasks for a single spec.

Process:
1. Read `1-requirements.md`, `2-plan.md`, `3-tasks.md` for the target feature
2. Run three checks:
   - **Goal-to-task coverage:** each goal ID (G1, G2…) appears as a referenced goal in at least one task
   - **Plan-to-task coverage:** each entry in "Components Affected" appears in at least one task's Changes field
   - **Scope creep:** any task that does not reference a goal ID
3. Write `specs/<feature>/analysis.md` with one section per check, naming concrete misses

Rules:
- Analysis does not modify any spec file
- Re-runs overwrite the previous `analysis.md`
- Output is advisory; the human decides whether to amend or accept the gap

---

### /conventions-sync
**Purpose:** Refresh `.sdd/conventions.md` against current project state, preserving manual sections.

Process:
1. Scan: `package.json` (or equivalent), directory structure, naming patterns, lint/format configs, ORM/router/state-management library in use
2. Identify sections of `conventions.md` marked `<!-- manual -->` — leave verbatim
3. Regenerate auto-sections with current findings
4. Present the diff for approval before writing — STOP for explicit confirmation
5. After approval, write the updated `conventions.md`

Rules:
- Manual sections are never overwritten
- Auto-sections always reflect current state, not historical
- The diff is the contract: if the user does not approve, nothing changes

---

### /finish
**Purpose:** Stage changed files and produce a conventional commit message for approval.

Process:
1. Confirm `verify-report.md` is complete and `Result: PASS`
2. Confirm `review-report.md` exists and has `Result: PASS` or `Result: FOLLOW_UPS`; `Result: ESCALATED` blocks finish
3. Run `git status` — identify changed, added, and deleted files
4. Run `git diff` (staged and unstaged) — read the actual changes in detail
5. Exclude files that must not be committed: `.env*`, build artifacts, scratch files, editor state
6. Stage all relevant files with `git add`
7. Determine the commit type from the changes:
   - `feat` — new feature or user-visible capability
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `docs` — documentation only
   - `test` — adding or updating tests
   - `chore` — build, tooling, dependencies, config
   - `style` — formatting, no logic change
   - `perf` — performance improvement
8. Draft commit message following the format below

⛔ **STOP. Present the staged file list and the proposed commit message. Do not commit until explicitly approved.**

Commit format:
```
<type>(<scope>): <short summary, imperative mood, max 72 chars>

<One sentence that frames the overall change — what it adds or fixes
 at a high level, and why it matters.>

- <Specific change — what was added/modified and the reasoning or
  tradeoff behind the decision.>
- <Specific change — include method names, file paths, component names
  when they clarify what was touched.>
- <Specific change — explain exclusions and edge cases explicitly:
  "X is intentionally excluded because Y".>

<Footer — notable technical context that isn't obvious from the diff:
 migration notes, performance tradeoffs, deliberate design decisions,
 known limitations. Not required if there's nothing non-obvious.>
```

Rules for the message:
- Summary line: imperative mood (`add`, `fix`, `remove`, `update`), lowercase, no trailing period
- Scope: the domain or module most affected (`auth`, `cli`, `payments`, `spec`)
- Overview sentence: one sentence only — frames the "what and why" at the highest level
- Bullets: one per logical unit of change; name real identifiers (functions, files, endpoints); explain the *why* behind each decision, not just the *what*
- Explicit exclusions belong in the bullets: "X is intentionally excluded because Y"
- Footer: non-obvious context only — migration decisions, deliberate tradeoffs, known caveats
- If changes are unrelated, propose splitting into multiple commits

---

## Default Flow

| Change size | Required flow |
|---|---|
| Typo / comment | Direct change |
| Bug (< ~50 lines, 1 file) | /bugfix → /finish |
| Refactor (no behavior change) | /refactor → /finish |
| Feature | /spec-new → /spec-clarify → /spec-plan → /spec-tasks → /verify → /review → /finish |
| Architecture change | /spec-new → /spec-clarify → /spec-plan (mandatory human review) → /spec-tasks → /verify → /review → /finish |
| Post-approval change | /spec-amend → (resume with current phase) |

---

## Per-Phase Permissions

This table formalizes what the agent may read, edit, or create in each phase. Documentation, not runtime enforcement — but the agent is expected to comply.

| Command | Read specs | Edit specs | Edit code | Create files |
|---|---|---|---|---|
| /bootstrap, /scan | ✓ | ✗ | ✗ | Only docs / report files |
| /ask, /research | ✓ | ✗ | ✗ | Only research / report files |
| /assume | ✓ | ✗ | ✗ | None (output is conversational) |
| /spec-new | ✓ | ✓ (initial drafts only) | ✗ | Spec scaffold only |
| /spec-clarify | ✓ | ✓ (only Clarifications section) | ✗ | None |
| /spec-plan | ✓ | ✓ (only `2-plan.md` and optional 2a/2b/2c) | ✗ | Plan + artifacts |
| /spec-tasks | ✓ | ✓ (only `3-tasks.md` checklist) | ✓ | Code, tests, new modules |
| /impl-gap | ✓ | ✓ (only `impl-gaps.md`) | ✗ | Gap report only |
| /spec-amend | ✓ | ✓ (with CR approval) | ✗ | CR record |
| /verify | ✓ | ✗ | ✗ | Only `verify-report.md` |
| /review | ✓ | ✗ | ✗ | Only `review-report.md` |
| /spec-status, /spec-conflicts | ✓ | ✗ | ✗ | None (output is conversational) |
| /spec-analyze | ✓ | ✗ | ✗ | Only `analysis.md` |
| /bugfix | ✓ | ✗ | ✓ | Tests + fix |
| /refactor | ✓ | ✗ | ✓ | None |
| /conventions-sync | ✓ | ✗ | ✗ | Only `conventions.md` (with diff approval) |
| /finish | ✓ | ✗ | ✗ | None — staging + commit message only |

---

## Anti-Patterns

The agent must not:

1. **Edit approved spec files silently.** `1-requirements.md` and `2-plan.md` after approval are read-only; use `/spec-amend`.
2. **Improvise a fix when the spec is ambiguous.** Use `/impl-gap` and stop.
3. **Mark tasks complete without an observable artifact.** A code change, a test, a file — something must back the checkmark.
4. **Refactor adjacent code during a task.** Note it for later; do not change scope.
5. **Add a dependency without surfacing it in `/research` or `/assume`.** Surprise dependencies are scope creep.
6. **Batch tasks.** One task at a time during `/spec-tasks` — finish, verify, then move on.
7. **Skip `/verify` or `/review` to jump straight to `/finish`.** Mechanical and qualitative checks exist to catch real problems.
8. **Make decisions about what is "good enough" structurally.** Structure is a human decision; flag it, do not absorb it.
9. **Move a spec to `_done/` before `/verify` and `/review` pass.** A spec is done when both have closed cleanly.

---

## Closing a Spec

When `/verify` and `/review` have both closed cleanly for a spec (`verify-report.md`
has `Result: PASS`, and `review-report.md` has `Result: PASS` or
`Result: FOLLOW_UPS`):

1. Move `specs/<feature>/` to `specs/_done/<feature>/`
2. `/spec-status` no longer lists it (it excludes `_done/`)
3. Amendments (`amendments.md`) and gap records (`impl-gaps.md`) move with the spec folder

The `_done/` folder is write-never during active development. Only fully shipped specs live there. Moving a spec there is a human action — the agent must not do it unilaterally.

---

## Stop Points (Non-Negotiable)

1. **Unclear or not-ready requirements** — stop, ask via /ask or run /spec-clarify, do not assume; /spec-plan requires `- [x] Ready for /spec-plan`
2. **Unvalidated assumptions** — run /assume before /spec-plan; if a confirmed assumption turns out false mid-execution, stop and re-plan
3. **After /spec-plan** — never proceed to tasks without explicit approval
4. **Abort criterion triggered** — when any condition in the plan's Abort Criteria is met, stop immediately and return to /spec-plan
5. **Scope creep detected** — stop, report, get a decision before continuing
6. **Test failure during /spec-tasks** — stop, fix the failure before the next task
7. **Implementation gap encountered** — run /impl-gap and stop; do not improvise
8. **Spec change needed** — run /spec-amend; never edit approved files directly
9. **Pending CR or unresolved gap** — `/verify` will not pass; resolve before continuing
