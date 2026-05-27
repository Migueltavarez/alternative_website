import { getCollections } from '@/lib/shopify';
import { ProductCard } from '@/components/store/product-card';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ChevronRight, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tienda — Alternative 3D Studio',
  description: 'Materiales para maquetas, impresión 3D y planos. Filamentos y consumibles.',
};

export default async function StorePage() {
  const collections = await getCollections();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Tienda</h1>
          </div>
          <p className="text-muted-foreground">
            Materiales para maquetas, impresión 3D, planos y consumibles para impresoras.
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">La tienda aún no tiene productos disponibles.</p>
            <p className="text-sm mt-1">Vuelve pronto.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {collections.map((collection) => (
              <section key={collection.id}>
                {/* Collection header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {collection.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent shrink-0">
                        <Image
                          src={collection.image.url}
                          alt={collection.image.altText ?? collection.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold">{collection.title}</h2>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground">{collection.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/store/collections/${collection.handle}`}
                    className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Ver todo
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Products grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {collection.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="mt-4 sm:hidden">
                  <Link
                    href={`/store/collections/${collection.handle}`}
                    className="flex items-center gap-1 text-sm text-primary"
                  >
                    Ver todos los productos de {collection.title}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </section>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
