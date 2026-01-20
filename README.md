# Next.js E-commerce Template

A modern, fully-featured e-commerce template built with Next.js 16, React 19, Supabase (PostgreSQL) with Drizzle ORM, Better Auth for authentication, and Stripe for payment processing.

## 🚀 Features
- Responsive Modern Design with Tailwind CSS
- User Authentication with Better Auth (Email/Password & Social Login)
- Product Catalog with Categories and Variants
- Shopping Cart with Real-time Updates (React Query)
- Product Search with Fuse.js
- Wishlist Functionality
- Secure Payment Processing with Stripe
- Order History and Tracking
- Admin Dashboard for Product Management
- Email Notifications with Nodemailer
- SEO Optimized
- Type-safe with TypeScript and Zod validation

## 🛠 Tech Stack
- **Framework:** Next.js 16 with App Router
- **React:** React 19
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **Payments:** Stripe
- **State Management:** React Query (TanStack Query)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Validation:** Zod
- **Search:** Fuse.js

## 🛠 Installation & Set Up

1. Install dependencies
```bash
npm install
```

2. Set up environment variables (see below)

3. Run database migrations
```bash
npm run db:push
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Environment Variables

Rename `.env.example` to `.env.local` in the root directory and configure the following variables:

### Required Environment Variables:
```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=your_supabase_database_url

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Better Auth Configuration
BETTER_AUTH_SECRET=your_better_auth_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration (Nodemailer)
EMAIL_SERVER_HOST=your_email_host
EMAIL_SERVER_PORT=your_email_port
EMAIL_SERVER_USER=your_email_user
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=your_email_from
```

### Setting Up Services:

#### Supabase Database
- Create a free Supabase project at [supabase.com](https://supabase.com)
- Get your database URL from Project Settings > Database
- Used for:
  - Product catalog
  - User information
  - Orders and order products
  - Shopping cart data
  - Wishlist

#### Better Auth
- Better Auth provides secure authentication out of the box
- Supports email/password and social login providers
- Generate a secret key:
```bash
openssl rand -base64 32
```

#### Stripe Configuration
- Create a Stripe account at [stripe.com](https://stripe.com)
- Get your API keys from the Dashboard > Developers > API keys
- Set up webhooks for order processing

#### Email Configuration
- Configure SMTP settings for email notifications
- Used for order confirmations and user notifications

## 📁 Project Structure
```
src/
├── app/              
│   ├── (auth)/        # Authentication pages (login, register)
│   ├── (store)/       # Store pages (categories, products, search)
│   ├── (user)/        # User pages (cart, orders, wishlist)
│   ├── admin/         # Admin dashboard (product management)
│   ├── api/           # API routes
│   └── layout.tsx     # Root layout
├── components/    
│   ├── admin/         # Admin components
│   ├── cart/          # Shopping cart components
│   ├── layout/        # Layout components (navbar, footer)
│   ├── orders/        # Order components
│   ├── product/       # Single product components
│   ├── products/      # Product grid components
│   ├── ui/            # Reusable UI components (shadcn/ui)
│   └── wishlist/      # Wishlist components
├── hooks/             # Custom React hooks
│   ├── auth/          # Authentication hooks
│   ├── cart/          # Cart hooks (queries, mutations)
│   ├── product/       # Product hooks
│   └── wishlist/      # Wishlist hooks
├── lib/              
│   ├── auth/          # Authentication utilities
│   ├── db/            # Database configuration
│   │   ├── drizzle/   # Drizzle ORM setup
│   │   │   ├── schema/      # Database schemas
│   │   │   └── repositories/ # Data access layer
│   │   └── supabase/  # Supabase client
│   ├── email/         # Email utilities
│   └── stripe/        # Stripe utilities
├── services/          # Business logic services
├── schemas/           # Zod validation schemas
├── types/             # TypeScript types
├── utils/             # Helper functions
└── styles/            # CSS and styling
```

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Drizzle)
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:pull      # Introspect database
```

## 🛍️ E-commerce Features

### For Customers
- Browse product catalog by categories
- Search products with fuzzy search
- View product variants (colors, sizes)
- Add items to cart with variant selection
- Wishlist functionality
- Secure checkout with Stripe
- Order tracking and history
- User profile management

### For Administrators
- Create and edit products with variants
- Manage product images
- Product categorization
- Order management

## 🔒 Security Features
- Secure authentication with Better Auth
- Protected API routes
- Secure payment processing with Stripe
- Type-safe database queries with Drizzle
- Input validation with Zod
- XSS protection

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Deployment Checklist:
1. Configure all environment variables in Vercel
2. Ensure Supabase database is properly configured
3. Set up Stripe webhooks for production URL
4. Configure email service for production
5. Update `NEXT_PUBLIC_APP_URL` to production domain

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs)

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
