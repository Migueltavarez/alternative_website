'use client';

import { useCart } from './cart-context';
import { formatMoney } from '@/lib/shopify';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, loading } = useCart();
  const lines = cart?.lines ?? [];

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Carrito
                {lines.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({cart?.totalQuantity} {cart?.totalQuantity === 1 ? 'artículo' : 'artículos'})
                  </span>
                )}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <ShoppingBag className="w-14 h-14 text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Tu carrito está vacío</p>
                  <p className="text-sm text-muted-foreground mb-6">Explora nuestra tienda</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    Ver productos
                  </button>
                </div>
              ) : (
                lines.map((line) => {
                  const img = line.merchandise.product.images[0];
                  const variant = line.merchandise;
                  const isSimple = variant.title === 'Default Title' || !variant.title;
                  return (
                    <div key={line.id} className="flex gap-3 p-3 rounded-xl bg-card/50 border border-border">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg bg-accent overflow-hidden shrink-0">
                        {img ? (
                          <Image
                            src={img.url}
                            alt={img.altText ?? variant.product.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{variant.product.title}</p>
                        {!isSimple && (
                          <p className="text-xs text-muted-foreground mt-0.5">{variant.title}</p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatMoney(line.cost.totalAmount)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => line.quantity > 1
                              ? updateQuantity(line.id, line.quantity - 1)
                              : removeFromCart(line.id)
                            }
                            disabled={loading}
                            className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-accent transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{line.quantity}</span>
                          <button
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            disabled={loading}
                            className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-accent transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(line.id)}
                            disabled={loading}
                            className="ml-auto p-1 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && cart && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatMoney(cart.cost.subtotalAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Impuestos y envío calculados en el checkout
                </p>
                <a
                  href={cart.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 text-center bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />Procesando...
                    </span>
                  ) : 'Ir al pago →'}
                </a>
                <Link
                  href="/store"
                  onClick={() => setCartOpen(false)}
                  className="block w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Seguir comprando
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
