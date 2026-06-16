'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, CreditCard, TrendingUp, Gift,
  Loader2, CheckCircle, XCircle, AlertCircle, X, Copy, Check,
  Printer, ChevronRight, Activity, History, DollarSign,
  LayoutDashboard, Wrench, Clock, Users, BarChart2, MessageSquare,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { CreditPackages } from '@/components/credit-packages';
import { MyModels } from '@/components/my-models';
import { Button } from '@/components/ui/button';
import { BankTransferModal } from '@/components/bank-transfer-modal';
import { ChatThread } from '@/components/chat-thread';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrintJob {
  id: string;
  fileName: string;
  fileUrl: string;
  creditsCost: number;
  status: string;
  notes?: string;
  serviceType?: string;
  color?: string;
  filamentType?: string;
  deliveryTime?: string;
  scale?: string;
  realSize?: string;
  laserCutColor?: string;
  laserEngravColor?: string;
  resinColor?: string;
  resinUse?: string;
  designDescription?: string;
  designMaterial?: string;
  designUse?: string;
  designIsVehicle?: boolean;
  designVehicleMake?: string;
  designVehicleModel?: string;
  designVehicleYear?: string;
  makerFeedback?: string | null;
  price?: number | null;
  priceStatus?: string;
  appealNote?: string | null;
  paymentProofUrl?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt: string;
  assignedAt?: string;
  cameraUrl?: string | null;
}

interface WorkerProfileSummary {
  isActive: boolean;
  completedJobs: number;
  machines: { id: string; name: string; isActive: boolean }[];
}

interface PaymentHistory {
  printPayments: {
    id: string;
    fileName: string;
    serviceType?: string;
    price?: number | null;
    paymentMethod?: string | null;
    paidAt?: string | null;
    createdAt: string;
  }[];
  creditPurchases: {
    id: string;
    credits: number;
    amount: number;
    paymentMethod?: string | null;
    createdAt: string;
  }[];
  subscription: {
    plan: string;
    status: string;
    paymentMethod?: string | null;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  } | null;
}

interface SubscriptionDetails {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number;
  discountBalance: number;
  referralCode: string;
  subscription: SubscriptionDetails | null;
}

interface PlatformStats {
  totalJobs: number;
  completedJobs: number;
  serviceBreakdown: Record<string, number>;
}

interface Referral {
  id: string;
  createdAt: string;
  referredUser: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

// ── Plan config (mirrors lib/stripe.ts) ──────────────────────────────────────

const PLANS = [
  {
    id: 'BASIC',
    name: 'Básico',
    priceDOP: 2000,
    credits: 300,
    color: 'emerald',
    features: ['300 créditos/mes', '5% descuento adicional'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    priceDOP: 5000,
    credits: 900,
    color: 'blue',
    features: ['900 créditos/mes', 'Prioridad en producción', '10% descuento'],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    priceDOP: 8000,
    credits: 1800,
    color: 'violet',
    features: ['1800 créditos/mes', 'Prioridad máxima', 'Diseño incluido (limitado)', '15% descuento'],
  },
];

const PLAN_COLOR: Record<string, string> = {
  emerald: 'border-emerald-500/40 bg-emerald-500/5',
  blue:    'border-blue-500/40 bg-blue-500/5',
  violet:  'border-violet-500/40 bg-violet-500/5',
};

const PLAN_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  blue:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  violet:  'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const SERVICE_LABELS: Record<string, string> = {
  print_3d: 'Impresión 3D',
  laser:    'Corte Láser',
  resin:    'Resina',
  plans:    'Planos',
  design:   'Diseño 3D',
};

const ACTIVE_STATUSES = ['pending', 'assigned', 'accepted', 'printing', 'needs_revision', 'proof_uploaded'];

const STATUS_LABELS: Record<string, string> = {
  pending:        'Pendiente',
  assigned:       'Asignado',
  accepted:       'Aceptado',
  printing:       'Imprimiendo',
  needs_revision: 'En revisión',
  proof_uploaded: 'Comprobante enviado',
  completed:      'Completado',
  cancelled:      'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  assigned:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepted:       'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  printing:       'bg-violet-500/10 text-violet-400 border-violet-500/20',
  needs_revision: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  proof_uploaded: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  completed:      'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled:      'bg-red-500/10 text-red-400 border-red-500/20',
};

// ── Component ─────────────────────────────────────────────────────────────────

type DashTab = 'inicio' | 'servicios' | 'historial' | 'soporte';

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [userData, setUserData]             = useState<UserData | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [notification, setNotification]     = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showDiscount, setShowDiscount]     = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [copiedCode, setCopiedCode]         = useState(false);
  const [printJobs, setPrintJobs]           = useState<PrintJob[]>([]);
  const [workerProfile, setWorkerProfile]   = useState<WorkerProfileSummary | null>(null);
  const [transferModal, setTransferModal]   = useState<{
    type: 'credits' | 'subscription';
    purchaseId: string;
    itemName: string;
    priceDOP: number;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [activeTab, setActiveTab]           = useState<DashTab>('inicio');
  const [platformStats, setPlatformStats]   = useState<PlatformStats | null>(null);
  const [referrals, setReferrals]           = useState<Referral[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }

    if (status === 'authenticated') {
      fetchUserData();
      fetchPrintJobs();
      fetchPaymentHistory();
      fetchPlatformStats();
      fetchReferrals();
    }
  }, [status]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'soporte' || tab === 'inicio' || tab === 'servicios' || tab === 'historial') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        if (['WORKER', 'DESIGNER', 'ADMIN'].includes(data.user?.role)) {
          fetchWorkerProfile();
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkerProfile = async () => {
    try {
      const res = await fetch('/api/workers/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setWorkerProfile(data.profile);
      }
    } catch {
      // not a maker yet
    }
  };

  const fetchPrintJobs = async () => {
    try {
      const res = await fetch('/api/print-jobs');
      if (res.ok) {
        const data = await res.json();
        setPrintJobs(data);
      }
    } catch (error) {
      console.error('Error fetching print jobs:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const res = await fetch('/api/payment-history');
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const res = await fetch('/api/platform-stats');
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/referrals');
      if (res.ok) {
        const data = await res.json();
        setReferrals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchaseLoading(true);
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          useDiscount: showDiscount && (userData?.discountBalance || 0) > 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      setTransferModal({
        type: 'credits',
        purchaseId: data.purchaseId,
        itemName: `${data.packageName} (${data.credits} créditos)`,
        priceDOP: data.priceDOP,
      });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleSubscribePlan = async (planId: string) => {
    setSubscriptionLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la suscripción');
      }

      setTransferModal({
        type: 'subscription',
        purchaseId: data.subscriptionId,
        itemName: `Plan ${data.planName} (${data.credits} créditos/mes)`,
        priceDOP: data.priceDOP,
      });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const formatDOP = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const copyReferralCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción?')) {
      return;
    }

    setCancelingSubscription(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      setNotification({ type: 'success', message: 'Suscripción cancelada correctamente' });
      setShowSubscriptionModal(false);
      fetchUserData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setCancelingSubscription(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentCredits   = userData?.credits || 0;
  const discountBalance  = userData?.discountBalance || 0;
  const activeJobs       = printJobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
  const currentPlan      = userData?.subscription?.plan ?? null;
  const subStatus        = userData?.subscription?.status ?? null;
  const isActiveSub      = subStatus === 'active';

  const TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio',    label: 'Inicio',    icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'servicios', label: 'Servicios', icon: <Wrench className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial', icon: <History className="w-4 h-4" /> },
    { id: 'soporte',   label: 'Soporte',   icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
            notification.type === 'error'   ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                                              'bg-blue-500/20 border border-blue-500/30 text-blue-400'
          }`}
        >
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error'   && <XCircle className="w-5 h-5" />}
          {notification.type === 'info'    && <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Welcome header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-3xl font-bold">
              Bienvenido, {userData?.name || userData?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona tus trabajos, créditos y plan</p>
          </motion.div>

          {/* Worker panel */}
          {(['WORKER', 'DESIGNER', 'ADMIN'].includes(userData?.role ?? '')) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 mb-6 border border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <Printer className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{userData?.role === 'DESIGNER' ? 'Panel de Diseño' : 'Panel del Maker'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {workerProfile ? (
                        <>
                          <span className={`flex items-center gap-1 text-xs font-medium ${workerProfile.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                            <Activity className="w-3 h-3" />
                            {workerProfile.isActive ? 'Activo' : 'Pausado'}
                          </span>
                          {userData?.role !== 'DESIGNER' && (
                            <span className="text-xs text-muted-foreground">
                              {workerProfile.machines.length} {workerProfile.machines.length === 1 ? 'equipo' : 'equipos'}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {workerProfile.completedJobs} trabajos completados
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {userData?.role === 'DESIGNER' ? 'Gestiona tus trabajos de diseño' : 'Gestiona tus equipos y trabajos asignados'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href="/worker"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
                >
                  Ir al panel
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {workerProfile && workerProfile.machines.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                  {workerProfile.machines.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${m.isActive ? 'bg-green-400' : 'bg-zinc-500'}`} />
                      <span className="text-xs truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Tab nav ───────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 rounded-xl bg-card border border-border mb-8 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── INICIO ───────────────────────────────────────────────────── */}
          {activeTab === 'inicio' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key="inicio">

              {/* Stats cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Créditos Actuales</p>
                      <p className="text-3xl font-bold mt-1">{currentCredits.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance de Descuento</p>
                      <p className="text-3xl font-bold mt-1">{formatDOP(discountBalance)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Código de Referido</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xl font-bold font-mono">{userData?.referralCode}</p>
                        <button
                          onClick={copyReferralCode}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          title="Copiar código"
                        >
                          {copiedCode ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-violet-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Comparte tu código y gana 10% de descuento</p>
                </div>
              </div>

              {/* Platform overview */}
              {platformStats && (
                <div className="glass rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-5">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Actividad en la plataforma</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-card border border-border text-center">
                      <p className="text-2xl font-bold">{platformStats.totalJobs}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total de trabajos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border text-center">
                      <p className="text-2xl font-bold text-green-400">{platformStats.completedJobs}</p>
                      <p className="text-xs text-muted-foreground mt-1">Completados</p>
                    </div>
                    {Object.entries(platformStats.serviceBreakdown).map(([svc, count]) => (
                      <div key={svc} className="p-4 rounded-xl bg-card border border-border text-center">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{SERVICE_LABELS[svc] ?? svc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan widget */}
              <div className="glass rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Tu plan</h2>
                  </div>
                  {isActiveSub && (
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Gestionar suscripción
                    </button>
                  )}
                </div>

                {subStatus && subStatus !== 'active' && subStatus !== 'canceled' && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                    {subStatus === 'pending_payment'  && 'Suscripción pendiente de pago. Sube tu comprobante para activarla.'}
                    {subStatus === 'proof_uploaded'   && 'Comprobante recibido — estamos revisando tu pago.'}
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => {
                    const isCurrent = currentPlan === plan.id && isActiveSub;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl border p-4 transition-all ${
                          isCurrent
                            ? PLAN_COLOR[plan.color] + ' ring-1 ring-offset-1 ring-offset-background ring-' + plan.color + '-500/30'
                            : 'border-border bg-card hover:border-border/80'
                        }`}
                      >
                        {isCurrent && (
                          <span className={`absolute -top-2.5 left-3 text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_BADGE[plan.color]}`}>
                            Plan actual
                          </span>
                        )}
                        <p className="font-semibold mt-1">{plan.name}</p>
                        <p className="text-2xl font-bold mt-1">
                          RD${plan.priceDOP.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">/mes</span>
                        </p>
                        <ul className="mt-3 space-y-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {!isCurrent && (
                          <Button
                            className="w-full mt-4"
                            size="sm"
                            variant={isActiveSub ? 'outline' : 'default'}
                            onClick={() => handleSubscribePlan(plan.id)}
                            disabled={subscriptionLoading}
                          >
                            {subscriptionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isActiveSub ? 'Cambiar a este plan' : 'Suscribirse'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active jobs */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Trabajos en proceso</h2>
                  {activeJobs.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {activeJobs.length}
                    </span>
                  )}
                </div>

                {activeJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Printer className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No tienes trabajos en proceso</p>
                    <button
                      onClick={() => setActiveTab('servicios')}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Solicitar un servicio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Printer className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{job.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {SERVICE_LABELS[job.serviceType ?? ''] ?? 'Impresión 3D'}
                              {' · '}{new Date(job.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[job.status] ?? ''}`}>
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SERVICIOS ─────────────────────────────────────────────────── */}
          {activeTab === 'servicios' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key="servicios">
              <div className="glass rounded-2xl p-6 mb-8">
                <MyModels
                  printJobs={[]}
                  onRefresh={fetchPrintJobs}
                  isStudent={(session?.user as any)?.isStudent === true}
                  formOnly
                />
              </div>

              <div className="mt-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Comprar Créditos</h2>
                  <p className="text-muted-foreground mt-1">Selecciona un paquete para continuar</p>
                </div>
                <CreditPackages
                  onSelectPackage={handlePurchase}
                  isLoading={purchaseLoading}
                  currentCredits={currentCredits}
                  discountBalance={discountBalance}
                  useDiscount={showDiscount}
                  onToggleDiscount={setShowDiscount}
                />
              </div>
            </motion.div>
          )}

          {/* ── HISTORIAL ─────────────────────────────────────────────────── */}
          {activeTab === 'historial' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key="historial">

              {/* All jobs with full interactivity */}
              <MyModels
                printJobs={printJobs}
                onRefresh={fetchPrintJobs}
                isStudent={(session?.user as any)?.isStudent === true}
              />

              {/* Payment History */}
              {paymentHistory && (
                paymentHistory.printPayments.length > 0 ||
                paymentHistory.creditPurchases.length > 0 ||
                paymentHistory.subscription
              ) && (
                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-6">
                    <History className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">Historial de Pagos</h2>
                  </div>

                  <div className="space-y-4">
                    {paymentHistory?.subscription && paymentHistory.subscription.status === 'active' && (
                      <div className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">Suscripción {paymentHistory.subscription.plan}</p>
                            <p className="text-xs text-muted-foreground">
                              {paymentHistory.subscription.paymentMethod || 'Transferencia bancaria'}
                              {paymentHistory.subscription.currentPeriodEnd && (
                                <> · Vence {new Date(paymentHistory.subscription.currentPeriodEnd).toLocaleDateString('es-ES')}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 shrink-0">Activa</span>
                      </div>
                    )}

                    {paymentHistory?.creditPurchases.map((cp) => (
                      <div key={cp.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Coins className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium">{cp.credits} créditos</p>
                            <p className="text-xs text-muted-foreground">
                              {cp.paymentMethod || 'Transferencia bancaria'}
                              {' · '}{new Date(cp.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">{formatDOP(cp.amount)}</p>
                          <span className="text-xs text-green-400">Completado</span>
                        </div>
                      </div>
                    ))}

                    {paymentHistory?.printPayments.map((pp) => (
                      <div key={pp.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-xs">{pp.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {pp.paymentMethod || 'Transferencia bancaria'}
                              {' · '}{pp.paidAt ? new Date(pp.paidAt).toLocaleDateString('es-ES') : new Date(pp.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {pp.price != null && (
                            <p className="font-semibold">{formatDOP(pp.price)}</p>
                          )}
                          <span className="text-xs text-green-400">Pagado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referrals */}
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Mis Referidos</h2>
                  {referrals.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {referrals.length}
                    </span>
                  )}
                </div>

                {referrals.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center">
                    <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">Aún no has referido a nadie</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comparte tu código <span className="font-mono font-semibold text-foreground">{userData?.referralCode}</span> y gana 10% de descuento
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((r) => (
                      <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-400">
                              {(r.referredUser?.name ?? r.referredUser?.email ?? '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{r.referredUser?.name ?? r.referredUser?.email}</p>
                            <p className="text-xs text-muted-foreground">{r.referredUser?.email}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(r.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SOPORTE ───────────────────────────────────────────────────── */}
          {activeTab === 'soporte' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key="soporte">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Soporte</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Comunícate directamente con el administrador si tienes algún problema con un servicio o tu cuenta.
                </p>
                <ChatThread
                  fetchUrl="/api/chat"
                  postUrl="/api/chat"
                  mySender="USER"
                  emptyLabel="Aún no has iniciado una conversación con soporte."
                />
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {transferModal && (
        <BankTransferModal
          open={!!transferModal}
          onClose={() => setTransferModal(null)}
          type={transferModal.type}
          purchaseId={transferModal.purchaseId}
          itemName={transferModal.itemName}
          priceDOP={transferModal.priceDOP}
          onSuccess={() => {
            setNotification({
              type: 'success',
              message: 'Comprobante enviado. Lo revisaremos y confirmaremos tu pago pronto.',
            });
            setTimeout(() => setNotification(null), 6000);
            fetchUserData();
          }}
        />
      )}

      <AnimatePresence>
        {showSubscriptionModal && userData?.subscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowSubscriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Gestionar Suscripción</h2>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Plan {userData.subscription.plan}</p>
                      <p className="text-sm text-muted-foreground">
                        Estado:
                        <span className={userData.subscription.status === 'active' ? ' text-green-400' : ' text-yellow-400'}>
                          {' '}{userData.subscription.status === 'active' ? 'Activa' : userData.subscription.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {userData.subscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      Próxima renovación:{' '}
                      {new Date(userData.subscription.currentPeriodEnd).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  )}

                  {userData.subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-yellow-500 mt-2">
                      Tu suscripción se cancelará al final del período de facturación
                    </p>
                  )}
                </div>

                {!userData.subscription.cancelAtPeriodEnd && userData.subscription.status === 'active' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelSubscription}
                    disabled={cancelingSubscription}
                    isLoading={cancelingSubscription}
                  >
                    Cancelar Suscripción
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  ¿Necesitas ayuda?{' '}
                  <a href="mailto:soporte@alternative3d.com" className="text-primary hover:underline">
                    Contacta a soporte
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
