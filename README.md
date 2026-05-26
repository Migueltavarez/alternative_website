# Alternative 3D Studio - SaaS Platform

Plataforma SaaS profesional para Alternative 3D Studio con suscripciones, sistema de referidos, pagos con Stripe y panel administrativo.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v4
- **Payments**: Stripe (Checkout, Webhooks, Subscriptions)
- **Validation**: Zod + React Hook Form
- **UI**: Framer Motion, Lucide Icons

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Seed database (creates admin user)
npm run db:seed

# 6. Start development server
npm run dev
```

## Project Structure

```
/app
  /(auth)/             # Auth routes (login, register)
  /(dashboard)/        # Protected user dashboard
  /admin               # Admin panel
  /api/
    /auth/             # NextAuth API routes
    /stripe/           # Stripe checkout & webhooks
    /users/            # User management API
    /contact/          # Contact form API
    /referrals/        # Referral system API
    /subscriptions/     # Subscription management
    /stats/            # Dashboard statistics
    /user/             # User data API
/components/
  /ui/                 # Base UI components
  /auth/               # Auth forms
  navbar.tsx
  whatsapp-button.tsx
  pricing-cards.tsx
  contact-form.tsx
  google-maps.tsx
/lib/
  prisma.ts            # Prisma client singleton
  stripe.ts           # Stripe configuration
  stripe-handlers.ts   # Webhook event handlers
  auth.ts             # NextAuth configuration
  validations.ts       # Zod schemas
  utils.ts            # Utility functions
/services/
  user.service.ts     # User business logic
  subscription.service.ts
  referral.service.ts
/prisma/
  schema.prisma       # Database schema
  seed.ts             # Database seed
/middleware.ts         # Route protection
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="min-32-chars-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASIC="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_PREMIUM="price_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="18099998469"
ADMIN_EMAIL="admin@example.com"
```

## Database Models

### User
- `id`: Unique identifier (cuid)
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `role`: USER | ADMIN
- `referralCode`: Unique referral code per user
- `referredBy`: Referral code of referrer
- `discountBalance`: Accumulated referral rewards
- `stripeCustomerId`: Stripe customer ID

### Subscription
- `userId`: Foreign key to User
- `stripeSubscriptionId`: Stripe subscription ID
- `plan`: BASIC | PRO | PREMIUM
- `status`: active | past_due | canceled | incomplete
- `currentPeriodEnd`: Subscription renewal date

### Referral
- `referrerId`: User who referred
- `referredUserId`: New user referred
- `reward`: 10% of plan price
- `used`: Whether reward was credited

## Authentication Flow

1. User registers with email/password
2. Password hashed with bcrypt (12 rounds)
3. Unique referral code generated for user
4. Session created via NextAuth JWT strategy
5. Protected routes via Next.js Middleware

## Security Features

- Password hashing with bcrypt (12 rounds)
- Zod validation on all inputs (frontend + backend)
- CSRF protection via NextAuth
- Rate limiting on API routes
- Webhook signature verification
- SQL injection prevention via Prisma
- JWT session strategy
- Route protection via middleware

## Stripe Integration

### Pricing
- **Basic**: $33.40/month
- **Pro**: $83.51/month (highlighted)
- **Premium**: $133.61/month

### Checkout Flow
1. User selects plan on pricing page
2. `/api/stripe/checkout` creates Stripe Checkout session
3. User completes payment on Stripe
4. Webhook receives `checkout.session.completed`
5. Customer ID saved to user record
6. Subscription record created

### Webhook Events Handled
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Referral System

### How It Works
1. Each user gets unique referral code
2. New user registers with referral code
3. Referral relationship stored in DB
4. When referred user pays, 10% credited to referrer
5. Discount accumulated in user's `discountBalance`

## Admin Panel Features

- View all users with role management
- View all subscriptions
- Cancel subscriptions
- View revenue statistics (MRR)
- View referral statistics
- Distribution by plan

## API Routes

### POST /api/auth/register
- Validates input with Zod
- Creates user with hashed password
- Generates unique referral code
- Handles referral relationship

### POST /api/stripe/checkout
- Requires authentication
- Creates Stripe Checkout session
- Passes userId and referralCode in metadata

### POST /api/stripe/webhook
- Verifies Stripe signature
- Routes events to handlers
- Updates database accordingly

### POST /api/contact
- Validates with Zod
- Saves to database

### GET/PATCH /api/users
- Admin only
- List all users
- Update user roles

### DELETE /api/subscriptions
- Admin only
- Cancel user subscription

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm test             # Run tests
```

## Default Admin Credentials

After running `npm run db:seed`, an admin user is created:

- **Email**: admin@alternative3d.com (or ADMIN_EMAIL env var)
- **Password**: Admin123!

⚠️ **Change this password immediately after first login!**

## Deployment

Optimized for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

Make sure to run migrations during deployment:
```bash
npx prisma migrate deploy
```
