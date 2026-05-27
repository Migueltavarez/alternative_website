// ── Shopify Storefront API client ─────────────────────────────────────────────
// All requests go through server-side code. Token never exposed to browser.

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN  = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const API_VERSION = '2024-01';

export function isShopifyConfigured() {
  return !!(DOMAIN && TOKEN);
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  cache: RequestCache = 'no-store',
): Promise<T | null> {
  if (!isShopifyConfigured()) return null;
  try {
    const res = await fetch(
      `https://${DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': TOKEN!,
        },
        body: JSON.stringify({ query, variables }),
        cache,
      },
    );
    if (!res.ok) throw new Error(`Shopify ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data as T;
  } catch (e) {
    console.error('Shopify fetch error:', e);
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  availableForSale: boolean;
  quantityAvailable: number;
  selectedOptions: { name: string; value: string }[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  tags: string[];
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: { id: string; name: string; values: string[] }[];
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
  products: ShopifyProduct[];
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    price: ShopifyMoney;
    product: {
      id: string;
      title: string;
      handle: string;
      images: ShopifyImage[];
    };
  };
  cost: { totalAmount: ShopifyMoney };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopifyCartLine[];
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
}

// ── GraphQL fragments ─────────────────────────────────────────────────────────

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id title handle availableForSale tags
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    images(first: 1) { edges { node { url altText } } }
    variants(first: 1) {
      edges {
        node {
          id availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
  }
`;

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id checkoutUrl totalQuantity
    lines(first: 100) {
      edges {
        node {
          id quantity
          merchandise {
            ... on ProductVariant {
              id title
              selectedOptions { name value }
              price { amount currencyCode }
              product {
                id title handle
                images(first: 1) { edges { node { url altText } } }
              }
            }
          }
          cost { totalAmount { amount currencyCode } }
        }
      }
    }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount    { amount currencyCode }
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeEdges<T>(edges: { node: T }[]): T[] {
  return edges?.map((e) => e.node) ?? [];
}

function normalizeProduct(raw: any): ShopifyProduct {
  return {
    ...raw,
    images: normalizeEdges(raw.images?.edges ?? []),
    variants: normalizeEdges(raw.variants?.edges ?? []),
    options: raw.options ?? [],
  };
}

function normalizeCart(raw: any): ShopifyCart {
  return {
    ...raw,
    lines: normalizeEdges(raw.lines?.edges ?? []).map((line: any) => ({
      ...line,
      merchandise: {
        ...line.merchandise,
        product: {
          ...line.merchandise.product,
          images: normalizeEdges(line.merchandise.product?.images?.edges ?? []),
        },
      },
    })),
  };
}

// ── Product queries ───────────────────────────────────────────────────────────

export async function getCollections(): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
     query GetCollections {
       collections(first: 20, sortKey: TITLE) {
         edges {
           node {
             id title handle description
             image { url altText }
             products(first: 8, sortKey: BEST_SELLING) {
               edges { node { ...ProductCard } }
             }
           }
         }
       }
     }`,
    undefined,
    'no-store',
  );
  if (!data) return [];
  return normalizeEdges(data.collections.edges).map((c: any) => ({
    ...c,
    image: c.image ?? null,
    products: normalizeEdges(c.products.edges).map(normalizeProduct),
  }));
}

export async function getCollectionByHandle(
  handle: string,
  first = 48,
): Promise<ShopifyCollection | null> {
  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
     query GetCollection($handle: String!, $first: Int!) {
       collection(handle: $handle) {
         id title handle description
         image { url altText }
         products(first: $first, sortKey: BEST_SELLING) {
           edges { node { ...ProductCard } }
         }
       }
     }`,
    { handle, first },
    'no-store',
  );
  if (!data?.collection) return null;
  const c = data.collection;
  return {
    ...c,
    image: c.image ?? null,
    products: normalizeEdges(c.products.edges).map(normalizeProduct),
  };
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<any>(
    `query GetProduct($handle: String!) {
       product(handle: $handle) {
         id title handle description descriptionHtml
         availableForSale tags
         priceRange {
           minVariantPrice { amount currencyCode }
           maxVariantPrice { amount currencyCode }
         }
         images(first: 10) { edges { node { url altText } } }
         options { id name values }
         variants(first: 100) {
           edges {
             node {
               id title availableForSale quantityAvailable
               price { amount currencyCode }
               compareAtPrice { amount currencyCode }
               selectedOptions { name value }
             }
           }
         }
       }
     }`,
    { handle },
    'no-store',
  );
  if (!data?.product) return null;
  return normalizeProduct(data.product);
}

export async function searchProducts(query: string, first = 24): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
     query SearchProducts($query: String!, $first: Int!) {
       products(first: $first, query: $query, sortKey: RELEVANCE) {
         edges { node { ...ProductCard } }
       }
     }`,
    { query, first },
    'no-store',
  );
  if (!data) return [];
  return normalizeEdges(data.products.edges).map(normalizeProduct);
}

// ── Cart mutations ────────────────────────────────────────────────────────────

export async function createCart(): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
     mutation CreateCart {
       cartCreate { cart { ...CartFields } }
     }`,
  );
  if (!data?.cartCreate?.cart) return null;
  return normalizeCart(data.cartCreate.cart);
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
     query GetCart($cartId: ID!) {
       cart(id: $cartId) { ...CartFields }
     }`,
    { cartId },
  );
  if (!data?.cart) return null;
  return normalizeCart(data.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
     mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
       cartLinesAdd(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
       }
     }`,
    { cartId, lines },
  );
  if (!data?.cartLinesAdd?.cart) return null;
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
     mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
       cartLinesUpdate(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
       }
     }`,
    { cartId, lines },
  );
  if (!data?.cartLinesUpdate?.cart) return null;
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
     mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
       cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
         cart { ...CartFields }
       }
     }`,
    { cartId, lineIds },
  );
  if (!data?.cartLinesRemove?.cart) return null;
  return normalizeCart(data.cartLinesRemove.cart);
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 2,
  }).format(parseFloat(money.amount));
}
