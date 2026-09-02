# Project Context

The spec workflow in this repo is [`mattpocock/skills`](https://github.com/mattpocock/skills)
(aihero.dev). The previous in-repo SDD — `.sdd/`, `specs/`, and the twenty `spec-*` /
`verify` / `review` skills — has been removed; do not rebuild any part of it.

## The main flow

```
/grill-with-docs → /to-spec → /to-tickets → /implement per ticket → /finish
```

`/implement` drives `/tdd` internally and closes with `/code-review`. Run `/ask-matt` for
the full map of the set, including the on-ramps (`/triage` for issues you didn't file,
`/wayfinder` for work too big to scope in one session).

**One local override: commits go through `/finish`, not `/implement`.** Upstream has
`/implement` commit directly at the end of a ticket. Here it stops and hands over to
`/finish`, which stages, drafts a conventional commit message, and waits for explicit
approval. Pushing needs its own separate consent.

## Agent skills

### Issue tracker

GitHub issues on `MarcosCamara01/ecommerce-template`, via the `gh` CLI. The repo is
public, so specs and tickets are visible to anyone. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. Only `wontfix` exists on
the tracker today. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: the root `CONTEXT.md` is authoritative. `docs/adr/` is created lazily
by `/domain-modeling` when an ADR is needed. See `docs/agents/domain.md`.

## Where the skills live

| Directory | Contents | Read by |
|---|---|---|
| `.claude/skills/` | 52 — the 35 aihero.dev skills as files, plus junctions to all 17 below | Claude Code (`/name`) |
| `.agents/skills/` | 17 — 16 project tooling skills and `finish` | Codex (`$name`) |

The project skills are junctioned rather than copied, so both agents read one file. Codex
does not yet see the aihero set; install it there with
`npx skills add mattpocock/skills --skill '*' --agent codex -y`.

`.claude/` is untracked and `.agents/` is committed. `skills-lock.json` records every
installed skill, so `npx skills experimental_install` restores `.claude/skills/` on a
fresh clone.

## Project tooling skills

Not covered by the aihero set — this repo's own.

| Intent | Skill |
|---|---|
| Emulate Stripe / Vercel / OAuth providers locally | `$emulate` · `$stripe` · `$vercel` · `$oauth` |
| Embed emulators in the Next.js app | `$next` |
| Named local dev URLs (`https://app.localhost`) | `$portless` |
| Drive a real browser | `$agent-browser` |
| Generate text/image/video/audio from the terminal | `$ai-cli` |
| Stage changes and draft a commit for approval | `$finish` |

### Reference material

`$stripe-best-practices` · `$vercel-react-best-practices` · `$vercel-composition-patterns` ·
`$next-cache-components-optimizer` · `$typescript-advanced-types` · `$web-design-guidelines` ·
`$frontend-design` · `$frontend-code-review`

Note: `$frontend-code-review` is written against the Dify codebase, not this one. Adapt it
before relying on it.
