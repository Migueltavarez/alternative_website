'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, TrendingUp, Gift, MessageSquare,
  Shield, RefreshCw, XCircle, ChevronUp, ChevronDown,
  CalendarClock, AlertCircle, Pause, Play, FileEdit, Printer, Trash2, Download, Box, UserCheck,
  DollarSign, ExternalLink, CheckCircle2, Coins, ListChecks, PenTool, Sliders,
} from 'lucide-react';
import { PRICE_STATUS_LABELS, SERVICE_MACHINE_TYPES, MACHINE_TYPES } from '@/lib/print-constants';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { ChatThread } from '@/components/chat-thread';
import { formatCurrency, formatDate, getStatusColor, getPlanBadgeColor } from '@/lib/utils';
import { PLANS } from '@/lib/stripe';
import dynamic from 'next/dynamic';

const AdminMetrics = dynamic(() => import('@/components/admin-metrics').then(m => m.AdminMetrics), { ssr: false });
const QmsDashboard = dynamic(() => import('@/components/qms-dashboard').then(m => m.QmsDashboard), { ssr: false });

interface ChatConversation {
  userId: string;
  name: string | null;
  email: string;
  lastMessage: { content: string; createdAt: string; sender: 'USER' | 'ADMIN' };
  unreadCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [creditPurchases, setCreditPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trabajos' | 'usuarios' | 'suscripciones' | 'mensajes' | 'metricas' | 'qms' | 'aprobaciones' | 'eventos' | 'cursos' | 'precios'>('trabajos');
  const [adminEvents, setAdminEvents] = useState<any[]>([]);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', location: '', type: 'Taller', imageUrl: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', isFree: false, isIntro: false, category: '', thumbnailUrl: '', lessons: [{ title: '', videoUrl: '', duration: '', isFree: false }] });
  const [contentActionLoading, setContentActionLoading] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvUserId, setSelectedConvUserId] = useState<string | null>(null);
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [earningsInputs, setEarningsInputs] = useState<Record<string, string>>({});
  const [jobsTab, setJobsTab] = useState<'cotizacion' | 'asignar' | 'proceso' | 'realizado'>('cotizacion');
  const [pricingConfig, setPricingConfig] = useState<any | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingSuccess, setPricingSuccess] = useState(false);
  const [editPricePerGram, setEditPricePerGram] = useState<Record<string, string>>({});
  const [editMarginPercent, setEditMarginPercent] = useState<Record<string, string>>({});
  const [editDensity, setEditDensity] = useState<Record<string, string>>({});
  const [editMachineRate, setEditMachineRate] = useState('');
  const [editPlatformMargin, setEditPlatformMargin] = useState('');
  const [editMakerSplit, setEditMakerSplit] = useState('');
  const [editExtrusionRates, setEditExtrusionRates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchData();
        fetchConversations();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, subsRes, printJobsRes, workersRes, creditPurchasesRes, pendingWorkersRes, eventsRes, coursesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/users'),
        fetch('/api/subscriptions'),
        fetch('/api/print-jobs/all'),
        fetch('/api/workers/all'),
        fetch('/api/credits/purchases'),
        fetch('/api/admin/workers/pending'),
        fetch('/api/events'),
        fetch('/api/courses'),
      ]);

      const [statsData, usersData, subsData, printJobsData, workersData, creditPurchasesData, pendingWorkersData, eventsData, coursesData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        subsRes.json(),
        printJobsRes.json(),
        workersRes.json(),
        creditPurchasesRes.json(),
        pendingWorkersRes.json(),
        eventsRes.json(),
        coursesRes.json(),
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
      setPrintJobs(Array.isArray(printJobsData) ? printJobsData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setCreditPurchases(Array.isArray(creditPurchasesData) ? creditPurchasesData : []);
      setPendingWorkers(Array.isArray(pendingWorkersData) ? pendingWorkersData : []);
      setAdminEvents(Array.isArray(eventsData) ? eventsData : []);
      setAdminCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (activeTab !== 'mensajes') return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 7000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'precios' || pricingConfig) return;
    setPricingLoading(true);
    fetch('/api/admin/pricing')
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
        return data;
      })
      .then(data => {
        setPricingConfig(data);
        setEditPricePerGram(Object.fromEntries(Object.entries(data.materialPricePerGram as Record<string, number>).map(([k, v]) => [k, String(v)])));
        setEditMarginPercent(Object.fromEntries(Object.entries((data.materialMarginPercent ?? {}) as Record<string, number>).map(([k, v]) => [k, String(v)])));
        setEditDensity(Object.fromEntries(Object.entries(data.materialDensity as Record<string, number>).map(([k, v]) => [k, String(v)])));
        setEditMachineRate(String(data.machineRatePerHour));
        setEditPlatformMargin(String(Math.round(data.platformMargin * 100)));
        setEditMakerSplit(String(Math.round(data.makerSplit * 100)));
        setEditExtrusionRates(Object.fromEntries(Object.entries(data.extrusionRateByQuality as Record<string, number>).map(([k, v]) => [k, String(v)])));
      })
      .catch((err: any) => setPricingError(err.message ?? 'Error al cargar la configuración'))
      .finally(() => setPricingLoading(false));
  }, [activeTab, pricingConfig]);

  const savePricingConfig = async () => {
    setPricingSaving(true);
    setPricingError('');
    setPricingSuccess(false);
    try {
      const payload = {
        materialPricePerGram: Object.fromEntries(Object.entries(editPricePerGram).map(([k, v]) => [k, parseFloat(v)])),
        materialMarginPercent: Object.fromEntries(Object.entries(editMarginPercent).map(([k, v]) => [k, parseFloat(v)])),
        materialDensity: Object.fromEntries(Object.entries(editDensity).map(([k, v]) => [k, parseFloat(v)])),
        machineRatePerHour: parseFloat(editMachineRate),
        platformMargin: parseFloat(editPlatformMargin) / 100,
        makerSplit: parseFloat(editMakerSplit) / 100,
        extrusionRateByQuality: Object.fromEntries(Object.entries(editExtrusionRates).map(([k, v]) => [k, parseFloat(v)])),
      };
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      setPricingConfig(data);
      setPricingSuccess(true);
      setTimeout(() => setPricingSuccess(false), 3000);
    } catch (err: any) {
      setPricingError(err.message ?? 'Error al guardar');
    } finally {
      setPricingSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async (userId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return;
    
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/subscriptions?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseSubscription = async (userId: string) => {
    if (!confirm('¿Pausar esta suscripción?')) return;
    
    setActionLoading(userId);
    try {
      const res = await fetch('/api/subscriptions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'pause' }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreSubscription = async (userId: string) => {
    if (!confirm('¿Restaurar esta suscripción?')) return;
    
    setActionLoading(userId);
    try {
      const res = await fetch('/api/subscriptions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'restore' }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error restoring subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCredits = async (jobId: string, newCredits: number) => {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsCost: newCredits }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating credits:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeductCredits = async (jobId: string) => {
    const job = printJobs.find(j => j.id === jobId);
    if (!job) return;
    
    if (!confirm(`¿Descontar ${job.creditsCost} créditos de ${job.user?.name || 'este usuario'}?`)) return;
    
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deductCredits: true }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al descontar créditos');
      }
    } catch (error) {
      console.error('Error deducting credits:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignWorker = async (jobId: string) => {
    const value = assignSelections[jobId] ?? '';
    setActionLoading(jobId);
    try {
      const body = value === ''
        ? { assignWorker: null }
        : value.includes(':')
          ? { assignWorker: { workerId: value.split(':')[0], machineId: value.split(':')[1] } }
          : { assignWorker: { workerId: value, machineId: null } };

      await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setAssignSelections((prev) => { const s = { ...prev }; delete s[jobId]; return s; });
      fetchData();
    } catch {
      console.error('Error assigning worker');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePrintJob = async (jobId: string) => {
    if (!confirm('¿Eliminar este trabajo de impresión?')) return;
    
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting print job:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrice = async (jobId: string) => {
    const price = priceInputs[jobId];
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert('Ingresa un precio válido');
      return;
    }
    setActionLoading(jobId);
    try {
      await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setPrice: price }),
      });
      setPriceInputs((prev) => { const s = { ...prev }; delete s[jobId]; return s; });
      fetchData();
    } catch { console.error('Error setting price'); }
    finally { setActionLoading(null); }
  };

  const handleValidatePrice = async (jobId: string) => {
    setActionLoading(jobId);
    const newPrice = priceInputs[jobId];
    try {
      await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validatePrice: { price: newPrice || undefined } }),
      });
      setPriceInputs((prev) => { const s = { ...prev }; delete s[jobId]; return s; });
      fetchData();
    } catch { console.error('Error validating price'); }
    finally { setActionLoading(null); }
  };

  const handleConfirmPayment = async (jobId: string) => {
    if (!confirm('¿Confirmar el pago de este trabajo?')) return;
    setActionLoading(jobId);
    try {
      await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPayment: true }),
      });
      fetchData();
    } catch { console.error('Error confirming payment'); }
    finally { setActionLoading(null); }
  };

  const handleConfirmCreditPurchase = async (purchaseId: string) => {
    if (!confirm('¿Confirmar esta compra de créditos y agregarlos al usuario?')) return;
    setActionLoading(purchaseId);
    try {
      const res = await fetch(`/api/credits/${purchaseId}/confirm`, { method: 'PATCH' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al confirmar');
      }
    } catch { console.error('Error confirming credit purchase'); }
    finally { setActionLoading(null); }
  };

  const handleConfirmSubscription = async (subscriptionId: string) => {
    if (!confirm('¿Confirmar esta suscripción y activarla?')) return;
    setActionLoading(subscriptionId);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/confirm`, { method: 'PATCH' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al confirmar');
      }
    } catch { console.error('Error confirming subscription'); }
    finally { setActionLoading(null); }
  };

  const handleWorkerAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(`worker-${userId}-${action}`);
    try {
      const res = await fetch(`/api/admin/workers/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPendingWorkers((prev) => prev.filter((w) => w.id !== userId));
      }
    } catch { console.error('Worker action error'); }
    finally { setActionLoading(null); }
  };

  const handleSetDesignerEarnings = async (jobId: string) => {
    const amount = parseFloat(earningsInputs[jobId] ?? '');
    if (isNaN(amount) || amount < 0) return alert('Ingresa un monto válido');
    setActionLoading(`earnings-${jobId}`);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/designer-earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setPrintJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, designerEarnings: amount } : j));
      } else {
        const d = await res.json();
        alert(d.error || 'Error');
      }
    } catch { console.error('Set earnings error'); }
    finally { setActionLoading(null); }
  };

  const handleMarkDesignerPaid = async (jobId: string) => {
    if (!confirm('¿Confirmar que se pagó al diseñador por este trabajo?')) return;
    setActionLoading(`paid-${jobId}`);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/designer-paid`, { method: 'POST' });
      if (res.ok) {
        setPrintJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, designerPaid: true, designerPaidAt: new Date().toISOString() } : j));
      } else {
        const d = await res.json();
        alert(d.error || 'Error');
      }
    } catch { console.error('Mark paid error'); }
    finally { setActionLoading(null); }
  };

  const handleMarkMakerPaid = async (jobId: string, credits: number) => {
    if (!confirm(`¿Confirmar pago al maker por ${credits} crédito(s) = RD$ ${(credits * 10).toLocaleString('es-DO')}?`)) return;
    setActionLoading(`makerpaid-${jobId}`);
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/maker-paid`, { method: 'POST' });
      if (res.ok) {
        setPrintJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, makerPaid: true, makerPaidAt: new Date().toISOString() } : j));
      } else {
        const d = await res.json();
        alert(d.error || 'Error');
      }
    } catch { console.error('Mark maker paid error'); }
    finally { setActionLoading(null); }
  };

  const handleOpenInBambuStudio = (fileUrl: string, fileName: string) => {
    let publicUrl: string;

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      publicUrl = fileUrl;
    } else if (fileUrl.startsWith('/uploads/')) {
      const fileNameOnly = fileUrl.split('/').pop() || '';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      publicUrl = `${appUrl}/api/print-file/${fileNameOnly}`;
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      publicUrl = `${appUrl}/api/print-file/${fileUrl}`;
    }

    // Bambu Studio expects a plain URL in the protocol — do not encodeURIComponent
    // the full URL because that converts :// and / into %3A%2F%2F etc., which
    // Bambu Studio cannot decode, causing "download failed: unknown file format".
    window.location.href = `bambustudio://open?file=${publicUrl}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const renderJobRow = (job: any) => (
    <tr key={job.id}>
      <td className="px-6 py-4">
        <div className="font-medium">{job.user?.name || 'Usuario'}</div>
        <div className="text-sm text-muted-foreground">{job.user?.email}</div>
        <div className="text-xs text-muted-foreground">
          Créditos disponibles: {job.user?.credits || 0}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">{job.fileName}</span>
          <button
            onClick={() => handleOpenInBambuStudio(job.fileUrl, job.fileName)}
            className="p-1.5 rounded-lg hover:bg-accent text-green-400 hover:text-green-300 transition-colors"
            title="Abrir en Bambu Studio"
          >
            <Box className="w-4 h-4" />
          </button>
          <a
            href={job.fileUrl ? `/api/download${job.fileUrl}` : '#'}
            download={job.fileName}
            className="p-1.5 rounded-lg hover:bg-accent text-blue-400 hover:text-blue-300 transition-colors"
            title="Descargar archivo"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {job.color && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border">
              Color: {job.color}
            </span>
          )}
          {job.filamentType && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border">
              Mat: {job.filamentType}
            </span>
          )}
          {job.designMaterial && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border">
              Mat: {job.designMaterial}
            </span>
          )}
          {job.designIsVehicle && job.designVehicleMake && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border">
              Auto: {job.designVehicleMake} {job.designVehicleModel} {job.designVehicleYear}
            </span>
          )}
        </div>
        {job.designDescription && (
          <p className="text-xs text-pink-400 mt-1 truncate max-w-xs" title={job.designDescription}>
            {job.designDescription}
          </p>
        )}
        {job.designReferenceUrls && (
          <div className="text-xs text-muted-foreground mt-1">
            {job.designReferenceUrls.split('\n').filter(Boolean).slice(0,2).map((url: string, i: number) => (
              <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:underline truncate max-w-xs">
                <ExternalLink className="w-3 h-3 shrink-0" />{url.trim()}
              </a>
            ))}
          </div>
        )}
        {job.referenceImageUrls && (() => {
          try {
            const imgs: string[] = JSON.parse(job.referenceImageUrls);
            if (!imgs.length) return null;
            return (
              <div className="flex gap-1 mt-1 flex-wrap">
                {imgs.slice(0, 4).map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="block w-10 h-10 rounded overflow-hidden border border-border hover:border-primary/40 shrink-0">
                    <img src={url} alt={`ref-${i}`} className="w-full h-full object-cover" />
                  </a>
                ))}
                {imgs.length > 4 && <span className="text-xs text-muted-foreground self-center">+{imgs.length - 4}</span>}
              </div>
            );
          } catch { return null; }
        })()}
        {job.serviceType === 'design' && (
          <div className="mt-2 pt-2 border-t border-white/5">
            {job.designerPaid ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  Pagado RD$ {(job.designerEarnings ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : job.designerEarnings != null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-400 font-medium">
                  Ganancia: RD$ {job.designerEarnings.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleMarkDesignerPaid(job.id)}
                  disabled={!!actionLoading}
                  className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  Marcar pagado
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground shrink-0">Ganancia RD$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={earningsInputs[job.id] ?? ''}
                  onChange={(e) => setEarningsInputs((prev) => ({ ...prev, [job.id]: e.target.value }))}
                  className="w-20 px-1.5 py-0.5 rounded bg-card border border-border text-xs"
                />
                <button
                  onClick={() => handleSetDesignerEarnings(job.id)}
                  disabled={!!actionLoading || !earningsInputs[job.id]}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        )}
        {job.serviceType !== 'design' && job.status === 'completed' && job.assignedWorkerId && (job.creditsCost ?? 0) > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            {job.makerPaid ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  Maker pagado: RD$ {(job.creditsCost * 10).toLocaleString('es-DO', { minimumFractionDigits: 2 })} ({job.creditsCost} cred.)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-400 font-medium">
                  Maker: RD$ {(job.creditsCost * 10).toLocaleString('es-DO', { minimumFractionDigits: 2 })} ({job.creditsCost} cred.)
                </span>
                <button
                  onClick={() => handleMarkMakerPaid(job.id, job.creditsCost)}
                  disabled={!!actionLoading}
                  className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  Marcar pagado
                </button>
              </div>
            )}
          </div>
        )}
        {job.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
            {job.notes}
          </p>
        )}
      </td>
      <td className="px-6 py-4 text-sm">
        {job.status === 'completed' || job.status === 'cancelled' ? (
          job.assignedWorker ? (
            <div>
              <div className="font-medium">{job.assignedWorker.name || 'Worker'}</div>
              <div className="text-xs text-muted-foreground">{job.assignedWorker.email}</div>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Sin asignar</span>
          )
        ) : (() => {
          const currentValue = job.assignedWorkerId
            ? (job.assignedMachineId ? `${job.assignedWorkerId}:${job.assignedMachineId}` : job.assignedWorkerId)
            : '';
          const requiredTypes = SERVICE_MACHINE_TYPES[job.serviceType ?? 'print_3d'];
          const isDesign = job.serviceType === 'design';
          return (
            <div className="flex flex-col gap-1.5">
              {job.assignedWorker && !(jobId => assignSelections[jobId] !== undefined)(job.id) && (
                <div className="text-xs">
                  <span className="font-medium">{job.assignedWorker.name || job.assignedWorker.email}</span>
                  {job.assignedMachine?.name && <span className="text-muted-foreground block">{job.assignedMachine.name}</span>}
                </div>
              )}
              <select
                value={assignSelections[job.id] ?? currentValue}
                onChange={(e) => setAssignSelections((prev) => ({ ...prev, [job.id]: e.target.value }))}
                disabled={actionLoading === job.id}
                className="bg-transparent border border-input rounded px-2 py-1 text-xs w-44"
              >
                <option value="">Sin asignar</option>
                {isDesign
                  ? workers
                      .filter((w: any) => w.isActive && w.user?.role === 'DESIGNER')
                      .map((w: any) => (
                        <option key={w.userId} value={w.userId}>
                          {w.user?.name || w.user?.email}
                        </option>
                      ))
                  : workers.filter((w: any) => w.isActive).map((w: any) =>
                      w.machines
                        ?.filter((m: any) => m.isActive && (!requiredTypes || requiredTypes.includes(m.machineType ?? 'printer_3d')))
                        .map((m: any) => (
                          <option key={`${w.userId}:${m.id}`} value={`${w.userId}:${m.id}`}>
                            {w.user?.name || w.user?.email} — {m.name}
                          </option>
                        ))
                    )}
              </select>
              <Button
                size="sm"
                onClick={() => handleAssignWorker(job.id)}
                disabled={
                  actionLoading === job.id ||
                  assignSelections[job.id] === undefined ||
                  assignSelections[job.id] === currentValue
                }
                className="w-full text-xs h-7 gap-1"
              >
                <UserCheck className="w-3 h-3" />
                Asignar
              </Button>
            </div>
          );
        })()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            defaultValue={job.creditsCost}
            onBlur={(e) => {
              const newValue = parseInt(e.target.value) || 0;
              if (newValue !== job.creditsCost) {
                handleUpdateCredits(job.id, newValue);
              }
            }}
            className="w-20 px-2 py-1 rounded bg-card border border-border text-sm text-center"
            disabled={actionLoading === job.id}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeductCredits(job.id)}
            disabled={actionLoading === job.id || !job.creditsCost || job.creditsCost === 0 || job.creditsDeducted || job.status !== 'completed'}
            className={job.creditsDeducted ? "opacity-50" : "text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50"}
          >
            {job.creditsDeducted ? "Descontado" : job.status !== 'completed' ? "Completar" : "Descontar"}
          </Button>
        </div>
      </td>
      <td className="px-6 py-4 min-w-[200px]">
        {(() => {
          const ps = job.priceStatus ?? 'unpaid';
          const priceInfo = PRICE_STATUS_LABELS[ps];
          const formattedPrice = job.price != null
            ? new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(job.price)
            : null;
          if (ps === 'unpaid') {
            return (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">DOP</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={priceInputs[job.id] ?? ''}
                  onChange={(e) => setPriceInputs((prev) => ({ ...prev, [job.id]: e.target.value }))}
                  className="w-24 px-2 py-1 rounded bg-card border border-border text-sm"
                  disabled={actionLoading === job.id}
                />
                <Button size="sm" onClick={() => handleSetPrice(job.id)}
                  disabled={actionLoading === job.id || !priceInputs[job.id]} className="h-7 text-xs px-2">
                  <DollarSign className="w-3 h-3 mr-1" />Cotizar
                </Button>
              </div>
            );
          }
          if (ps === 'quoted') {
            return (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{formattedPrice}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${priceInfo?.color}`}>Esperando cliente</span>
              </div>
            );
          }
          if (ps === 'accepted') {
            return (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{formattedPrice}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${priceInfo?.color}`}>Aceptado</span>
                <Button size="sm" onClick={() => handleValidatePrice(job.id)}
                  disabled={actionLoading === job.id} className="h-7 text-xs w-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Validar
                </Button>
              </div>
            );
          }
          if (ps === 'appealed') {
            return (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{formattedPrice}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${priceInfo?.color}`}>Apelado</span>
                {job.appealNote && (
                  <p className="text-xs text-muted-foreground italic truncate max-w-[180px]" title={job.appealNote}>{job.appealNote}</p>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">DOP</span>
                  <input type="number" min="0" step="0.01" placeholder={String(job.price ?? '')}
                    value={priceInputs[job.id] ?? ''}
                    onChange={(e) => setPriceInputs((prev) => ({ ...prev, [job.id]: e.target.value }))}
                    className="w-20 px-2 py-1 rounded bg-card border border-border text-xs"
                    disabled={actionLoading === job.id}
                  />
                </div>
                <Button size="sm" onClick={() => handleValidatePrice(job.id)}
                  disabled={actionLoading === job.id} className="h-7 text-xs w-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Validar
                </Button>
              </div>
            );
          }
          if (ps === 'validated') {
            return (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{formattedPrice}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${priceInfo?.color}`}>Listo para pago</span>
              </div>
            );
          }
          if (ps === 'payment_uploaded') {
            return (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{formattedPrice}</p>
                {job.paymentMethod && <p className="text-xs text-muted-foreground">{job.paymentMethod}</p>}
                {job.paymentProofUrl && (
                  <a href={job.paymentProofUrl?.replace('/uploads/', '/api/download/uploads/')}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
                    <ExternalLink className="w-3 h-3" />Ver comprobante
                  </a>
                )}
                <Button size="sm" onClick={() => handleConfirmPayment(job.id)}
                  disabled={actionLoading === job.id}
                  className="h-7 text-xs w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Confirmar pago
                </Button>
              </div>
            );
          }
          if (ps === 'confirmed') {
            return (
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-400">{formattedPrice}</p>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Pagado
                </span>
                {job.paidAt && (
                  <p className="text-xs text-muted-foreground">{new Date(job.paidAt).toLocaleDateString('es-ES')}</p>
                )}
              </div>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        })()}
      </td>
      <td className="px-6 py-4">
        <select
          value={job.status}
          onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
          disabled={actionLoading === job.id}
          className="bg-transparent border border-input rounded px-2 py-1 text-sm"
        >
          <option value="pending">En Cola</option>
          <option value="assigned">Asignado</option>
          <option value="accepted">Aceptado</option>
          <option value="printing">Imprimiendo</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        {job.cameraUrl && (
          <a href={job.cameraUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-400 hover:underline mt-1">
            <Play className="w-3 h-3" />Cámara en vivo
          </a>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatDate(job.createdAt)}
      </td>
      <td className="px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => handleDeletePrintJob(job.id)}
          disabled={actionLoading === job.id}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestiona usuarios, suscripciones y más</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total usuarios</div>
                  <div className="text-2xl font-bold">{stats?.users || 0}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Suscripciones activas</div>
                  <div className="text-2xl font-bold">{stats?.subscriptions || 0}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">MRR</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Referidos</div>
                  <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* �"?�"? Tabs �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */}
          <div className="flex flex-wrap gap-1 mb-8 p-1 glass rounded-xl w-fit">
            {([
              { key: 'trabajos', label: 'Trabajos', icon: ListChecks },
              { key: 'aprobaciones', label: 'Aprobaciones', icon: UserCheck },
              { key: 'usuarios', label: 'Usuarios', icon: Users },
              { key: 'suscripciones', label: 'Suscripciones', icon: CreditCard },
              { key: 'mensajes', label: 'Mensajes', icon: MessageSquare },
              { key: 'eventos', label: 'Eventos', icon: CalendarClock },
              { key: 'cursos', label: 'Cursos', icon: PenTool },
              { key: 'metricas', label: 'Métricas', icon: TrendingUp },
              { key: 'qms', label: 'Control QC', icon: Shield },
              { key: 'precios', label: 'Precios', icon: Sliders },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === 'mensajes' && conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-semibold">
                    {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                  </span>
                )}
                {key === 'aprobaciones' && pendingWorkers.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-semibold">
                    {pendingWorkers.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: TRABAJOS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'trabajos' && (<>

          {/* Pending credit purchases */}
          {creditPurchases.filter((p: any) => p.status === 'proof_uploaded').length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Coins className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold">Compras de Créditos Pendientes</h2>
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-semibold">
                  {creditPurchases.filter((p: any) => p.status === 'proof_uploaded').length}
                </span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Créditos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Banco</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Comprobante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {creditPurchases
                        .filter((p: any) => p.status === 'proof_uploaded')
                        .map((p: any) => (
                          <tr key={p.id}>
                            <td className="px-6 py-4">
                              <div className="font-medium">{p.user?.name || 'Usuario'}</div>
                              <div className="text-sm text-muted-foreground">{p.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-amber-400">{p.credits}</td>
                            <td className="px-6 py-4 text-sm">${p.amount?.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">{p.paymentMethod || '—'}</td>
                            <td className="px-6 py-4">
                              {p.paymentProofUrl ? (
                                <a
                                  href={p.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver
                                </a>
                              ) : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(p.createdAt).toLocaleDateString('es-DO')}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                size="sm"
                                onClick={() => handleConfirmCreditPurchase(p.id)}
                                disabled={actionLoading === p.id}
                                isLoading={actionLoading === p.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          </>)}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: USUARIOS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'usuarios' && (<>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">Usuarios</h2>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{user.name || 'Sin nombre'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={actionLoading === user.id}
                            className="bg-transparent border border-input rounded px-2 py-1 text-sm"
                          >
                            <option value="USER">USER</option>
                            <option value="WORKER">WORKER (Printeo/Láser)</option>
                            <option value="DESIGNER">DESIGNER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {user.subscription ? (
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPlanBadgeColor(user.subscription.plan)}`}>
                                {user.subscription.plan}
                              </span>
                              <span className={getStatusColor(user.subscription.status)}>
                                {user.subscription.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin plan</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${Number(user.discountBalance || 0) > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {formatCurrency(Number(user.discountBalance || 0))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.subscription && (
                              <>
                                {user.subscription.status === 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePauseSubscription(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                  >
                                    <Pause className="w-4 h-4" />
                                    <span className="ml-1 text-xs">Pausar</span>
                                  </Button>
                                )}
                                {(user.subscription.status === 'past_due' || user.subscription.status === 'canceled') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestoreSubscription(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                  >
                                    <Play className="w-4 h-4" />
                                    <span className="ml-1 text-xs">Restaurar</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelSubscription(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay usuarios registrados
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          </>)}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: SUSCRIPCIONES �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'suscripciones' && (<>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Distribución por plan</h2>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {['BASIC', 'PRO', 'PREMIUM'].map((plan) => (
                <div key={plan} className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">{PLANS[plan as keyof typeof PLANS]?.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPlanBadgeColor(plan)}`}>{plan}</span>
                  </div>
                  <div className="text-3xl font-bold">{stats?.byPlan?.[plan] || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatCurrency((stats?.byPlan?.[plan] || 0) * (PLANS[plan as keyof typeof PLANS]?.price || 0))}/mes
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <CalendarClock className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold">Próximos Cobros del Mes</h2>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Próximo Cobro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {subscriptions
                      .filter((sub: any) => sub.status === 'active' && new Date(sub.currentPeriodEnd) > new Date())
                      .sort((a: any, b: any) => new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime())
                      .slice(0, 10)
                      .map((sub: any) => (
                        <tr key={sub.id}>
                          <td className="px-6 py-4">
                            <div className="font-medium">{sub.user?.name || 'Usuario'}</div>
                            <div className="text-sm text-muted-foreground">{sub.user?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getPlanBadgeColor(sub.plan)}`}>{sub.plan}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-500">
                            {formatCurrency(PLANS[sub.plan as keyof typeof PLANS]?.price || 0)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">{formatDate(sub.currentPeriodEnd)}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {sub.cancelAtPeriodEnd ? (
                              <span className="flex items-center gap-1 text-yellow-500 text-sm"><AlertCircle className="w-4 h-4" />Cancelará</span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-500 text-sm"><CreditCard className="w-4 h-4" />Activo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {subscriptions.filter((sub: any) => sub.status === 'active').length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">No hay suscripciones activas</div>
                )}
              </div>
            </div>
          </motion.div>

          {subscriptions.filter((s: any) => s.status === 'proof_uploaded' || s.status === 'pending_payment').length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">Suscripciones Pendientes</h2>
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 font-semibold">
                  {subscriptions.filter((s: any) => s.status === 'proof_uploaded' || s.status === 'pending_payment').length}
                </span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Banco</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Comprobante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {subscriptions
                        .filter((s: any) => s.status === 'proof_uploaded' || s.status === 'pending_payment')
                        .map((s: any) => (
                          <tr key={s.id}>
                            <td className="px-6 py-4">
                              <div className="font-medium">{s.user?.name || 'Usuario'}</div>
                              <div className="text-sm text-muted-foreground">{s.user?.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPlanBadgeColor(s.plan)}`}>{s.plan}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-yellow-400 font-medium">
                                {s.status === 'proof_uploaded' ? 'Comprobante enviado' : 'Esperando pago'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{s.paymentMethod || '—'}</td>
                            <td className="px-6 py-4">
                              {s.paymentProofUrl ? (
                                <a href={s.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
                                  <ExternalLink className="w-3 h-3" />Ver
                                </a>
                              ) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              {s.status === 'proof_uploaded' && (
                                <Button size="sm" onClick={() => handleConfirmSubscription(s.id)}
                                  disabled={actionLoading === s.id} isLoading={actionLoading === s.id}
                                  className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle2 className="w-4 h-4 mr-1" />Activar
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">Todas las Suscripciones</h2>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Renovación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{sub.user?.name || 'Usuario'}</div>
                          <div className="text-sm text-muted-foreground">{sub.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPlanBadgeColor(sub.plan)}`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusColor(sub.status)}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDate(sub.currentPeriodEnd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          </>)}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: TRABAJOS (Makers + Cola) �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'trabajos' && (<>

          {/* Workers section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Printer className="w-6 h-6 text-primary" />
                Makers Registrados
                <span className="text-base font-normal text-muted-foreground">({workers.filter((w: any) => w.user?.role !== 'DESIGNER').length})</span>
              </h2>
            </div>
            {workers.filter((w: any) => w.user?.role !== 'DESIGNER').length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                No hay makers registrados aún
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.filter((w: any) => w.user?.role !== 'DESIGNER').map((w: any) => {
                  const activeWorkerJobs = printJobs.filter(
                    (j) => j.assignedWorkerId === w.userId &&
                      ['assigned', 'accepted', 'printing'].includes(j.status)
                  ).length;
                  return (
                    <div key={w.id} className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{w.user?.name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{w.completedJobs} completados</span>
                            {activeWorkerJobs > 0 && (
                              <span className="text-xs font-medium text-amber-400">{activeWorkerJobs} activo{activeWorkerJobs !== 1 ? 's' : ''}</span>
                            )}
                            <span className="text-xs text-muted-foreground">· {w.machines?.length ?? 0} máquinas</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${w.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <button
                            onClick={async () => {
                              setActionLoading(w.id);
                              try {
                                await fetch('/api/workers/all', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ workerId: w.id, isActive: !w.isActive }),
                                });
                                fetchData();
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === w.id}
                            className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                          >
                            {w.isActive ? 'Pausar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                      {w.machines?.length > 0 && (
                        <div className="space-y-2">
                          {w.machines.map((m: any) => {
                            const activeMachineJobs = printJobs.filter(
                              (j) => j.assignedMachineId === m.id &&
                                ['assigned', 'accepted', 'printing'].includes(j.status)
                            ).length;
                            const mType = m.machineType ?? 'printer_3d';
                            return (
                              <div key={m.id} className="p-2 rounded-lg bg-card border border-border text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                                  <span className="font-medium">{m.name}</span>
                                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px]">
                                    {MACHINE_TYPES.find((t) => t.value === mType)?.label}
                                  </span>
                                  <div className="ml-auto flex items-center gap-1.5">
                                    {activeMachineJobs > 0 && (
                                      <span className="font-medium text-amber-400">{activeMachineJobs} activo{activeMachineJobs !== 1 ? 's' : ''}</span>
                                    )}
                                    <span className="text-muted-foreground">{m.completedJobs} done</span>
                                  </div>
                                </div>
                                <p className="text-muted-foreground truncate">
                                  {mType === 'laser' ? `${m.laserType ?? ''} · ${m.dimensions ?? ''}` : m.supportedFilaments.join(', ')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Designers section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.87 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <PenTool className="w-6 h-6 text-pink-400" />
                Diseñadores
                <span className="text-base font-normal text-muted-foreground">({workers.filter((w: any) => w.user?.role === 'DESIGNER').length})</span>
              </h2>
            </div>
            {workers.filter((w: any) => w.user?.role === 'DESIGNER').length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                No hay diseñadores asignados aún. Asígnalos desde la pestaña Usuarios.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.filter((w: any) => w.user?.role === 'DESIGNER').map((w: any) => {
                  const activeWorkerJobs = printJobs.filter(
                    (j) => j.assignedWorkerId === w.userId &&
                      ['assigned', 'accepted', 'printing'].includes(j.status)
                  ).length;
                  return (
                    <div key={w.id} className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{w.user?.name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{w.completedJobs} completados</span>
                            {activeWorkerJobs > 0 && (
                              <span className="text-xs font-medium text-amber-400">{activeWorkerJobs} activo{activeWorkerJobs !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${w.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <button
                            onClick={async () => {
                              setActionLoading(w.id);
                              try {
                                await fetch('/api/workers/all', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ workerId: w.id, isActive: !w.isActive }),
                                });
                                fetchData();
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === w.id}
                            className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                          >
                            {w.isActive ? 'Pausar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Cola de Trabajos</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/queue/process', { method: 'POST' });
                    const data = await res.json();
                    alert(`Cola procesada. ${data.assigned ?? 0} trabajos asignados.`);
                    fetchData();
                  } catch {
                    alert('Error al procesar la cola');
                  }
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Procesar Cola
              </Button>
            </div>

            {/* Sub-tabs */}
            {(() => {
              const jobSections = {
                cotizacion: printJobs.filter((j: any) =>
                  ['unpaid','quoted','appealed','validated','payment_uploaded'].includes(j.priceStatus ?? 'unpaid') &&
                  !['delivered','cancelled'].includes(j.status)
                ),
                asignar: printJobs.filter((j: any) => j.priceStatus === 'confirmed' && j.status === 'pending'),
                proceso: printJobs.filter((j: any) =>
                  ['assigned','accepted','printing','needs_revision','correction_requested','completed','ready_to_ship','shipped'].includes(j.status)
                ),
                realizado: printJobs.filter((j: any) => ['delivered','cancelled'].includes(j.status)),
              };
              const tabs: { key: keyof typeof jobSections; label: string }[] = [
                { key: 'cotizacion', label: 'Pendiente de cotización' },
                { key: 'asignar',    label: 'Pendiente de asignar'    },
                { key: 'proceso',    label: 'En proceso'              },
                { key: 'realizado',  label: 'Realizado'               },
              ];
              const activeJobs = jobSections[jobsTab] ?? [];
              return (
                <>
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setJobsTab(tab.key)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          jobsTab === tab.key
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${jobsTab === tab.key ? 'bg-white/20' : 'bg-accent'}`}>
                          {jobSections[tab.key].length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-accent/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Archivo / Specs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Worker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Créditos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Precio / Pago</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {activeJobs.map(renderJobRow)}
                        </tbody>
                      </table>
                      {activeJobs.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          No hay trabajos en esta categoría
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>


          </>)}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: MENSAJES �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'mensajes' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Mensajes de Soporte</h2>
              <div className="glass rounded-2xl overflow-hidden grid md:grid-cols-3">
                <div className="border-r border-border max-h-[70vh] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No hay conversaciones aún
                    </div>
                  ) : (
                    conversations
                      .slice()
                      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())
                      .map((c) => (
                        <button
                          key={c.userId}
                          onClick={() => setSelectedConvUserId(c.userId)}
                          className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors ${
                            selectedConvUserId === c.userId ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{c.name || c.email}</p>
                            {c.unreadCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {c.lastMessage.sender === 'ADMIN' ? 'Tú: ' : ''}{c.lastMessage.content}
                          </p>
                        </button>
                      ))
                  )}
                </div>
                <div className="md:col-span-2 p-4">
                  {selectedConvUserId ? (
                    <ChatThread
                      key={selectedConvUserId}
                      fetchUrl={`/api/admin/chat/${selectedConvUserId}`}
                      postUrl={`/api/admin/chat/${selectedConvUserId}`}
                      mySender="ADMIN"
                      emptyLabel="Aún no hay mensajes en esta conversación."
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[50vh] text-muted-foreground text-sm">
                      Selecciona una conversación
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: M�?TRICAS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'metricas' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Métricas de la plataforma</h2>
              <AdminMetrics />
            </motion.div>
          )}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: QMS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'qms' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Control de Calidad (QMS)</h2>
                <span className="text-xs text-muted-foreground glass px-3 py-1.5 rounded-lg">Quality Management System</span>
              </div>
              <QmsDashboard />
            </motion.div>
          )}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: APROBACIONES �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'aprobaciones' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold">Aprobaciones Pendientes</h2>
                {pendingWorkers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-semibold">{pendingWorkers.length}</span>
                )}
              </div>

              {pendingWorkers.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <UserCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay solicitudes pendientes de aprobación.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingWorkers.map((w: any) => (
                    <div key={w.id} className="glass rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                              w.role === 'DESIGNER'
                                ? 'border-pink-500/30 bg-pink-500/10 text-pink-400'
                                : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                            }`}>
                              {w.role === 'DESIGNER' ? 'Diseñador' : 'Maker'}
                            </span>
                          </div>
                          <p className="font-semibold">{w.name ?? '—'}</p>
                          <p className="text-sm text-muted-foreground">{w.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Solicitud: {new Date(w.workerProfile?.createdAt ?? w.createdAt).toLocaleDateString('es-ES')}
                          </p>

                          {/* Machines */}
                          {w.workerProfile?.machines?.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {w.workerProfile.machines.map((m: any) => (
                                <div key={m.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Printer className="w-3 h-3 shrink-0" />
                                  <span className="font-medium text-foreground">{m.name}</span>
                                  <span>·</span>
                                  <span>{m.machineType === 'laser' ? `Láser ${m.laserType ?? ''}` : m.machineType === 'resin' ? 'Resina' : 'Impresora 3D'}</span>
                                  {m.dimensions && <span>· {m.dimensions}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleWorkerAction(w.id, 'approve')}
                            isLoading={actionLoading === `worker-${w.id}-approve`}
                            disabled={!!actionLoading}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWorkerAction(w.id, 'reject')}
                            isLoading={actionLoading === `worker-${w.id}-reject`}
                            disabled={!!actionLoading}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: EVENTOS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'eventos' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold mb-6">Gestión de Eventos</h2>
              <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Crear evento</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setContentActionLoading('event-create');
                      try {
                        const res = await fetch('/api/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(eventForm),
                        });
                        if (res.ok) {
                          const ev = await res.json();
                          setAdminEvents(prev => [ev, ...prev]);
                          setEventForm({ title: '', description: '', date: '', time: '', location: '', type: 'Taller', imageUrl: '' });
                        } else {
                          const d = await res.json();
                          alert(d.error || 'Error al crear evento');
                        }
                      } catch { alert('Error'); }
                      finally { setContentActionLoading(null); }
                    }}
                    className="space-y-3"
                  >
                    <input required placeholder="Título" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <textarea required placeholder="Descripción" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                      rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary resize-none" />
                    <input required type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <input required placeholder="Hora (ej: 10:00 AM)" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <input required placeholder="Lugar / Dirección" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <select value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary">
                      {['Taller', 'Feria', 'Exhibición', 'Encuentro', 'Conferencia'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input placeholder="URL de imagen (opcional)" value={eventForm.imageUrl} onChange={e => setEventForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <Button type="submit" className="w-full" isLoading={contentActionLoading === 'event-create'}>
                      Crear evento
                    </Button>
                  </form>
                </div>

                <div className="space-y-3">
                  {adminEvents.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No hay eventos creados.</div>
                  ) : adminEvents.map((ev) => (
                    <div key={ev.id} className="glass rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{ev.type}</span>
                          {!ev.published && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Borrador</span>}
                        </div>
                        <p className="font-semibold">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ev.date).toLocaleDateString('es-DO')} · {ev.time} · {ev.location}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm('¿Eliminar este evento?')) return;
                          await fetch(`/api/events/${ev.id}`, { method: 'DELETE' });
                          setAdminEvents(prev => prev.filter(e => e.id !== ev.id));
                        }}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� TAB: CURSOS �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */}
          {activeTab === 'cursos' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold mb-6">Gestión de Cursos</h2>
              <div className="grid lg:grid-cols-[420px_1fr] gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Crear curso</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setContentActionLoading('course-create');
                      try {
                        const payload = {
                          ...courseForm,
                          price: parseFloat(courseForm.price || '0'),
                          lessons: courseForm.lessons.filter(l => l.title.trim()),
                        };
                        const res = await fetch('/api/courses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                        });
                        if (res.ok) {
                          const course = await res.json();
                          setAdminCourses(prev => [course, ...prev]);
                          setCourseForm({ title: '', description: '', price: '', isFree: false, isIntro: false, category: '', thumbnailUrl: '', lessons: [{ title: '', videoUrl: '', duration: '', isFree: false }] });
                        } else {
                          const d = await res.json();
                          alert(d.error || 'Error al crear curso');
                        }
                      } catch { alert('Error'); }
                      finally { setContentActionLoading(null); }
                    }}
                    className="space-y-3"
                  >
                    <input required placeholder="Título del curso" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <textarea required placeholder="Descripción" value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))}
                      rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary resize-none" />
                    <input placeholder="Categoría (ej: Impresión 3D, Diseño)" value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={courseForm.isFree} onChange={e => setCourseForm(f => ({ ...f, isFree: e.target.checked }))} className="rounded" />
                        Gratuito
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={courseForm.isIntro} onChange={e => setCourseForm(f => ({ ...f, isIntro: e.target.checked }))} className="rounded" />
                        Es intro
                      </label>
                    </div>
                    {!courseForm.isFree && (
                      <input type="number" placeholder="Precio (RD$)" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />
                    )}
                    <input placeholder="URL de miniatura (opcional)" value={courseForm.thumbnailUrl} onChange={e => setCourseForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary" />

                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Lecciones</p>
                      {courseForm.lessons.map((lesson, i) => (
                        <div key={i} className="mb-2 p-2 rounded-lg bg-accent/20 space-y-1.5">
                          <input
                            required={i === 0}
                            placeholder={`Lección ${i + 1} — título`}
                            value={lesson.title}
                            onChange={e => setCourseForm(f => { const l = [...f.lessons]; l[i] = { ...l[i], title: e.target.value }; return { ...f, lessons: l }; })}
                            className="w-full px-2 py-1.5 rounded bg-background border border-input text-xs outline-none"
                          />
                          <input
                            placeholder="URL del video (YouTube embed o directo)"
                            value={lesson.videoUrl}
                            onChange={e => setCourseForm(f => { const l = [...f.lessons]; l[i] = { ...l[i], videoUrl: e.target.value }; return { ...f, lessons: l }; })}
                            className="w-full px-2 py-1.5 rounded bg-background border border-input text-xs outline-none"
                          />
                          <div className="flex gap-2 items-center">
                            <input
                              placeholder="Duración (ej: 15 min)"
                              value={lesson.duration}
                              onChange={e => setCourseForm(f => { const l = [...f.lessons]; l[i] = { ...l[i], duration: e.target.value }; return { ...f, lessons: l }; })}
                              className="flex-1 px-2 py-1.5 rounded bg-background border border-input text-xs outline-none"
                            />
                            <label className="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                              <input type="checkbox" checked={lesson.isFree} onChange={e => setCourseForm(f => { const l = [...f.lessons]; l[i] = { ...l[i], isFree: e.target.checked }; return { ...f, lessons: l }; })} />
                              Preview
                            </label>
                            {courseForm.lessons.length > 1 && (
                              <button type="button" onClick={() => setCourseForm(f => ({ ...f, lessons: f.lessons.filter((_, idx) => idx !== i) }))}
                                className="text-red-400 hover:text-red-300 text-xs">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setCourseForm(f => ({ ...f, lessons: [...f.lessons, { title: '', videoUrl: '', duration: '', isFree: false }] }))}
                        className="text-xs text-primary hover:underline">+ Agregar lección</button>
                    </div>

                    <Button type="submit" className="w-full" isLoading={contentActionLoading === 'course-create'}>
                      Crear curso
                    </Button>
                  </form>
                </div>

                <div className="space-y-3">
                  {adminCourses.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No hay cursos creados.</div>
                  ) : adminCourses.map((course) => (
                    <div key={course.id} className="glass rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {course.isFree ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Gratis</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">RD${course.price?.toLocaleString()}</span>
                          )}
                          {course.isIntro && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Intro</span>}
                          {!course.published && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Borrador</span>}
                          {course.category && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{course.category}</span>}
                        </div>
                        <p className="font-semibold">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.lessons?.length ?? 0} lecciones</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const res = await fetch(`/api/courses/${course.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ published: !course.published }),
                            });
                            if (res.ok) setAdminCourses(prev => prev.map(c => c.id === course.id ? { ...c, published: !c.published } : c));
                          }}
                          className="text-xs"
                        >
                          {course.published ? 'Ocultar' : 'Publicar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!confirm('¿Eliminar este curso?')) return;
                            await fetch(`/api/courses/${course.id}`, { method: 'DELETE' });
                            setAdminCourses(prev => prev.filter(c => c.id !== course.id));
                          }}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {/* ── TAB: PRECIOS ── */}
          {activeTab === 'precios' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Configuración de Precios</h2>
                <Button
                  onClick={savePricingConfig}
                  disabled={pricingSaving || pricingLoading || !pricingConfig}
                  isLoading={pricingSaving}
                >
                  {!pricingSaving && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Guardar cambios
                </Button>
              </div>

              {pricingLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando configuración...
                </div>
              )}

              {pricingError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{pricingError}
                </div>
              )}

              {pricingSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />Cambios guardados correctamente.
                </div>
              )}

              {!pricingLoading && pricingConfig && (
                <div className="space-y-6">
                  {/* Materials table */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4">Precio por material</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Material</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Costo / g (RD$)</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Margen %</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Precio / g (RD$)</th>
                            <th className="text-left py-2 font-medium text-muted-foreground">Densidad (g/cm³)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {Object.keys(editPricePerGram).map(mat => {
                            const costo = parseFloat(editPricePerGram[mat] ?? '0') || 0;
                            const margen = parseFloat(editMarginPercent[mat] ?? editPlatformMargin) || 0;
                            const precio = (costo * (1 + margen / 100)).toFixed(2);
                            return (
                              <tr key={mat}>
                                <td className="py-2.5 pr-4 font-medium">{mat}</td>
                                <td className="py-2.5 pr-4">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editPricePerGram[mat] ?? ''}
                                    onChange={e => setEditPricePerGram(p => ({ ...p, [mat]: e.target.value }))}
                                    className="w-24 px-2 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="py-2.5 pr-4">
                                  <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="200"
                                    value={editMarginPercent[mat] ?? ''}
                                    onChange={e => setEditMarginPercent(p => ({ ...p, [mat]: e.target.value }))}
                                    className="w-20 px-2 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span className="text-sm font-semibold text-primary">{precio}</span>
                                </td>
                                <td className="py-2.5">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editDensity[mat] ?? ''}
                                    onChange={e => setEditDensity(p => ({ ...p, [mat]: e.target.value }))}
                                    className="w-24 px-2 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Global config */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4">Configuración global</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tarifa máquina (RD$/hora)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editMachineRate}
                          onChange={e => setEditMachineRate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Margen plataforma (%)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={editPlatformMargin}
                          onChange={e => setEditPlatformMargin(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Se suma al costo base antes de mostrar el precio al cliente</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Split maker (%)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={editMakerSplit}
                          onChange={e => setEditMakerSplit(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Porcentaje del costo base que recibe el maker</p>
                      </div>
                    </div>
                  </div>

                  {/* Extrusion rates */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-1">Velocidad de extrusión (g/hora)</h3>
                    <p className="text-xs text-muted-foreground mb-4">Gramos de filamento extruidos por hora según calidad de impresión. Determina el tiempo estimado.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'draft',    label: 'Borrador (0.3 mm)' },
                        { key: 'standard', label: 'Estándar (0.2 mm)' },
                        { key: 'fine',     label: 'Fino (0.1 mm)' },
                      ].map(q => (
                        <div key={q.key}>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">{q.label}</label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={editExtrusionRates[q.key] ?? ''}
                            onChange={e => setEditExtrusionRates(r => ({ ...r, [q.key]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
