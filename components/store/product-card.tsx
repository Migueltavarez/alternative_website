'use client';

import { ShopifyProduct } from '@/lib/shopify';
import { formatMoney } from '@/lib/shopify';
import { useCart } from './cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading } = useCart();
  const [adding, setAdding] = useState(false);

  const variant = product.variants[0];
  const image = product.images[0];
  const hasDiscount = variant?.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!variant || adding) return;
    setAdding(true);
    try {
      await addToCart(variant.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link href={`/store/product/${product.handle}`} className="group relative flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-accent">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
            Oferta
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">{product.title}</h3>

        <div className="flex items-center gap-2 mt-auto">
          <span className="text-sm font-semibold text-primary">
            {variant ? formatMoney(variant.price) : '—'}
          </span>
          {hasDiscount && variant?.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(variant.compareAtPrice)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || loading}
          className="mt-1 w-full py-1.5 text-xs font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          {adding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5" />
          )}
          Agregar
        </button>
      </div>
    </Link>
  );
}
