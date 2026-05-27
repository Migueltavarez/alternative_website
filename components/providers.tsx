'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from './store/cart-context';
import { CartDrawer } from './store/cart-drawer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
