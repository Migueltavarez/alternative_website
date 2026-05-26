import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const PLANS = {
  BASIC: {
    id: 'BASIC',
    name: 'Básico',
    price: 33.40,
    priceDOP: 2000,
    priceId: process.env.STRIPE_PRICE_BASIC!,
    credits: 300,
    features: [
      '300 créditos de impresión mensual',
      '5% descuento en servicios adicionales',
      'Acceso básico a la plataforma',
      'Soporte por email',
    ],
    highlighted: false,
    color: 'emerald',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 83.51,
    priceDOP: 5000,
    priceId: process.env.STRIPE_PRICE_PRO!,
    credits: 900,
    features: [
      '900 créditos de impresión mensual',
      'Prioridad en producción',
      'Soporte básico en diseño',
      '10% descuento en servicios adicionales',
    ],
    highlighted: true,
    color: 'blue',
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    price: 133.61,
    priceDOP: 8000,
    priceId: process.env.STRIPE_PRICE_PREMIUM!,
    credits: 1800,
    features: [
      '1800 créditos de impresión mensual',
      'Prioridad máxima en producción',
      'Diseño 3D incluido (limitado)',
      '15% descuento en servicios adicionales',
      'Soporte directo',
    ],
    highlighted: false,
    color: 'violet',
  },
} as const;

export type PlanType = keyof typeof PLANS;

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  referralCode?: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
      referralCode: referralCode || '',
    },
    subscription_data: {
      metadata: {
        userId,
        referralCode: referralCode || '',
      },
    },
  });

  return session;
}

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({
    email,
    name: name || undefined,
  });
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await getSubscription(subscriptionId)).items.data[0].id,
        price: priceId,
      },
    ],
  });
}

export async function applyDiscount(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const discount = session.metadata?.discountCode;
  
  if (discount) {
    try {
      await stripe.customers.update(customerId, {
        coupon: discount,
      });
    } catch (error) {
      console.error('Error applying discount:', error);
    }
  }
}
