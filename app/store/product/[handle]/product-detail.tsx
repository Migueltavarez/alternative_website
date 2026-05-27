'use client';

import { ShopifyProduct } from '@/lib/shopify';
import { formatMoney } from '@/lib/shopify';
import { useCart } from '@/components/store/cart-context';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function ProductDetail({ product }: { product: ShopifyProduct }) {
  const { addToCart } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0] ?? '']))
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];

  function handleOptionChange(optionName: string, value: string) {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    const matched = product.variants.find((v) =>
      v.selectedOptions.every((o) => newOptions[o.name] === o.value)
    );
    if (matched) setSelectedVariantId(matched.id);
  }

  async function handleAddToCart() {
    if (!selectedVariant || adding) return;
    setAdding(true);
    try {
      await addToCart(selectedVariant.id, quantity);
    } finally {
      setAdding(false);
    }
  }

  const isSimple = product.options.length === 1 && product.options[0]?.values.length === 1;
  const hasDiscount = selectedVariant?.compareAtPrice &&
    parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

  return (
    <div className="pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/store" className="hover:text-foreground transition-colors">Tienda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium line-clamp-1">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-accent">
              {product.images[imageIndex] ? (
                <Image
                  src={product.images[imageIndex].url}
                  alt={product.images[imageIndex].altText ?? product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => Math.max(0, i - 1))}
                    disabled={imageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => Math.min(product.images.length - 1, i + 1))}
                    disabled={imageIndex === product.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === imageIndex ? 'border-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-3">{product.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">
                  {selectedVariant ? formatMoney(selectedVariant.price) : '—'}
                </span>
                {hasDiscount && selectedVariant?.compareAtPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatMoney(selectedVariant.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Options */}
            {!isSimple && product.options.map((option) => (
              <div key={option.id}>
                <label className="text-sm font-medium block mb-2">
                  {option.name}: <span className="text-primary">{selectedOptions[option.name]}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const testOptions = { ...selectedOptions, [option.name]: value };
                    const exists = product.variants.some((v) =>
                      v.selectedOptions.every((o) => testOptions[o.name] === o.value)
                    );
                    return (
                      <button
                        key={value}
                        onClick={() => handleOptionChange(option.name, value)}
                        disabled={!exists}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          selectedOptions[option.name] === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : exists
                            ? 'border-border hover:border-primary/50'
                            : 'border-border opacity-30 cursor-not-allowed line-through'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium block mb-2">Cantidad</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Agregar al carrito
            </button>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-2">Descripción</h3>
                {product.descriptionHtml ? (
                  <div
                    className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                )}
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-accent text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
