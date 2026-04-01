# Next.js Ecommerce Template

Modern ecommerce starter built with Next.js 16, React 19, App Router, Drizzle ORM, Supabase, Better Auth, Stripe, TanStack Query, Tailwind CSS, and Zod.

## Stack

- Next.js 16 with App Router and Cache Components
- React 19
- TypeScript strict mode
- Tailwind CSS
- TanStack Query
- Drizzle ORM
- Supabase PostgreSQL
- Better Auth
- Stripe Checkout
- Zod
- Nodemailer

## Features

- Product catalog with categories and variants
- Shopping cart and wishlist
- Stripe checkout
- Order history
- Admin product management
- Email notifications
- Type-safe validation and data access

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Run the database setup:

```bash
npm run db:migrate
npm run db:push
```

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=your_supabase_database_url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email
EMAIL_SERVER_HOST=your_email_host
EMAIL_SERVER_PORT=your_email_port
EMAIL_SERVER_USER=your_email_user
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=your_email_from
EMAIL_CONTACT_TO=your_email_inbox
```

## Scripts

```bash
# App
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck

# Database
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:pull
```

## Project Structure

```text
src/
  app/         App Router routes, layouts, pages, route handlers
  components/  UI and feature components
  hooks/       Client hooks and React Query hooks
  lib/         Infra code: auth, db, email, Stripe, shared helpers
  schemas/     Zod schemas
  services/    Business logic
  styles/      Global CSS
  types/       Shared TypeScript types
  utils/       Stateless helpers and formatters
```

## Deployment Notes

- Configure all environment variables in production.
- Use a public webhook URL for Stripe.
- Run `npm run db:migrate` before `npm run db:push` on new environments.
- Set `NEXT_PUBLIC_APP_URL` to the production domain.

## License

MIT. See [LICENSE](LICENSE).
