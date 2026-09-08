# Contributing

Thank you for helping improve this project. Contributions are welcome through forks and pull requests; repository write access is not required.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the private process in [SECURITY.md](SECURITY.md), never through a public issue.

## Before you start

- Search existing issues and pull requests before opening a duplicate.
- Open an issue before a large feature, architecture change, database migration, authentication change, or external-service integration.
- Keep each pull request focused on one coherent outcome.
- Never include credentials, tokens, production configuration, customer data, or unredacted production logs.

## Local setup

1. Fork the repository and clone your fork.
2. Create a branch from the latest `master`.
3. Use Node.js 24 and install the exact lockfile state:

   ```sh
   npm ci
   ```

4. Copy `.env.example` to `.env.local` and provide local or sandbox credentials. Never commit `.env.local`.
5. Start the application with `npm run dev`.

Database changes must use reviewed Drizzle migrations. Do not use `db:push`, modify hosted data, execute a cutover, or change an external service as part of a contribution unless the maintainer has explicitly approved that operational step.

## Validation

Run the checks that apply to your change. Code changes are expected to pass the complete baseline:

```sh
npm test
npm run typecheck
npm run lint
npm run verify:architecture
npm run verify:release
npx --no-install drizzle-kit check --config=drizzle.config.ts
npm run build
npm run doctor
npm audit
npm audit --omit=dev
git diff --check
```

Checks that require hosted credentials or a database are maintainer-operated and must not be run against production by contributors.

## Pull requests

- Open the pull request against `master` and complete the PR template.
- Write the PR title and commit messages in English using Conventional Commits, for example `fix(cart): preserve quantities after checkout`.
- Explain behavior changes, security implications, migration requirements, and validation evidence.
- Add tests for changed behavior and screenshots for visible UI changes.
- Respond to review comments and resolve conversations only after the concern is addressed.
- Do not force-push after review unless necessary; new commits invalidate previous approval.

Automated checks are necessary but not sufficient. A pull request is merged only after the repository owner reviews and approves it.
