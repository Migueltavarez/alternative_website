const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

export const PLANS = {
  BASIC: {
    id: 'BASIC',
    name: 'Básico',
    price: 33.40,
    priceDOP: 2000,
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

export async function createOrder(planId: string, userId: string, referralCode?: string) {
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan) {
    throw new Error('Plan not found');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: plan.price.toFixed(2),
          },
          description: `${plan.name} - ${plan.credits} créditos mensuales`,
          custom_id: JSON.stringify({ userId, planId, referralCode: referralCode || '' }),
        },
      ],
      application_context: {
        brand_name: 'Alternative 3D Studio',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function captureOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal capture error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getOrderDetails(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal get order error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
