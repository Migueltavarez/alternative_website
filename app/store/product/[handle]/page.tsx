import { getProductByHandle } from '@/lib/shopify';
import { ProductDetail } from './product-detail';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';

export const dynamic = 'force-dynamic';

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props) {
  const product = await getProductByHandle(params.handle);
  if (!product) return {};
  return {
    title: `${product.title} — Tienda Alternative 3D`,
    description: product.description || product.title,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductByHandle(params.handle);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ProductDetail product={product} />
    </div>
  );
}
