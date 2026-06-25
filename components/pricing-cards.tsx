'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { PLANS } from '@/lib/stripe';
import { Button } from '@/components/ui/button';

interface PlanType {
  id: string;
  name: string;
  price: number;
  priceDOP: number;
  priceId: string;
  credits: number;
  features: string[];
  highlighted: boolean;
  color: string;
}

interface PricingCardsProps {
  onSelectPlan: (planId: string) => void;
  isLoading: boolean;
  currentPlan?: string;
}

const planIcons: Record<string, React.ElementType> = {
  BASIC: Sparkles,
  PRO: Zap,
  PREMIUM: Crown,
};

const planColors: Record<string, { bg: string; border: string; icon: string; badge: string; button: string }> = {
  BASIC: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20 text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    button: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  },
  PRO: {
    bg: 'from-blue-600/15 to-blue-500/5',
    border: 'border-blue-500/40',
    icon: 'bg-blue-500/30 text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600',
  },
  PREMIUM: {
    bg: 'from-amber-600/15 to-amber-500/5',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/30 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    button: 'bg-gradient-to-r from-[#D49012] to-[#CC2631] hover:opacity-90',
  },
};

const plansList: PlanType[] = [
  {
    id: 'BASIC',
    name: 'Básico',
    price: 33.40,
    priceDOP: 2000,
    priceId: process.env.STRIPE_PRICE_BASIC || '',
    credits: 300,
    features: [
      '300 créditos de impresión mensual',
      '5% descuento en servicios adicionales',
      'Acceso básico a la plataforma',
      'Soporte por email',
    ],
    highlighted: false,
    color: 'emerald',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 83.51,
    priceDOP: 5000,
    priceId: process.env.STRIPE_PRICE_PRO || '',
    credits: 900,
    features: [
      '900 créditos de impresión mensual',
      'Prioridad en producción',
      'Soporte básico en diseño',
      '10% descuento en servicios adicionales',
    ],
    highlighted: true,
    color: 'blue',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 133.61,
    priceDOP: 8000,
    priceId: process.env.STRIPE_PRICE_PREMIUM || '',
    credits: 1800,
    features: [
      '1800 créditos de impresión mensual',
      'Prioridad máxima en producción',
      'Diseño 3D incluido (limitado)',
      '15% descuento en servicios adicionales',
      'Soporte directo',
    ],
    highlighted: false,
    color: 'violet',
  },
];

export function PricingCards({ onSelectPlan, isLoading, currentPlan }: PricingCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plansList.map((plan, index) => {
        const Icon = planIcons[plan.id] || Sparkles;
        const colors = planColors[plan.id] || planColors.BASIC;
        
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            className={`relative rounded-2xl ${
              plan.highlighted 
                ? `bg-gradient-to-b ${colors.bg} border-2 ${colors.border} shadow-xl`
                : 'bg-card border border-border hover:border-border/80'
            } transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                  ⭐ Más Popular
                </span>
              </div>
            )}

            <div className="p-6 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.credits.toLocaleString()} créditos/mes</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">RD${plan.priceDOP.toLocaleString()}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ~${plan.price.toFixed(2)} USD
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full ${colors.button} text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300 ${
                  plan.highlighted ? 'shadow-blue-500/30' : ''
                }`}
                disabled={isLoading || currentPlan === plan.id}
                isLoading={isLoading}
              >
                {currentPlan === plan.id ? (
                  'Plan Actual'
                ) : currentPlan ? (
                  'Cambiar a Este Plan'
                ) : (
                  'Suscribirme'
                )}
              </Button>

              {plan.highlighted && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  ✓ Mejor relación calidad-precio
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
