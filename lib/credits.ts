export const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    name: '100 Créditos',
    credits: 100,
    price: 9.99,
    priceDOP: 600,
    highlighted: false,
  },
  {
    id: 'credits_300',
    name: '300 Créditos',
    credits: 300,
    price: 24.99,
    priceDOP: 1500,
    highlighted: true,
  },
  {
    id: 'credits_500',
    name: '500 Créditos',
    credits: 500,
    price: 39.99,
    priceDOP: 2400,
    highlighted: false,
  },
  {
    id: 'credits_1000',
    name: '1000 Créditos',
    credits: 1000,
    price: 74.99,
    priceDOP: 4500,
    highlighted: false,
  },
] as const;

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id'];
