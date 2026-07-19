'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserCircle, MapPin, Plus, Pencil, Trash2, Star, X, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Button } from '@/components/ui/button';
import { AddressForm, AddressFormValues } from '@/components/address-form';
import { BankTransferModal } from '@/components/bank-transfer-modal';

interface Address extends AddressFormValues {
  id: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  cedula: string | null;
  birthDate: string | null;
}

const MAX_ADDRESSES = 3;

const PLANS = [
  { id: 'BASIC',   name: 'Básico',  priceDOP: 2000, credits: 300,  color: 'emerald', features: ['300 créditos/mes', '5% descuento adicional'] },
  { id: 'PRO',     name: 'Pro',     priceDOP: 5000, credits: 900,  color: 'blue',    features: ['900 créditos/mes', 'Prioridad en producción', '10% descuento'] },
  { id: 'PREMIUM', name: 'Premium', priceDOP: 8000, credits: 1800, color: 'violet',  features: ['1800 créditos/mes', 'Prioridad máxima', 'Diseño incluido (limitado)', '15% descuento'] },
];

const PLAN_COLOR: Record<string, string> = {
  emerald: 'border-emerald-500/40 bg-emerald-500/5',
  blue:    'border-blue-500/40 bg-blue-500/5',
  violet:  'border-amber-500/40 bg-amber-500/5',
};

const PLAN_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  blue:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  violet:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [transferModal, setTransferModal] = useState<{ type: string; purchaseId: string; itemName: string; priceDOP: number } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [userRes, addrRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/user/addresses'),
      ]);
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
        setPhone(data.user.phone || '');
        setCedula(data.user.cedula || '');
        setBirthDate(data.user.birthDate ? data.user.birthDate.slice(0, 10) : '');
        setSubscription(data.subscription ?? null);
      }
      if (addrRes.ok) {
        setAddresses(await addrRes.json());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cedula, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      await update({ refreshProfile: true });
      notify('success', 'Datos actualizados correctamente');
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAddress = async (values: AddressFormValues) => {
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar la dirección');

    await update({ refreshProfile: true });
    setShowAddressForm(false);
    await fetchData();
    notify('success', 'Dirección agregada');
  };

  const handleUpdateAddress = async (values: AddressFormValues) => {
    if (!editingAddress) return;
    const res = await fetch(`/api/user/addresses/${editingAddress.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar la dirección');

    setEditingAddress(null);
    await fetchData();
    notify('success', 'Dirección actualizada');
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      await fetchData();
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await update({ refreshProfile: true });
      await fetchData();
      notify('success', 'Dirección eliminada');
    } catch (err: any) {
      notify('error', err.message);
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
      if (!res.ok) throw new Error(data.error || 'Error al procesar la suscripción');
      setTransferModal({
        type: 'subscription',
        purchaseId: data.subscriptionId,
        itemName: `Plan ${data.planName} (${data.credits} créditos/mes)`,
        priceDOP: data.priceDOP,
      });
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {transferModal && (
        <BankTransferModal
          isOpen={!!transferModal}
          onClose={() => { setTransferModal(null); fetchData(); }}
          type={transferModal.type as any}
          purchaseId={transferModal.purchaseId}
          itemName={transferModal.itemName}
          priceDOP={transferModal.priceDOP}
        />
      )}

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-primary" />
              Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona tu información personal y direcciones de envío</p>
          </div>

          {/* Personal data */}
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-5">Información personal</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm opacity-60"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Número de teléfono <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="809-000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Cédula <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="000-0000000-0"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Fecha de nacimiento <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 rounded-lg bg-card border border-border text-sm"
                  required
                />
              </div>

              <Button type="submit" isLoading={savingProfile}>
                Guardar cambios
              </Button>
            </form>
          </div>

          {/* Plan */}
          {(() => {
            const currentPlan = subscription?.plan ?? null;
            const subStatus   = subscription?.status ?? null;
            const isActiveSub = subStatus === 'active';
            return (
              <div className="glass rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Tu plan</h2>
                </div>

                {subStatus && subStatus !== 'active' && subStatus !== 'canceled' && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                    {subStatus === 'pending_payment' && 'Suscripción pendiente de pago. Sube tu comprobante para activarla.'}
                    {subStatus === 'proof_uploaded'  && 'Comprobante recibido — estamos revisando tu pago.'}
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
            );
          })()}

          {/* Addresses */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Direcciones de envío
              </h2>
              {addresses.length < MAX_ADDRESSES && !showAddressForm && (
                <Button size="sm" onClick={() => setShowAddressForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar dirección
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Puedes registrar hasta {MAX_ADDRESSES} direcciones ({addresses.length}/{MAX_ADDRESSES})
            </p>

            <AnimatePresence>
              {showAddressForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-medium text-sm">Nueva dirección</p>
                      <button onClick={() => setShowAddressForm(false)} className="p-1 hover:bg-accent rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <AddressForm onSubmit={handleCreateAddress} onCancel={() => setShowAddressForm(false)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id}>
                  {editingAddress?.id === addr.id ? (
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-sm">Editar dirección</p>
                        <button onClick={() => setEditingAddress(null)} className="p-1 hover:bg-accent rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <AddressForm
                        initial={addr}
                        onSubmit={handleUpdateAddress}
                        onCancel={() => setEditingAddress(null)}
                        submitLabel="Actualizar"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-card border border-border flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{addr.label}</p>
                          {addr.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                              <Star className="w-3 h-3" /> Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.recipientName} · {addr.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.street}, {addr.sector}, {addr.city}, {addr.province}
                        </p>
                        {addr.notes && <p className="text-xs text-muted-foreground mt-1">{addr.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            title="Marcar como principal"
                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                          >
                            <Star className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingAddress(addr)}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          title="Eliminar"
                          className="p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addresses.length === 0 && !showAddressForm && (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No tienes direcciones registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
