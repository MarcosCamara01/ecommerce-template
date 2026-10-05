# Vercel Doctor — findings not acted on

Each entry records a diagnostic that was looked into and left as it is, with the
reason. They are listed in `vercel-doctor.config.json` so that a scan reports the
verified state. Re-check the reason before trusting an entry: it describes the
project as of the review, not a permanent waiver.

Reviewed against vercel-doctor 1.2.0, whole tree (`"diff": false`; by default the
tool only looks at the files a branch changed).

```bash
npx vercel-doctor@1.2.0 . --offline
```

vercel-doctor is a community tool, not a Vercel product. `--offline` keeps the scan
on the machine: without it the findings are sent to vercel-doctor.com to compute a
score. Its dead-code pass is knip, configured in `knip.json`: the tests are `.mjs`
harnesses that load the sources they cover, so they are entry points there.

## `vercel-consider-bun-runtime` — `package.json`

Fires for every project whose package manager is not Bun.

**Reason:** the store installs with npm (`package-lock.json`, `npm audit` in the
baseline), its tests run on `node --test` with Node's own loaders, and it deploys on
Node 24. Changing runtime and package manager is not a change to make for an advisory.

## `vercel-avoid-platform-cron` — `vercel.json`

Fires because `vercel.json` declares cron jobs, and suggests moving them to GitHub
Actions or Cloudflare.

**Reason:** `/api/cron/fulfillment` and `/api/cron/catalog-sync` are the sweeps that
finish what a webhook or an admin action left pending. They have to run on time,
against the deployed version, with the internal credential. Vercel Cron does exactly
that. A schedule elsewhere is a second system holding a copy of the secret, and
GitHub's is best-effort. The cost being saved is two short invocations every five
minutes.

## `vercel-consider-fluid-compute` — `src/app/api`

Fires for every project with three or more route handlers; the tool cannot see
whether Fluid compute is on.

**Reason:** it is on. `vercel.json` sets `"fluid": true`.

## `vercel-large-static-asset` — three paths

The rule reports every image, font or media file of 4 KB or more anywhere in the
tree and asks for it to be served from another CDN. The catalog photos already are:
they live in Supabase Storage. What is left is ignored by path, so the rule still
catches a large asset added later.

- `src/app/favicon.ico` (26 KB): a site serves its own favicon.
- `public/main-image.webp` (6 KB): the placeholder photo of the database probes
  (`scripts/database/verify-fulfillment-concurrency.ts`).
- `public/qa-seed/**`: local QA fixtures. Untracked, so never deployed.
