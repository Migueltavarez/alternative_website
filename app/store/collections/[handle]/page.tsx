import { getCollectionByHandle } from '@/lib/shopify';
import { ProductCard } from '@/components/store/product-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Store } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export const dynamic = 'force-dynamic';

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props) {
  const collection = await getCollectionByHandle(params.handle);
  if (!collection) return {};
  return {
    title: `${collection.title} — Tienda Alternative 3D`,
    description: collection.description || `Productos de ${collection.title}`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const collection = await getCollectionByHandle(params.handle, 96);
  if (!collection) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/store" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Store className="w-4 h-4" />
            Tienda
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-foreground font-medium">{collection.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{collection.title}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {collection.products.length} producto{collection.products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {collection.products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No hay productos en esta colección todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {collection.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
