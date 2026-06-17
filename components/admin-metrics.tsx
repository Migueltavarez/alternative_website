'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import { RefreshCw, TrendingUp, Package, Users, Star } from 'lucide-react';

const SERVICE_NAMES: Record<string, string> = {
  print_3d: 'Impresión 3D',
  laser: 'Láser',
  resin: 'Resina',
  design: 'Diseño',
};

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface Metrics {
  jobsPerWeek: { week: string; count: number }[];
  byServiceType: { service: string; count: number }[];
  revenuePerMonth: { month: string; revenue: number }[];
  topMakers: { name: string; completedJobs: number }[];
  summary: {
    totalJobs: number;
    totalRevenue: number;
    activeWorkers: number;
    avgRating: number;
    totalRatings: number;
  };
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

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

  const { summary, jobsPerWeek, byServiceType, revenuePerMonth, topMakers } = metrics;

  const pieData = byServiceType.map(d => ({
    ...d,
    name: SERVICE_NAMES[d.service] ?? d.service,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Trabajos totales', value: summary.totalJobs.toLocaleString() },
          { icon: TrendingUp, label: 'Ingresos totales', value: `RD$ ${summary.totalRevenue.toLocaleString()}` },
          { icon: Users, label: 'Makers activos', value: summary.activeWorkers.toString() },
          {
            icon: Star,
            label: `Calificación promedio (${summary.totalRatings})`,
            value: summary.avgRating ? `${summary.avgRating} / 5` : 'Sin datos',
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Jobs per week + Service pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />Trabajos por semana (últimas 8)
          </h3>
          {jobsPerWeek.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={jobsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Trabajos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />Distribución por servicio
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </div>
      </div>

      {/* Revenue + Top makers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />Ingresos por mes (últimos 6)
          </h3>
          {revenuePerMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
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
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`RD$ ${Number(v).toLocaleString()}`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos de pagos</p>
          )}
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />Top makers
          </h3>
          {topMakers.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMakers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={90}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="completedJobs" name="Completados" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin makers activos</p>
          )}
        </div>
      </div>

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
