# Codex — Project Context

This project uses the SDD Protocol. Read these files before starting any task:

1. **[.sdd/workflow.md](.sdd/workflow.md)** — commands, permissions, stop points, anti-patterns
2. **[.sdd/project-overview.md](.sdd/project-overview.md)** — what this app is, its non-goals, domains, and definition of done
3. **[.sdd/conventions.md](.sdd/conventions.md)** — project-specific conventions and patterns
4. **[.sdd/autonomy.md](.sdd/autonomy.md)** — delegated self-approval policy for agent autonomy

Before treating any stop point as delegated, read `.sdd/autonomy.md`, identify its
`Mode`, and apply its `Operating Mode` as the default behavior. Self-approval is allowed
only when that policy explicitly permits it; otherwise stop for human input.

## Available Skills

Type `/skills` or `$skill-name` to invoke. Skills are defined in `.agents/skills/`.

### Project setup
| Intent | Skill |
|---|---|
| Initialize project context (new) | `$bootstrap` |
| Initialize project context (existing codebase) | `$bootstrap --scan` |
| Discovery-only scan of an existing codebase | `$scan` |
| Refresh conventions from current project state | `$conventions-sync` |

### Exploration and research artifacts
| Intent | Skill |
|---|---|
| Research / ask without changing files | `$ask` |
| Compare options; may write research artifacts, not code | `$research` |
| Surface and validate assumptions | `$assume` |

### Feature flow
| Intent | Skill |
|---|---|
| Scaffold a spec folder | `$spec-new` |
| Clarify a draft before planning | `$spec-clarify` |
| Generate technical plan (stops for approval) | `$spec-plan` |
| Execute approved plan one task at a time | `$spec-tasks` |
| Stop and report an implementation gap | `$impl-gap` |
| Document a Change Request for spec edits | `$spec-amend` |
| Cross-consistency analysis (goals / plan / tasks) | `$spec-analyze` |
| Strict mechanical audit | `$verify` |
| Lighter human-touch final pass (writes `review-report.md`) | `$review` |
| Stage and commit | `$finish` |

### Multi-spec
| Intent | Skill |
|---|---|
| Show state of all active specs | `$spec-status` |
| Detect file-level conflicts between specs | `$spec-conflicts` |

### Other
| Intent | Skill |
|---|---|
| Fix a confirmed bug | `$bugfix` → `$finish` |
| Restructure without behavior change | `$refactor` → `$finish` |

Standard workflow: `$spec-new` → `$spec-clarify` → `$spec-plan` → `$spec-tasks` → `$verify` → `$review` → `$finish`.

## Active Specs

<!-- List specs currently in progress — completed specs live in specs/_done/ and are not active context.
- specs/auth-refresh/ — in spec-tasks (task 3 of 5)
- specs/payments-v2/ — plan pending approval
-->

## Domain Files

Relevant domain context lives in `.sdd/domains/`. Read the relevant domain file before working in that area.

<!-- List domains present in this project, e.g.:
- [.sdd/domains/auth.md](.sdd/domains/auth.md)
- [.sdd/domains/payments.md](.sdd/domains/payments.md)
-->
