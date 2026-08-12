# Project Context

The spec workflow in this repo is [`mattpocock/skills`](https://github.com/mattpocock/skills)
(aihero.dev). The previous in-repo SDD — `.sdd/`, `specs/`, and the twenty `spec-*` /
`verify` / `review` skills — has been removed; do not rebuild any part of it.

## Precondition

`/setup-matt-pocock-skills` has **not** been run in this repo yet. Run it once, before the
first use of any engineering skill: it configures the issue tracker, the triage label
vocabulary, and where domain docs live, and writes `docs/agents/`.

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

## Where the skills live

Two directories, read by different agents — a skill in one is invisible to the other.

| Directory | Contents | Read by |
|---|---|---|
| `.claude/skills/` | the 35 aihero.dev skills | Claude Code (`/name`) |
| `.agents/skills/` | 16 project tooling skills + `finish` | Codex (`$name`) |

To even this out, install the aihero set for Codex too with
`npx skills add mattpocock/skills --skill '*' --agent codex -y`, and link `.agents/skills/`
into `.claude/skills/` for the tooling ones.

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

## Domain knowledge

There is no `CONTEXT.md` in this repo yet. Several aihero skills (`tdd`, `triage`,
`domain-modeling`, `diagnosing-bugs`, both grill wrappers) open it for a mental model of the
code and look for ADRs. `/setup-matt-pocock-skills` decides where those live; `/domain-modeling`
is what fills the glossary in.
