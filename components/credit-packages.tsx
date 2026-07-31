'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceDOP: number;
  highlighted: boolean;
}

interface CreditPackagesProps {
  onSelectPackage: (packageId: string) => void;
  isLoading: boolean;
  currentCredits: number;
  discountBalance: number;
  useDiscount: boolean;
  onToggleDiscount: (value: boolean) => void;
}

const ICON_CYCLE = [Sparkles, Zap, Crown, Coins];

const COLOR_CYCLE = [
  {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20 text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    button: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  },
  {
    bg: 'from-blue-600/15 to-blue-500/5',
    border: 'border-blue-500/40',
    icon: 'bg-blue-500/30 text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600',
  },
  {
    bg: 'from-amber-600/15 to-amber-500/5',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/30 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    button: 'bg-gradient-to-r from-[#D49012] to-[#CC2631] hover:opacity-90',
  },
  {
    bg: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-500/30',
    icon: 'bg-violet-500/20 text-violet-400',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    button: 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700',
  },
];

export function CreditPackages({ onSelectPackage, isLoading, discountBalance, useDiscount, onToggleDiscount }: CreditPackagesProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);

  useEffect(() => {
    fetch('/api/credits/packages')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPackages(data); })
      .catch(() => {});
  }, []);

  const hasDiscountBalance = discountBalance > 0;

  return (
    <div className="space-y-4">
      {hasDiscountBalance && (
        <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <input
            type="checkbox"
            id="use-discount"
            checked={useDiscount}
            onChange={(e) => onToggleDiscount(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="use-discount" className="text-sm cursor-pointer">
            Aplicar <span className="font-semibold text-green-500">10% de descuento</span> (Tienes RD${discountBalance.toLocaleString()} disponibles)
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {packages.map((pkg, index) => {
          const Icon = ICON_CYCLE[index % ICON_CYCLE.length];
          const colors = COLOR_CYCLE[index % COLOR_CYCLE.length];
          const finalPriceDOP = useDiscount ? Math.round(pkg.priceDOP * 0.90) : pkg.priceDOP;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl ${
                pkg.highlighted
                  ? `bg-gradient-to-b ${colors.bg} border-2 ${colors.border} shadow-xl`
                  : 'bg-card border border-border hover:border-border/80'
              } transition-all duration-300 hover:scale-[1.02] hover:shadow-xl p-4`}
            >
              {pkg.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    Mejor Valor
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold">{pkg.name}</h3>

                <div className="mt-2">
                  {useDiscount ? (
                    <>
                      <span className="text-sm font-medium text-muted-foreground line-through">
                        RD${pkg.priceDOP.toLocaleString()}
                      </span>
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className="text-xl font-bold">RD${finalPriceDOP.toLocaleString()}</span>
                        <span className="text-xs text-green-500">(10% dto.)</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xl font-bold">RD${pkg.priceDOP.toLocaleString()}</span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1">{pkg.credits} créditos</p>

                <Button
                  onClick={() => onSelectPackage(pkg.id)}
                  className={`w-full mt-4 ${colors.button} text-white font-semibold py-2 rounded-xl`}
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  Comprar
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
