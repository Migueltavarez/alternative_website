// 1 crédito = RD$15 (RD$10 al maker + RD$5 comisión de plataforma)
export const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    name: '100 Créditos',
    credits: 100,
    price: 25.00,
    priceDOP: 1500,
    highlighted: false,
  },
  {
    id: 'credits_300',
    name: '300 Créditos',
    credits: 300,
    price: 75.00,
    priceDOP: 4500,
    highlighted: true,
  },
  {
    id: 'credits_500',
    name: '500 Créditos',
    credits: 500,
    price: 125.00,
    priceDOP: 7500,
    highlighted: false,
  },
  {
    id: 'credits_1000',
    name: '1000 Créditos',
    credits: 1000,
    price: 250.00,
    priceDOP: 15000,
    highlighted: false,
  },
] as const;

export const CREDIT_PRICE_DOP = 15;        // RD$ por crédito (cliente)
export const MAKER_EARNING_PER_CREDIT = 10; // RD$ por crédito (maker)
export const PLATFORM_FEE_PER_CREDIT = 5;  // RD$ por crédito (plataforma)

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id'];
