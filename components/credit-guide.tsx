'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Package } from 'lucide-react';

const FILAMENT_GUIDE = [
  { name: 'PLA',           temp: '190-220°C', uses: 'Decorativo, maquetas, figuras, arquitectura',       pros: 'Fácil de imprimir, no requiere enclosure',         cons: 'Poca resistencia al calor y humedad' },
  { name: 'PLA+',          temp: '200-230°C', uses: 'Piezas funcionales, soportes, prototipos',          pros: 'Más resistente que PLA, buena rigidez',            cons: 'Requiere temperaturas más altas' },
  { name: 'SILK PLA',      temp: '210-230°C', uses: 'Decorativo, trofeos, figuras premium',              pros: 'Acabado brillante y satinado',                     cons: 'Menos resistente mecánicamente' },
  { name: 'PETG',          temp: '230-250°C', uses: 'Piezas mecánicas, exteriores, uso diario',          pros: 'Resistente al impacto y humedad',                  cons: 'Más stringing que PLA' },
  { name: 'ABS',           temp: '230-250°C', uses: 'Automotriz, electrónica, piezas resistentes al calor', pros: 'Resistente al calor, se puede lijar/pegar',    cons: 'Requiere enclosure, fumes desagradables' },
  { name: 'TPU (Flexible)',temp: '220-240°C', uses: 'Carcasas, juntas, ruedas, suela',                  pros: 'Flexible y absorbe impactos',                      cons: 'Impresión más lenta, difícil de retraer' },
  { name: 'ASA',           temp: '240-260°C', uses: 'Exteriores, automotriz, señalización UV',          pros: 'Resistente a UV y condiciones extremas',           cons: 'Similar a ABS, requiere enclosure' },
  { name: 'Nylon',         temp: '240-260°C', uses: 'Engranajes, bisagras, piezas de alta carga',       pros: 'Alta resistencia mecánica y flexión',              cons: 'Higroscópico, requiere secado previo' },
  { name: 'WOOD PLA',      temp: '200-220°C', uses: 'Decorativo, manualidades, esculturas',             pros: 'Aspecto y textura de madera natural',              cons: 'Solo decorativo, obstruye nozzles finos' },
];

const CREDIT_EXAMPLES = [
  { icon: '🗝️', name: 'Llavero pequeño',     weight: '3-8g',    credits: '5-20 créd.',    size: '~4cm' },
  { icon: '📱', name: 'Carcasa de teléfono', weight: '20-40g',  credits: '30-70 créd.',   size: '~15cm' },
  { icon: '🏆', name: 'Figura decorativa',   weight: '50-150g', credits: '60-200 créd.',  size: '~15cm' },
  { icon: '⚙️', name: 'Pieza mecánica',      weight: '30-100g', credits: '40-150 créd.',  size: 'Varía' },
  { icon: '🏠', name: 'Maqueta pequeña',     weight: '100-300g',credits: '150-400 créd.', size: '~20cm' },
  { icon: '🚗', name: 'Parte automotriz',    weight: '50-200g', credits: '80-280 créd.',  size: 'Varía' },
];

export function CreditGuide() {
  const [showFilament, setShowFilament] = useState(false);
  const [showCredits, setShowCredits]   = useState(false);

  return (
    <div className="space-y-4 mt-8">
      {/* Credit estimator */}
      <div className="glass rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowCredits(!showCredits)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">¿Cuánto cuesta imprimir? — Guía de créditos</span>
          </div>
          {showCredits
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showCredits && (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Cada trabajo se cotiza individualmente según peso, material e infill. Esta guía es orientativa — el precio final siempre lo confirma el administrador.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <strong>1 crédito = RD$15</strong> · Los créditos que usas salen de tu saldo existente; la diferencia se paga por transferencia bancaria.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CREDIT_EXAMPLES.map((ex) => (
                <div key={ex.name} className="p-3 rounded-xl bg-card border border-border space-y-1">
                  <div className="text-2xl">{ex.icon}</div>
                  <p className="text-sm font-medium leading-tight">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.size} · {ex.weight}</p>
                  <p className="text-xs font-semibold text-amber-400">{ex.credits}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Los créditos también se pueden usar directamente para pagar trabajos cotizados. Acumúlalos con los paquetes de abajo.
            </p>
          </div>
        )}
      </div>

      {/* Filament guide */}
      <div className="glass rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowFilament(!showFilament)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-primary" />
            <span className="font-semibold">Guía de materiales de impresión</span>
          </div>
          {showFilament
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showFilament && (
          <div className="px-6 pb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Elige el material según el uso final de tu pieza. Si tienes dudas, selecciona PLA o PLA+ y agrega una nota.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Material</th>
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Usos principales</th>
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap hidden sm:table-cell">Ventajas</th>
                    <th className="text-left py-2 font-medium whitespace-nowrap hidden sm:table-cell">A considerar</th>
                  </tr>
                </thead>
                <tbody>
                  {FILAMENT_GUIDE.map((f, i) => (
                    <tr key={f.name} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-accent/20'}`}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold whitespace-nowrap">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.temp}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{f.uses}</td>
                      <td className="py-3 pr-4 text-xs text-green-400 hidden sm:table-cell">{f.pros}</td>
                      <td className="py-3 text-xs text-orange-400 hidden sm:table-cell">{f.cons}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
