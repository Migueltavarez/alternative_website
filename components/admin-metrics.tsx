'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  RefreshCw, TrendingUp, Package, Users, Star,
  Server, Cpu, HardDrive, Activity, Bell, CreditCard,
  UserCheck, Clock, Zap, AlertCircle,
} from 'lucide-react';

const SERVICE_NAMES: Record<string, string> = {
  print_3d: 'Impresión 3D', laser: 'Láser', resin: 'Resina', design: 'Diseño',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', quoted: 'Cotizado', accepted: 'Aceptado',
  in_progress: 'En progreso', completed: 'Completado', cancelled: 'Cancelado',
  ready_to_ship: 'Listo', delivered: 'Entregado',
};
const PRICE_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Sin pagar', quoted: 'Cotizado', accepted: 'Aceptado',
  validated: 'Validado', paid: 'Pagado',
};
const ROLE_LABELS: Record<string, string> = {
  USER: 'Clientes', WORKER: 'Makers', DESIGNER: 'Diseñadores', ADMIN: 'Admins',
};
const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface Metrics {
  jobsPerWeek: { week: string; count: number }[];
  byServiceType: { service: string; count: number }[];
  revenuePerMonth: { month: string; revenue: number }[];
  topMakers: { name: string; completedJobs: number }[];
  summary: { totalJobs: number; totalRevenue: number; activeWorkers: number; avgRating: number; totalRatings: number };
  users: { total: number; byRole: Record<string, number>; newThisWeek: number; newThisMonth: number; pendingApproval: number };
  jobs: { byStatus: Record<string, number>; byPriceStatus: Record<string, number>; autoQuoted: number; manuallyQuoted: number; avgPrice: number };
  subscriptions: { active: number; byPlan: Record<string, number> };
  credits: { totalIssued: number; totalRevenue: number; pendingPurchases: number };
  notifications: { total: number; unread: number };
  server: {
    memory: { totalMB: number; usedMB: number; freeMB: number; usedPct: number };
    process: { heapUsedMB: number; heapTotalMB: number; rssMB: number };
    cpu: { count: number; model: string; loadAvg1: number; loadAvg5: number; loadAvg15: number };
    uptimeHours: number; nodeVersion: string; platform: string;
  };
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color = 'bg-primary' }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-border rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function AdminMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) setMetrics(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!metrics) {
    return <div className="text-center py-20 text-muted-foreground">Error al cargar métricas</div>;
  }

  const { summary, jobsPerWeek, byServiceType, revenuePerMonth, topMakers, users, jobs, subscriptions, credits, notifications, server } = metrics;

  const pieData = byServiceType.map(d => ({ ...d, name: SERVICE_NAMES[d.service] ?? d.service }));
  const jobStatusData = Object.entries(jobs.byStatus).map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, count }));
  const jobPriceStatusData = Object.entries(jobs.byPriceStatus).map(([status, count]) => ({ name: PRICE_STATUS_LABELS[status] ?? status, count }));
  const roleData = Object.entries(users.byRole).map(([role, count]) => ({ name: ROLE_LABELS[role] ?? role, count }));

  const memColor = server.memory.usedPct > 85 ? 'bg-red-500' : server.memory.usedPct > 65 ? 'bg-amber-500' : 'bg-green-500';
  const memTextColor = server.memory.usedPct > 85 ? 'text-red-400' : server.memory.usedPct > 65 ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="space-y-8">

      {/* ── KPIs principales ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumen general</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Trabajos totales" value={summary.totalJobs.toLocaleString()} />
          <StatCard icon={TrendingUp} label="Ingresos totales" value={`RD$ ${summary.totalRevenue.toLocaleString()}`} />
          <StatCard icon={Users} label="Makers activos" value={summary.activeWorkers} />
          <StatCard icon={Star} label={`Rating promedio (${summary.totalRatings})`} value={summary.avgRating ? `${summary.avgRating}/5` : '—'} />
        </div>
      </section>

      {/* ── Usuarios ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usuarios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard icon={Users} label="Total usuarios" value={users.total.toLocaleString()} />
          <StatCard icon={Activity} label="Nuevos esta semana" value={users.newThisWeek} />
          <StatCard icon={TrendingUp} label="Nuevos este mes" value={users.newThisMonth} />
          <StatCard icon={AlertCircle} label="Pendientes aprobación" value={users.pendingApproval} color={users.pendingApproval > 0 ? 'text-amber-400' : 'text-muted-foreground'} />
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">Distribución por rol</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roleData.map(({ name, count }, i) => (
              <div key={name} className="text-center">
                <div className="text-2xl font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trabajos por semana + Servicio ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actividad de trabajos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />Trabajos por semana (últimas 8)
            </h4>
            {jobsPerWeek.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={jobsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Trabajos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
          </div>

          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />Por tipo de servicio
            </h4>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
          </div>
        </div>

        {/* Estado de trabajos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Estado de trabajos</h4>
            <div className="space-y-2">
              {jobStatusData.map(({ name, count }, i) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-semibold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Estado de pagos</h4>
            <div className="space-y-2 mb-3">
              {jobPriceStatusData.map(({ name, count }, i) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-semibold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{count}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex gap-4 text-xs text-muted-foreground">
              <span>Auto-cotizados: <strong className="text-violet-400">{jobs.autoQuoted}</strong></span>
              <span>Manuales: <strong className="text-foreground">{jobs.manuallyQuoted}</strong></span>
              {jobs.avgPrice > 0 && <span>Precio prom.: <strong className="text-green-400">RD${jobs.avgPrice.toLocaleString()}</strong></span>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ingresos + Top makers ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ingresos y makers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />Ingresos por mes (últimos 6)
            </h4>
            {revenuePerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenuePerMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`RD$ ${Number(v).toLocaleString()}`, 'Ingresos']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos de pagos</p>}
          </div>

          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />Top makers
            </h4>
            {topMakers.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topMakers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="completedJobs" name="Completados" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin makers activos</p>}
          </div>
        </div>
      </section>

      {/* ── Suscripciones + Créditos + Notificaciones ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Suscripciones y créditos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={CreditCard} label="Suscripciones activas" value={subscriptions.active} color="text-cyan-400" />
          <StatCard icon={Zap} label="Créditos emitidos" value={credits.totalIssued.toLocaleString()} sub={`RD$ ${credits.totalRevenue.toLocaleString()} facturado`} color="text-yellow-400" />
          <StatCard icon={AlertCircle} label="Compras créditos pendientes" value={credits.pendingPurchases} color={credits.pendingPurchases > 0 ? 'text-amber-400' : 'text-muted-foreground'} />
          <StatCard icon={Bell} label="Notificaciones sin leer" value={notifications.unread} sub={`${notifications.total.toLocaleString()} en total`} color={notifications.unread > 50 ? 'text-red-400' : 'text-muted-foreground'} />
        </div>
        {Object.keys(subscriptions.byPlan).length > 0 && (
          <div className="glass rounded-xl p-4 mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Suscripciones por plan</h4>
            <div className="flex gap-6 flex-wrap">
              {Object.entries(subscriptions.byPlan).map(([plan, count], i) => (
                <div key={plan} className="text-center">
                  <div className="text-xl font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{count}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-0.5">{plan}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Servidor ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recursos del servidor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Memory */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Memoria del sistema</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className={`text-2xl font-bold ${memTextColor}`}>{server.memory.usedPct}%</span>
              <span className="text-xs text-muted-foreground mb-0.5">usado</span>
            </div>
            <ProgressBar pct={server.memory.usedPct} color={memColor} />
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <div className="flex justify-between"><span>Usado</span><span>{server.memory.usedMB} MB</span></div>
              <div className="flex justify-between"><span>Libre</span><span>{server.memory.freeMB} MB</span></div>
              <div className="flex justify-between"><span>Total</span><span>{server.memory.totalMB} MB</span></div>
            </div>
          </div>

          {/* Process */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-muted-foreground">Proceso Node.js</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400 mb-1">{server.process.rssMB} MB</div>
            <div className="text-xs text-muted-foreground">RSS total</div>
            <ProgressBar pct={Math.round((server.process.heapUsedMB / server.process.heapTotalMB) * 100)} color="bg-cyan-500" />
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <div className="flex justify-between"><span>Heap usado</span><span>{server.process.heapUsedMB} MB</span></div>
              <div className="flex justify-between"><span>Heap total</span><span>{server.process.heapTotalMB} MB</span></div>
              <div className="flex justify-between"><span>Node.js</span><span>{server.nodeVersion}</span></div>
            </div>
          </div>

          {/* CPU + Uptime */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-muted-foreground">CPU y sistema</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">{server.cpu.loadAvg1}</div>
            <div className="text-xs text-muted-foreground">Load avg (1 min)</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <div className="flex justify-between"><span>CPUs</span><span>{server.cpu.count} núcleos</span></div>
              <div className="flex justify-between"><span>Load 5m</span><span>{server.cpu.loadAvg5}</span></div>
              <div className="flex justify-between"><span>Load 15m</span><span>{server.cpu.loadAvg15}</span></div>
              <div className="flex justify-between"><span>Uptime</span><span>{server.uptimeHours}h</span></div>
              <div className="flex justify-between"><span>Plataforma</span><span>{server.platform}</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={fetchMetrics}
          className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />Actualizar métricas
        </button>
      </div>
    </div>
  );
}
