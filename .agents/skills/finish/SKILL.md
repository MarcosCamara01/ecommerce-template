---
name: finish
description: Stage changed files and produce a conventional commit message for approval. Use after completing any unit of work — bug fix, refactor, or a ticket closed by /implement.
---

Commits in this repo go through an explicit approval stop. `/implement` closes a
ticket with `/code-review`, then hands over here — it does not commit on its own.

## Process

1. Run `git status` — identify changed, added, and deleted files
2. Run `git diff` (staged and unstaged) — read the actual changes in detail
3. Exclude files that must not be committed: `.env*`, build artifacts, scratch files, editor state
4. Stage all relevant files with `git add`. Never `git add .` or `git add -A`
5. Determine the commit type from the changes:
   - `feat` — new feature or user-visible capability
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `docs` — documentation only
   - `test` — adding or updating tests
   - `chore` — build, tooling, dependencies, config
   - `style` — formatting, no logic change
   - `perf` — performance improvement
6. Draft the commit message following the format below

⛔ **STOP. Present the staged file list and the proposed commit message. Do not commit until explicitly approved.**

## Commit format

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

## Rules for the message

- Summary line: imperative mood (`add`, `fix`, `remove`, `update`), lowercase, no trailing period
- Scope: the domain or module most affected (`auth`, `security`, `payments`, `cart`)
- Overview sentence: one sentence only — frames the "what and why" at the highest level
- Bullets: one per logical unit of change; name real identifiers (functions, files, endpoints); explain the *why* behind each decision, not just the *what*
- Explicit exclusions belong in the bullets: "X is intentionally excluded because Y"
- Footer: non-obvious context only — migration decisions, deliberate tradeoffs, known caveats
- If changes are unrelated, propose splitting into multiple commits
- Prose paragraphs instead of bullets are fine when the change is a single idea that needs
  explaining rather than a list — match what recent commits on the branch do

Pushing is a separate action and needs its own consent.
