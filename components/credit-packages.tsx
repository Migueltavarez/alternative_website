'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Coins } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/credits';
import { Button } from '@/components/ui/button';

interface CreditPackagesProps {
  onSelectPackage: (packageId: string) => void;
  isLoading: boolean;
  currentCredits: number;
  discountBalance: number;
  useDiscount: boolean;
  onToggleDiscount: (value: boolean) => void;
}

const packageIcons: Record<string, React.ElementType> = {
  credits_100: Sparkles,
  credits_300: Zap,
  credits_500: Crown,
  credits_1000: Coins,
};

const packageColors: Record<string, { bg: string; border: string; icon: string; badge: string; button: string }> = {
  credits_100: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20 text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    button: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  },
  credits_300: {
    bg: 'from-blue-600/15 to-blue-500/5',
    border: 'border-blue-500/40',
    icon: 'bg-blue-500/30 text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600',
  },
  credits_500: {
    bg: 'from-amber-600/15 to-amber-500/5',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/30 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    button: 'bg-gradient-to-r from-[#D49012] to-[#CC2631] hover:opacity-90',
  },
  credits_1000: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/20 text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
  },
};

export function CreditPackages({ onSelectPackage, isLoading, discountBalance, useDiscount, onToggleDiscount }: CreditPackagesProps) {
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
            Aplicar <span className="font-semibold text-green-500">10% de descuento</span> (Tienes ${discountBalance.toFixed(2)} disponibles)
          </label>
        </div>
      )}
      
      <div className="grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {CREDIT_PACKAGES.map((pkg, index) => {
          const Icon = packageIcons[pkg.id] || Sparkles;
          const colors = packageColors[pkg.id] || packageColors.credits_100;
          
          const finalPrice = useDiscount ? pkg.price * 0.90 : pkg.price;
          
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
                      <span className="text-lg font-bold text-muted-foreground line-through">
                        ${pkg.price.toFixed(2)}
                      </span>
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
                        <span className="text-xs text-green-500">(10% dto.)</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">${pkg.price.toFixed(2)}</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  ~RD${pkg.priceDOP.toLocaleString()}
                </p>

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
