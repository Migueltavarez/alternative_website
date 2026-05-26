# Alternative 3D Studio - SaaS Platform Documentation

## Overview
This is a production-ready SaaS platform for Alternative 3D Studio built with Next.js 14, featuring subscriptions, user management, referral system, PayPal payments, and credits system.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v4
- **Payments**: PayPal (Checkout, Subscriptions) + Stripe
- **Validation**: Zod + React Hook Form
- **UI**: Framer Motion, Lucide Icons, next-themes

## Project Structure
```
/app                    # Next.js App Router pages
  /(auth)/             # Auth routes (login, register)
  /dashboard           # Protected user dashboard
  /admin              # Admin panel
  /api/               # API routes
    /auth/            # NextAuth API routes
    /stripe/          # Stripe checkout & webhooks
    /paypal/          # PayPal capture
    /users/           # User management API
    /subscriptions/    # Subscription management
      /manage/        # Pause/Restore subscriptions
    /credits/         # Credits checkout & capture
    /print-jobs/      # Print jobs management
      /all/           # All print jobs (admin)
      /[id]/          # Single job operations
    /contact/          # Contact form API
    /stats/           # Admin statistics
/components/           # React components
/lib/                  # Utilities and integrations
  prisma.ts           # Prisma client singleton
  stripe.ts           # Stripe configuration
  paypal.ts           # PayPal integration
  auth.ts             # NextAuth configuration
  validations.ts      # Zod schemas
  utils.ts            # Utility functions
/services/             # Business logic layer
  user.service.ts     # User operations
  subscription.service.ts  # Subscription operations
  referral.service.ts # Referral operations
/prisma/               # Database schema and migrations
```

## Database Models

### User
- `id`: Unique identifier (cuid)
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `name`: User display name
- `role`: USER | ADMIN
- `referralCode`: Unique referral code per user
- `referredBy`: Referral code of referrer
- `discountBalance`: Accumulated referral rewards
- `stripeCustomerId`: Stripe customer ID
- `credits`: User's printing credits balance

### Subscription
- `userId`: Foreign key to User
- `stripeSubscriptionId`: Stripe subscription ID
- `stripePriceId`: Stripe Price ID
- `plan`: BASIC | PRO | PREMIUM
- `status`: active | past_due | canceled | incomplete | trialing | unpaid
- `currentPeriodStart`: Subscription start date
- `currentPeriodEnd`: Subscription renewal date
- `cancelAtPeriodEnd`: Boolean to mark scheduled cancellation
- `paypalOrderId`: PayPal order ID (for PayPal payments)

### Referral
- `referrerId`: User who referred
- `referredUserId`: New user referred
- `reward`: 10% of plan price
- `used`: Whether reward was credited

### CreditPurchase
- `id`: Unique identifier
- `userId`: Foreign key to User
- `credits`: Number of credits purchased
- `amount`: Purchase amount in USD
- `paymentId`: PayPal payment ID
- `status`: PENDING | COMPLETED | FAILED

### PrintJob
- `id`: Unique identifier
- `userId`: Foreign key to User
- `fileName`: Name of the 3D file
- `fileUrl`: URL to the file (Google Drive, Dropbox, etc.)
- `fileSize`: Optional file size in MB
- `creditsCost`: Credits to be deducted (assigned by admin)
- `status`: pending | approved | printing | completed | rejected
- `notes`: Optional notes from the user

## Plans Configuration

| Plan    | Price (USD) | Price (DOP) | Credits | Highlighted |
|---------|-------------|-------------|---------|-------------|
| BASIC   | $33.40      | RD$2,000    | 300     | No          |
| PRO     | $83.51      | RD$5,000    | 900     | Yes         |
| PREMIUM | $133.61     | RD$8,000    | 1800    | No          |

## Authentication Flow
1. User registers with email/password
2. Password hashed with bcrypt (12 rounds)
3. Unique referral code generated for user (8 chars, alphanumeric)
4. Session created via NextAuth JWT strategy
5. Protected routes via Next.js Middleware

## Security Measures
- Password hashing with bcrypt (12 rounds)
- Zod validation on all inputs
- CSRF protection via NextAuth
- Rate limiting on API routes
- Webhook signature verification
- Environment variables for secrets
- SQL injection prevention via Prisma

## Payment Integration (PayPal)

### Checkout Flow (Homepage)
1. User clicks "Suscribirme" on pricing section
2. If not authenticated → redirect to login, then back to pricing
3. `POST /api/stripe/checkout` creates PayPal order
4. User completes payment on PayPal
5. `GET /api/paypal/capture` captures the order
6. Subscription and credits created/updated in database

### Credit Purchase Flow
1. User selects credit package on dashboard
2. `POST /api/credits/checkout` creates PayPal order
3. User completes payment on PayPal
4. `GET /api/credits/capture` captures and credits account

## Print Jobs System

### User Flow
1. User uploads a 3D model via drag & drop or file picker
2. Admin reviews the job in the print queue
3. Admin assigns credits cost to the job
4. Admin changes status (pending → approved → printing → completed)
5. Credits are deducted from user's balance

### Supported File Types
- STL, OBJ, 3MF, GCODE, STEP, STP, FBX, DAE, BLEND
- Maximum file size: 100MB

### Admin Print Queue
- View all pending print jobs
- Download uploaded files
- Assign credits to jobs
- Assign credits cost to each job
- Change job status
- Delete jobs
- See user's available credits

## API Routes

#### POST /api/stripe/checkout
- **Purpose**: Creates PayPal checkout order for subscription
- **Auth**: Required
- **Body**: `{ planId: "BASIC" | "PRO" | "PREMIUM" }`
- **Response**: `{ url: paypalApprovalUrl, orderId: string }`

#### GET /api/paypal/capture
- **Purpose**: Captures PayPal payment and creates subscription
- **Query**: `?token=...&PayerID=...`
- **Actions**: Creates subscription, credits account, handles referral

#### POST /api/credits/checkout
- **Purpose**: Creates PayPal order for credit purchase
- **Auth**: Required
- **Body**: `{ packageId: string, useDiscount?: boolean }`
- **Response**: `{ url: paypalApprovalUrl, orderId: string }`

#### GET /api/credits/capture
- **Purpose**: Captures credit purchase payment
- **Query**: `?token=...&PayerID=...`
- **Actions**: Updates purchase status, adds credits to user

#### PATCH /api/subscriptions/manage
- **Purpose**: Pause or restore subscriptions (Admin)
- **Auth**: Admin required
- **Body**: `{ userId: string, action: "pause" | "restore" }`

#### DELETE /api/subscriptions
- **Purpose**: Cancel subscription (Admin)
- **Auth**: Admin required
- **Query**: `?userId=...`

#### POST /api/upload
- **Purpose**: Upload 3D model file
- **Auth**: Required
- **Body**: FormData with file field
- **Response**: `{ fileName: string, fileUrl: string, fileSize: number }`

#### GET /api/print-jobs
- **Purpose**: Get user's print jobs
- **Auth**: Required
- **Response**: Array of PrintJob objects

#### POST /api/print-jobs
- **Purpose**: Create new print job
- **Auth**: Required
- **Body**: `{ fileName: string, fileUrl: string, notes?: string }`
- **Response**: Created PrintJob object

#### GET /api/print-jobs/all
- **Purpose**: Get all print jobs (Admin)
- **Auth**: Admin required
- **Response**: Array of PrintJob with user info

#### PATCH /api/print-jobs/[id]
- **Purpose**: Update print job credits or status (Admin)
- **Auth**: Admin required
- **Body**: `{ creditsCost?: number, status?: string, notes?: string }`

#### DELETE /api/print-jobs/[id]
- **Purpose**: Delete print job (Admin)
- **Auth**: Admin required

## Referral System

### How It Works
1. Each user gets unique 8-character referral code
2. New user registers with referral code
3. Referral relationship stored in DB
4. When referred user pays, 10% credited to referrer
5. Discount balance can be applied to credit purchases

### Applying Discounts
- Discount balance accumulated in user's `discountBalance`
- Applied during credit purchase checkout
- Trackable in user dashboard

## Subscription Management

### User Dashboard
- View current subscription status
- View credits balance
- View referral code with copy button
- View discount balance
- Cancel subscription (sets cancelAtPeriodEnd)
- Purchase additional credits
- Upload 3D models for printing
- View uploaded models with status

### Admin Panel
- **Stats Cards**: Total users, active subscriptions, MRR, referrals
- **Plan Distribution**: Count and revenue by plan
- **Upcoming Charges**: Shows next billing dates for active subscriptions
- **User Management**: View all users, change roles, see subscription status
- **Subscription Actions**:
  - Pause subscription (sets status to past_due)
  - Restore subscription (sets status to active)
  - Cancel subscription (sets cancelAtPeriodEnd)
- **Print Queue**: Manage all print jobs
  - View job details (file, customer, credits)
  - Edit credits cost
  - Change job status
  - Delete jobs

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Stripe (legacy)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM=price_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox|sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=18099998469
```

## Setup Commands
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Admin Features
- View all users with subscription status
- View all subscriptions
- View referral relationships
- View upcoming charges
- Pause subscriptions (admin)
- Restore subscriptions (admin)
- Cancel subscriptions (admin)
- Change user roles (USER/ADMIN)
- See MRR and plan distribution
- **Print Queue Management**
  - View all print jobs
  - Assign credits to jobs
  - Change job status
  - Delete jobs

## User Dashboard Features
- View credits balance
- View subscription details
- Copy referral code button
- Apply discount to purchases
- Purchase additional credits
- Cancel subscription
- **My Models (Print Jobs)**
  - Upload 3D models (via URL)
  - View job status
  - See assigned credits cost

## UI Features
- Dark/Light mode toggle (in navbar)
- Glassmorphism design
- Smooth animations (Framer Motion)
- Fully responsive
- WhatsApp floating button
- Contact form
- Pricing cards with PayPal integration
- Upload models for printing

## Testing
Run tests with: `npm test`

## Deployment
Optimized for Vercel deployment:
- Environment variables configured
- Prisma migrations ready
- Next.js optimized build
