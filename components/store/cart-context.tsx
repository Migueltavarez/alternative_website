'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { ShopifyCart, ShopifyCartLine } from '@/lib/shopify';

const CART_ID_KEY = 'alt3d_cart_id';

interface CartContextValue {
  cart: ShopifyCart | null;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

async function cartFetch(action: string, data?: object) {
  const res = await fetch('/api/store/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  return json.cart as ShopifyCart | null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount: load or validate existing cart
  useEffect(() => {
    const storedId = localStorage.getItem(CART_ID_KEY);
    if (!storedId) return;
    cartFetch('get', { cartId: storedId }).then((c) => {
      if (c) setCart(c);
      else localStorage.removeItem(CART_ID_KEY);
    });
  }, []);

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cart?.id) return cart.id;
    const newCart = await cartFetch('create');
    if (!newCart) throw new Error('Could not create cart');
    setCart(newCart);
    localStorage.setItem(CART_ID_KEY, newCart.id);
    return newCart.id;
  }, [cart]);

  const addToCart = useCallback(async (variantId: string, quantity = 1) => {
    setLoading(true);
    try {
      const cartId = await ensureCart();
      const updated = await cartFetch('add', {
        cartId,
        lines: [{ merchandiseId: variantId, quantity }],
      });
      if (updated) {
        setCart(updated);
        localStorage.setItem(CART_ID_KEY, updated.id);
        setCartOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }, [ensureCart]);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await cartFetch('update', {
        cartId: cart.id,
        lines: [{ id: lineId, quantity }],
      });
      if (updated) setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const removeFromCart = useCallback(async (lineId: string) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await cartFetch('remove', {
        cartId: cart.id,
        lineIds: [lineId],
      });
      if (updated) setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const cartCount = cart?.totalQuantity ?? 0;

  return (
    <CartContext.Provider value={{
      cart, cartCount, cartOpen, setCartOpen,
      addToCart, updateQuantity, removeFromCart, loading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
