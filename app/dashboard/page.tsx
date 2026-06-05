'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, CreditCard, TrendingUp, Gift,
  Loader2, CheckCircle, XCircle, AlertCircle, X, Copy, Check,
  Printer, ChevronRight, Activity
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { CreditPackages } from '@/components/credit-packages';
import { PricingCards } from '@/components/pricing-cards';
import { MyModels } from '@/components/my-models';
import { Button } from '@/components/ui/button';
import { BankTransferModal } from '@/components/bank-transfer-modal';

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
}

interface WorkerProfileSummary {
  isActive: boolean;
  completedJobs: number;
  machines: { id: string; name: string; isActive: boolean }[];
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileSummary | null>(null);
  const [transferModal, setTransferModal] = useState<{
    type: 'credits' | 'subscription';
    purchaseId: string;
    itemName: string;
    priceDOP: number;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }

    if (status === 'authenticated') {
      fetchUserData();
      fetchPrintJobs();
    }
  }, [status]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        if (data.user?.role === 'WORKER' || data.user?.role === 'ADMIN') {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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

  const currentCredits = userData?.credits || 0;
  const discountBalance = userData?.discountBalance || 0;

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
            notification.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
            'bg-blue-500/20 border border-blue-500/30 text-blue-400'
          }`}
        >
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold">
              Bienvenido, {userData?.name || userData?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus créditos y suscripción
            </p>
          </motion.div>

          {(userData?.role === 'WORKER' || userData?.role === 'ADMIN') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 mb-8 border border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <Printer className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Panel del Maker</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {workerProfile ? (
                        <>
                          <span className={`flex items-center gap-1 text-xs font-medium ${workerProfile.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                            <Activity className="w-3 h-3" />
                            {workerProfile.isActive ? 'Activo' : 'Pausado'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {workerProfile.machines.length} {workerProfile.machines.length === 1 ? 'máquina' : 'máquinas'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {workerProfile.completedJobs} trabajos completados
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Gestiona tus máquinas y trabajos de impresión</span>
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

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Créditos Actuales</p>
                  <p className="text-3xl font-bold mt-1">{currentCredits.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance de Descuento</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(discountBalance)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
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
              <p className="text-xs text-muted-foreground mt-2">
                Comparte tu código y gana 10% de descuento
              </p>
            </motion.div>
          </div>

          {userData?.subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6 mb-12"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Suscripción {userData.subscription.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      Estado:{' '}
                      <span className={
                        userData.subscription.status === 'active' ? 'text-green-400' :
                        userData.subscription.status === 'proof_uploaded' ? 'text-blue-400' :
                        'text-yellow-400'
                      }>
                        {userData.subscription.status === 'active' ? 'Activa' :
                         userData.subscription.status === 'proof_uploaded' ? 'Comprobante enviado — en revisión' :
                         userData.subscription.status === 'pending_payment' ? 'Pendiente de pago' :
                         userData.subscription.status}
                      </span>
                    </p>
                  </div>
                </div>
                {userData.subscription.status === 'active' && (
                  <Button variant="outline" onClick={() => setShowSubscriptionModal(true)}>Gestionar</Button>
                )}
              </div>
            </motion.div>
          )}

          {(!userData?.subscription || userData.subscription.status === 'canceled') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Suscripciones mensuales</h2>
                <p className="text-muted-foreground mt-1">
                  Obtén créditos renovables cada mes con un plan mensual
                </p>
              </div>
              <PricingCards
                onSelectPlan={handleSubscribePlan}
                isLoading={subscriptionLoading}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Comprar Créditos</h2>
              <p className="text-muted-foreground mt-1">
                Selecciona un paquete de créditos para continuar
              </p>
            </div>
            <CreditPackages
              onSelectPackage={handlePurchase}
              isLoading={purchaseLoading}
              currentCredits={currentCredits}
              discountBalance={discountBalance}
              useDiscount={showDiscount}
              onToggleDiscount={setShowDiscount}
            />
          </motion.div>

          <div className="mt-16">
            <MyModels
              printJobs={printJobs}
              onRefresh={fetchPrintJobs}
            />
          </div>
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
                        <span className={userData.subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                          {' '}{userData.subscription.status === 'active' ? 'Activa' : userData.subscription.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {userData.subscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      Próxima renovación: {new Date(userData.subscription.currentPeriodEnd).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
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
