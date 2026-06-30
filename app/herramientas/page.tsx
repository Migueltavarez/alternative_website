import { Navbar } from '@/components/navbar';
import { ScaleConverter } from '@/components/scale-converter';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function HerramientasPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <h1 className="text-3xl font-bold mt-4">Herramientas</h1>
            <p className="text-muted-foreground mt-1">Calculadoras y utilidades para tus proyectos de impresión 3D.</p>
          </div>
          <ScaleConverter />
        </div>
      </div>
    </div>
  );
}
