'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  paidJobsCount: number;
  totalSpent: number;
}

interface Commission {
  id: string;
  type: 'first_service' | 'recurring' | 'bonus';
  rate: number;
  jobPrice: number;
  amount: number;
  status: 'pending' | 'paid';
  clientId: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Summary {
  clientsCount: number;
  totalPending: number;
  totalPaid: number;
  bonusProgress: number;
  nextBonusAt: number;
  bonusesEarned: number;
}

const TYPE_LABELS: Record<string, string> = {
  first_service: 'Primer servicio (10%)',
  recurring: 'Pedido recurrente (3%)',
  bonus: 'Bono por 5 clientes',
};

export default function SellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<{ seller: any; clients: Client[]; commissions: Commission[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'SELLER') { router.push('/dashboard'); return; }
      fetch('/api/seller/dashboard')
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); });
    }
  }, [status, session, router]);

  const copyReferralCode = () => {
    if (!data?.seller?.referralCode) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';
    navigator.clipboard.writeText(`${appUrl}/register?ref=${data.seller.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    );
  }

  if (!data) return null;

  const { seller, clients, commissions, summary } = data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Panel de Vendedor</h1>
          <p className="text-muted-foreground text-sm mt-1">Hola, {seller?.name ?? seller?.email}</p>
        </motion.div>

        {/* Referral link */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5 space-y-2">
          <p className="text-sm font-semibold">Tu enlace de referido</p>
          <p className="text-xs text-muted-foreground">Comparte este enlace para que los clientes que registres queden vinculados a ti.</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs bg-accent/40 rounded-lg px-3 py-2 font-mono truncate">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://alt3dstudio.com'}/register?ref=${seller?.referralCode}`}
            </code>
            <button
              onClick={copyReferralCode}
              className="shrink-0 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Clientes referidos', value: summary.clientsCount },
            { label: 'Comisiones pendientes', value: `RD$${summary.totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, color: 'text-amber-400' },
            { label: 'Comisiones cobradas', value: `RD$${summary.totalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, color: 'text-emerald-400' },
            { label: 'Bonos ganados', value: summary.bonusesEarned, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color ?? ''}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Bonus progress */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Progreso bono (RD$1,000 c/5 clientes nuevos)</p>
            <p className="text-xs text-muted-foreground">{summary.bonusProgress}/5</p>
          </div>
          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(summary.bonusProgress / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {summary.nextBonusAt === 5
              ? 'El próximo bono se activa con tu siguiente cliente nuevo.'
              : `Faltan ${summary.nextBonusAt} clientes nuevos para tu próximo bono.`}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Clients */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold">Clientes referidos ({clients.length})</h2>
            {clients.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aún no tienes clientes referidos. Comparte tu enlace.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {clients.map(c => (
                  <div key={c.id} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-accent/30 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name ?? c.email}</p>
                      {c.name && <p className="text-muted-foreground truncate">{c.email}</p>}
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString('es-DO')} · {c.paidJobsCount} servicios
                      </p>
                    </div>
                    <p className="shrink-0 text-emerald-400 font-semibold">
                      RD${c.totalSpent.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Commissions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold">Historial de comisiones</h2>
            {commissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay comisiones aún. Se generan cuando un cliente referido confirma un pago.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {commissions.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-accent/30 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium">{TYPE_LABELS[c.type]}</p>
                      <p className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('es-DO')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">RD${c.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        c.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {c.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
