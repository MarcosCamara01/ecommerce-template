# Project context

Ecommerce template: Next.js 16, React 19, App Router, Drizzle, Supabase Postgres, Better Auth, Stripe, TanStack Query, Tailwind, Zod.

Auth is Better Auth (email/password + Google). Supabase is storage and Postgres, not auth.

Skills live in `.agents/skills/`. Invoke with `$skill-name`.

Process skills (`poteto-mode` and the rest of `pstack`) are not in the repo: they come from the `pstack` plugin, installed on each machine.

## UI, craft, and motion

The design and motion skills are Emil Kowalski's (`emilkowalski/skills`). Skills marked "by name only" have `disable-model-invocation: true`: they never trigger on their own, so ask for them by name.

| Intent | Skill |
|---|---|
| Design system, `DESIGN.md`, audit / critique / polish, the invisible details | `$emil-design-eng` |
| Fix accessibility: names, keyboard, focus, contrast | `$fixing-accessibility` |
| Stress-test a screen with worst-case data | `$break-ui` |
| Phone feel: hover on touch, `100vh`, input zoom, safe areas | `$mobile-native` |
| Drag, swipe, sheets, swipe to dismiss | `$gestures` |
| Interruptible springs, materials, Apple-style motion | `$apple-design` |
| Name a motion effect | `$animation-vocabulary` |
| Implement a purposeful animation | `$animate` |
| Several elements moving together: stagger, sequence, crossfade | `$choreograph` |
| Janky animation, frame budget, which property to animate | `$animation-performance` |
| Audit the motion of the whole app and plan fixes | `$improve-animations` |
| Find places that should animate (read-only) | `$find-animation-opportunities` |
| Remove motion the interface does not need | `$remove-animations` |
| Review animation code against the craft bar (by name only) | `$review-animations` |
| Sonner toasts: setup, styling, troubleshooting | `$ask-sonner` |
| Build several versions of a UI piece behind a picker (by name only) | `$prototype` |
| Pick a frontend library for a job (by name only) | `$pick-ui-library` |
| Turn this session's design corrections into rules (by name only) | `$learn-taste` |

`$animate-expo` (React Native) and `$write-swift` come with the set but do not apply to this web app.

## Stack

| Intent | Skill |
|---|---|
| React / Next performance | `$vercel-react-best-practices` |
| React Doctor audit (`npm run doctor`) | `$react-doctor` |
| Component composition APIs | `$vercel-composition-patterns` |
| Visual QA in a real browser | `$agent-browser` |
| End-to-end tests in `tests/`: write, run, debug | `$e2e` |
| Stripe Checkout, tax, webhooks | `$stripe-best-practices` |
| Better Auth server, client, adapters | `$better-auth-best-practices` |
| Better Auth secrets, CSRF, cookies | `$better-auth-security-best-practices` |
| Email/password, verification, reset | `$email-and-password-best-practices` |
| Postgres schema, indexes, RLS, queries | `$supabase-postgres-best-practices` |
| Instant navigation under Cache Components | `$next-cache-components-optimizer` |
| Vercel deploys, env, logs, domains | `$vercel-cli` |
| Named local HTTPS URLs | `$portless` |
| OAuth redirects on portless domains | `$oauth` |
