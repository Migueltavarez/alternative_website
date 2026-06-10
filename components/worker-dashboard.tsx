'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, CheckCircle, Play, Clock, AlertCircle,
  File, User, ChevronDown, ChevronUp, RefreshCw,
  Plus, Pencil, Trash2, X, Save, AlertTriangle, MessageSquare,
  Video, ExternalLink, Camera, Eye, EyeOff, Link, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JOB_STATUS_LABELS, DELIVERY_TIMES, FILAMENT_COLORS, FILAMENT_TYPES, NOZZLE_SIZES, MODEL_ISSUES, SERVICE_TYPES, RESIN_USES } from '@/lib/print-constants';

interface PrinterMachine {
  id: string;
  name: string;
  description?: string;
  supportedColors: string[];
  supportedFilaments: string[];
  supportedNozzles: string[];
  isActive: boolean;
  completedJobs: number;
  octoprintUrl?: string | null;
  octoprintApiKey?: string | null;
}

interface WorkerJob {
  id: string;
  fileName: string;
  fileUrl: string;
  serviceType?: string;
  color?: string;
  filamentType?: string;
  deliveryTime?: string;
  notes?: string;
  status: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  createdAt: string;
  cameraUrl?: string | null;
  user: { id: string; name?: string; email: string };
  assignedMachine?: { id: string; name: string; octoprintUrl?: string | null } | null;
  makerFeedback?: string | null;
  // 3D print extras
  scale?: string;
  realSize?: string;
  // Laser
  laserCutColor?: string;
  laserEngravColor?: string;
  // Resin
  resinColor?: string;
  resinUse?: string;
  // Design
  designDescription?: string;
  designMaterial?: string;
  designUse?: string;
}

interface WorkerProfile {
  id: string;
  isActive: boolean;
  completedJobs: number;
  machines: PrinterMachine[];
}

// ─── Multi-select pill component ───────────────────────────────────────────
function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
              selected.includes(opt)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Machine form (add or edit) ─────────────────────────────────────────────
function MachineForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<PrinterMachine>;
  onSave: (data: Omit<PrinterMachine, 'id' | 'completedJobs'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [colors, setColors] = useState<string[]>(initial?.supportedColors ?? []);
  const [filaments, setFilaments] = useState<string[]>(initial?.supportedFilaments ?? []);
  const [nozzles, setNozzles] = useState<string[]>(initial?.supportedNozzles ?? []);
  const [octoprintUrl, setOctoprintUrl] = useState(initial?.octoprintUrl ?? '');
  const [octoprintApiKey, setOctoprintApiKey] = useState(initial?.octoprintApiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOctoprintGuide, setShowOctoprintGuide] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (!colors.length) { setError('Selecciona al menos un color'); return; }
    if (!filaments.length) { setError('Selecciona al menos un filamento'); return; }
    if (!nozzles.length) { setError('Selecciona al menos un nozzle'); return; }
    if (octoprintUrl && !octoprintApiKey) { setError('Ingresa el API Key de OctoPrint'); return; }
    setError('');
    onSave({
      name: name.trim(),
      description: description || undefined,
      supportedColors: colors,
      supportedFilaments: filaments,
      supportedNozzles: nozzles,
      isActive: initial?.isActive ?? true,
      octoprintUrl: octoprintUrl.trim() || null,
      octoprintApiKey: octoprintApiKey.trim() || null,
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre de la máquina *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Ender 3 Pro, Bambu X1 Carbon..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción (opcional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Volumen de impresión, características especiales..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>
      <MultiSelect label="Colores disponibles *" options={FILAMENT_COLORS} selected={colors} onChange={setColors} />
      <MultiSelect label="Tipos de filamento *" options={FILAMENT_TYPES} selected={filaments} onChange={setFilaments} />
      <MultiSelect label="Tamaños de nozzle *" options={NOZZLE_SIZES} selected={nozzles} onChange={setNozzles} />

      {/* ── OctoPrint / Cloudflare Tunnel ── */}
      <div className="pt-2 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            Cámara en vivo — OctoPrint
          </p>
          <button
            type="button"
            onClick={() => setShowOctoprintGuide(!showOctoprintGuide)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Info className="w-3 h-3" />¿Cómo configurar?
          </button>
        </div>

        {showOctoprintGuide && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-green-400">Pasos para exponer OctoPrint con Cloudflare Tunnel:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Descarga <span className="font-mono text-foreground">cloudflared</span> en la PC donde corre OctoPrint</li>
              <li>Ejecuta en terminal:
                <div className="mt-1 px-2 py-1 rounded bg-black/30 font-mono text-[11px] text-green-300">
                  cloudflared tunnel --url http://localhost:5000
                </div>
              </li>
              <li>Copia la URL <span className="font-mono">https://xxxx.trycloudflare.com</span> que aparece</li>
              <li>Pégala en el campo de abajo y agrega tu API Key de OctoPrint</li>
            </ol>
            <p className="text-[11px]">El API Key está en OctoPrint → Configuración → API → Key global</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">URL de OctoPrint (Cloudflare Tunnel)</label>
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="url"
              value={octoprintUrl}
              onChange={(e) => setOctoprintUrl(e.target.value)}
              placeholder="https://xxxx.trycloudflare.com"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {octoprintUrl && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">API Key de OctoPrint *</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={octoprintApiKey}
                onChange={(e) => setOctoprintApiKey(e.target.value)}
                placeholder="Ej: ABCDEF123456..."
                className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button onClick={submit} disabled={saving} isLoading={saving} className="flex-1">
          {!saving && <Save className="w-4 h-4 mr-2" />}
          Guardar máquina
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function WorkerDashboard() {
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Machine UI state
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [machineFormSaving, setMachineFormSaving] = useState(false);

  // Feedback state
  const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);
  const [feedbackIssues, setFeedbackIssues] = useState<string[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Camera modal state
  const [cameraModal, setCameraModal] = useState<{ jobId: string; cameraUrl: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, profileRes] = await Promise.all([
        fetch('/api/workers/jobs'),
        fetch('/api/workers/profile'),
      ]);
      const [jobsData, profileData] = await Promise.all([jobsRes.json(), profileRes.json()]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setProfile(profileData.profile ?? null);
    } catch (e) {
      console.error('Worker fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, 30_000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 1_000);
    return () => { clearInterval(pollInterval); clearInterval(tickInterval); };
  }, [fetchData]);

  const handleJobAction = async (jobId: string, action: 'accept' | 'start' | 'complete', cameraUrl?: string) => {
    setActionLoading(`${jobId}-${action}`);
    try {
      const body = action === 'start' ? JSON.stringify({ cameraUrl: cameraUrl || undefined }) : undefined;
      const res = await fetch(`/api/workers/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');
      const msg = { accept: '¡Trabajo aceptado! Prepara los materiales.', start: 'Impresión iniciada.', complete: 'Trabajo completado.' }[action];
      showNotification('success', msg);
      setCameraModal(null);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitFeedback = async (jobId: string) => {
    if (!feedbackIssues.length) {
      showNotification('error', 'Selecciona al menos un problema');
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await fetch(`/api/workers/jobs/${jobId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: feedbackIssues, notes: feedbackNotes, suggestion: feedbackSuggestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      showNotification('success', 'Retroalimentación enviada al cliente');
      setFeedbackJobId(null);
      setFeedbackIssues([]);
      setFeedbackNotes('');
      setFeedbackSuggestion('');
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleToggleWorker = async () => {
    if (!profile) return;
    try {
      const res = await fetch('/api/workers/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !profile.isActive }),
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, isActive: !p.isActive } : p);
        showNotification('success', profile.isActive ? 'Perfil pausado' : 'Perfil activado');
      }
    } catch { showNotification('error', 'Error al cambiar estado'); }
  };

  const handleToggleMachine = async (machineId: string, current: boolean) => {
    setActionLoading(`machine-${machineId}`);
    try {
      const res = await fetch(`/api/workers/machines/${machineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      showNotification('success', current ? 'Máquina pausada' : 'Máquina activada');
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMachine = async (data: Omit<PrinterMachine, 'id' | 'completedJobs'>) => {
    setMachineFormSaving(true);
    try {
      const res = await fetch('/api/workers/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resp = await res.json();
      if (!res.ok) throw new Error(resp.error || 'Error al agregar');
      showNotification('success', 'Máquina agregada');
      setShowAddMachine(false);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setMachineFormSaving(false);
    }
  };

  const handleEditMachine = async (machineId: string, data: Omit<PrinterMachine, 'id' | 'completedJobs'>) => {
    setMachineFormSaving(true);
    try {
      const res = await fetch(`/api/workers/machines/${machineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resp = await res.json();
      if (!res.ok) throw new Error(resp.error || 'Error al guardar');
      showNotification('success', 'Máquina actualizada');
      setEditingMachineId(null);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setMachineFormSaving(false);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!confirm('¿Eliminar esta máquina?')) return;
    setActionLoading(`machine-del-${machineId}`);
    try {
      const res = await fetch(`/api/workers/machines/${machineId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      showNotification('success', 'Máquina eliminada');
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeRemaining = (assignedAt?: string) => {
    if (!assignedAt) return null;
    void tick;
    const remaining = 10 * 60 * 1000 - (Date.now() - new Date(assignedAt).getTime());
    if (remaining <= 0) return 'Tiempo expirado';
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeliveryLabel = (value?: string) =>
    DELIVERY_TIMES.find((d) => d.value === value)?.label ?? value ?? 'Estándar';

  const activeJobs = jobs.filter((j) => ['assigned', 'accepted', 'printing', 'needs_revision', 'correction_requested'].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm ${
              notification.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera URL modal */}
      <AnimatePresence>
        {cameraModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCameraModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Iniciar impresión
                </h3>
                <button onClick={() => setCameraModal(null)} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const job = jobs.find((j) => j.id === cameraModal.jobId);
                const hasOctoprint = !!job?.assignedMachine?.octoprintUrl;
                return hasOctoprint ? (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                    <Video className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400">OctoPrint detectado</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        La cámara y los datos en tiempo real se transmitirán automáticamente al cliente a través de OctoPrint.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Opcional: ingresa la URL de tu cámara para que el cliente pueda ver la impresión en vivo.
                      Para acceso remoto usa <span className="font-mono text-xs text-green-400">cloudflared tunnel</span>.
                    </p>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">URL de cámara (opcional)</label>
                    <input
                      type="url"
                      value={cameraModal.cameraUrl}
                      onChange={(e) => setCameraModal({ ...cameraModal, cameraUrl: e.target.value })}
                      placeholder="ej: https://xxxx.trycloudflare.com/webcam/?action=stream"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-4"
                    />
                  </>
                );
              })()}
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleJobAction(cameraModal.jobId, 'start', cameraModal.cameraUrl || undefined)}
                  isLoading={actionLoading === `${cameraModal.jobId}-start`}
                  disabled={!!actionLoading}
                >
                  <Play className="w-4 h-4 mr-2" />Iniciar impresión
                </Button>
                <Button variant="outline" onClick={() => setCameraModal(null)} disabled={!!actionLoading}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My Machines ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Mis Máquinas
            <span className="text-sm font-normal text-muted-foreground">({profile?.machines.length ?? 0})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 hover:bg-accent rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button onClick={() => { setShowAddMachine(true); setEditingMachineId(null); }} className="text-sm">
              <Plus className="w-4 h-4 mr-1" /> Agregar máquina
            </Button>
          </div>
        </div>

        {/* Worker-level pause toggle */}
        {profile && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-card border border-border">
            <span className={`w-2.5 h-2.5 rounded-full ${profile.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-sm flex-1">
              {profile.isActive ? 'Perfil activo — recibiendo trabajos' : 'Perfil pausado — no recibirás nuevos trabajos'}
            </span>
            <button
              onClick={handleToggleWorker}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {profile.isActive ? 'Pausar todo' : 'Reactivar'}
            </button>
          </div>
        )}

        {/* Add machine form */}
        <AnimatePresence>
          {showAddMachine && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-5 mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Nueva máquina</p>
                <button onClick={() => setShowAddMachine(false)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <MachineForm onSave={handleAddMachine} onCancel={() => setShowAddMachine(false)} saving={machineFormSaving} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Machine cards */}
        {!profile?.machines.length ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Printer className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tienes máquinas registradas.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.machines.map((m) => (
              <motion.div key={m.id} layout className="glass rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${m.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <p className="font-semibold truncate">{m.name}</p>
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{m.completedJobs} trabajos completados</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingMachineId(editingMachineId === m.id ? null : m.id); setShowAddMachine(false); }}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleMachine(m.id, m.isActive)}
                        disabled={actionLoading === `machine-${m.id}`}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                      >
                        {m.isActive ? 'Pausar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteMachine(m.id)}
                        disabled={!!actionLoading}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-muted-foreground"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Capabilities summary */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground mr-1">🎨</span>
                      {m.supportedColors.slice(0, 5).map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-accent">{c}</span>
                      ))}
                      {m.supportedColors.length > 5 && <span className="px-1.5 py-0.5 rounded bg-accent">+{m.supportedColors.length - 5}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground mr-1">🧵</span>
                      {m.supportedFilaments.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 rounded bg-accent">{f}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground mr-1">⚙️</span>
                      {m.supportedNozzles.map((n) => (
                        <span key={n} className="px-1.5 py-0.5 rounded bg-accent">{n}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit form inline */}
                <AnimatePresence>
                  {editingMachineId === m.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border px-4 pb-4 overflow-hidden"
                    >
                      <MachineForm
                        initial={m}
                        onSave={(data) => handleEditMachine(m.id, data)}
                        onCancel={() => setEditingMachineId(null)}
                        saving={machineFormSaving}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Active Jobs ─────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-primary" />
          Trabajos Activos
          {activeJobs.length > 0 && (
            <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">{activeJobs.length}</span>
          )}
        </h3>

        {activeJobs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Printer className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tienes trabajos activos asignados</p>
            <p className="text-sm text-muted-foreground mt-1">Los trabajos aparecerán aquí cuando la plataforma los asigne</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => {
              const statusInfo = JOB_STATUS_LABELS[job.status] ?? JOB_STATUS_LABELS.pending;
              const timeLeft = job.status === 'assigned' ? getTimeRemaining(job.assignedAt) : null;
              const isExpanded = expandedJob === job.id;

              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{job.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <User className="w-3 h-3" />
                            <span>{job.user.name ?? job.user.email}</span>
                            {job.assignedMachine && (
                              <>
                                <span>·</span>
                                <Printer className="w-3 h-3" />
                                <span>{job.assignedMachine.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {timeLeft && (
                          <span className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${
                            timeLeft === 'Tiempo expirado' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            <Clock className="w-3 h-3" />{timeLeft}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.color}`}>{statusInfo.label}</span>
                        <button onClick={() => setExpandedJob(isExpanded ? null : job.id)} className="p-1 hover:bg-accent rounded-lg">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Service type badge */}
                      {(() => {
                        const svc = SERVICE_TYPES.find((s) => s.id === (job.serviceType ?? 'print_3d'));
                        return svc ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                            {svc.label}
                          </span>
                        ) : null;
                      })()}
                      {/* Common */}
                      {job.deliveryTime && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">⏱ {getDeliveryLabel(job.deliveryTime)}</span>}
                      {/* 3D print */}
                      {job.color        && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">🎨 {job.color}</span>}
                      {job.filamentType && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">🧵 {job.filamentType}</span>}
                      {job.scale        && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">📐 {job.scale}</span>}
                      {job.realSize     && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">📏 {job.realSize} m</span>}
                      {/* Laser */}
                      {job.laserCutColor    && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">✂️ Corte: {job.laserCutColor}</span>}
                      {job.laserEngravColor && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">✏️ Grabado: {job.laserEngravColor}</span>}
                      {/* Resin */}
                      {job.resinColor && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">💧 {job.resinColor}</span>}
                      {job.resinUse   && <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{RESIN_USES.find((u) => u.value === job.resinUse)?.label ?? job.resinUse}</span>}
                      {/* Design */}
                      {job.designMaterial && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300">🔧 {job.designMaterial}</span>}
                      {job.designUse && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300">{job.designUse === 'decorative' ? '🌸 Decorativo' : '⚙️ Mecánico'}</span>}
                    </div>

                    {/* Design description */}
                    {job.serviceType === 'design' && job.designDescription && (
                      <div className="mt-2 p-3 rounded-lg bg-pink-500/5 border border-pink-500/20 text-xs text-muted-foreground">
                        <span className="font-medium text-pink-400">Descripción: </span>{job.designDescription}
                      </div>
                    )}

                    {/* Notes */}
                    {job.notes && (
                      <div className="mt-2 p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Notas del cliente: </span>{job.notes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.status === 'assigned' && (
                        <Button className="flex-1" onClick={() => handleJobAction(job.id, 'accept')} disabled={!!actionLoading} isLoading={actionLoading === `${job.id}-accept`}>
                          <CheckCircle className="w-4 h-4 mr-2" />Aceptar trabajo
                        </Button>
                      )}
                      {job.status === 'correction_requested' && (
                        <Button className="flex-1 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10" variant="outline" onClick={() => handleJobAction(job.id, 'accept')} disabled={!!actionLoading} isLoading={actionLoading === `${job.id}-accept`}>
                          <CheckCircle className="w-4 h-4 mr-2" />Aceptar corrección
                        </Button>
                      )}
                      {job.status === 'accepted' && (
                        <Button className="flex-1" onClick={() => setCameraModal({ jobId: job.id, cameraUrl: '' })} disabled={!!actionLoading} isLoading={actionLoading === `${job.id}-start`}>
                          <Play className="w-4 h-4 mr-2" />Iniciar impresión
                        </Button>
                      )}
                      {job.status === 'printing' && (
                        <>
                          <Button className="flex-1" variant="outline" onClick={() => handleJobAction(job.id, 'complete')} disabled={!!actionLoading} isLoading={actionLoading === `${job.id}-complete`}>
                            <CheckCircle className="w-4 h-4 mr-2" />Marcar como completado
                          </Button>
                          {job.assignedMachine?.octoprintUrl ? (
                            <a
                              href={`${job.assignedMachine.octoprintUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-lg border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-colors text-sm flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />OctoPrint
                            </a>
                          ) : job.cameraUrl ? (
                            <a
                              href={job.cameraUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-lg border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-colors text-sm flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />Cámara
                            </a>
                          ) : null}
                        </>
                      )}
                      {['assigned', 'accepted', 'printing'].includes(job.status) && job.status !== 'correction_requested' && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (feedbackJobId === job.id) {
                              setFeedbackJobId(null);
                            } else {
                              setFeedbackJobId(job.id);
                              setFeedbackIssues([]);
                              setFeedbackNotes('');
                              setFeedbackSuggestion('');
                            }
                          }}
                          className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />Reportar problema
                        </Button>
                      )}
                      {job.status === 'needs_revision' && (
                        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                          <MessageSquare className="w-3.5 h-3.5" />Retroalimentación enviada
                        </span>
                      )}
                      {job.fileUrl && (
                        <a
                          href={`/api/download${job.fileUrl}`}
                          download={job.fileName}
                          className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm flex items-center gap-2"
                        >
                          <File className="w-4 h-4" />Descargar
                        </a>
                      )}
                    </div>

                    <AnimatePresence>
                      {feedbackJobId === job.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-3 border-t border-amber-500/20 space-y-3">
                            <p className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                              <AlertTriangle className="w-4 h-4" />
                              Problemas en el modelo
                            </p>
                            <div className="space-y-2">
                              {MODEL_ISSUES.map((issue) => (
                                <label key={issue.id} className="flex items-start gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={feedbackIssues.includes(issue.id)}
                                    onChange={(e) => {
                                      setFeedbackIssues(e.target.checked
                                        ? [...feedbackIssues, issue.id]
                                        : feedbackIssues.filter((i) => i !== issue.id)
                                      );
                                    }}
                                    className="mt-0.5 accent-primary"
                                  />
                                  <div>
                                    <span className="text-sm font-medium">{issue.label}</span>
                                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <textarea
                              value={feedbackNotes}
                              onChange={(e) => setFeedbackNotes(e.target.value)}
                              placeholder="Notas adicionales sobre los problemas..."
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                            />
                            <input
                              type="text"
                              value={feedbackSuggestion}
                              onChange={(e) => setFeedbackSuggestion(e.target.value)}
                              placeholder="Sugerencia para el cliente (ej: usar Meshmixer para reparar...)"
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={() => handleSubmitFeedback(job.id)}
                                disabled={feedbackLoading}
                                isLoading={feedbackLoading}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />Enviar retroalimentación
                              </Button>
                              <Button variant="outline" onClick={() => setFeedbackJobId(null)}>Cancelar</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                        <div className="p-4 space-y-2 text-sm">
                          {job.notes && <div><span className="text-muted-foreground">Notas: </span><span>{job.notes}</span></div>}
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Asignado: {job.assignedAt ? new Date(job.assignedAt).toLocaleString('es-ES') : '-'}</span>
                            <span>Aceptado: {job.acceptedAt ? new Date(job.acceptedAt).toLocaleString('es-ES') : '-'}</span>
                            <span>Iniciado: {job.startedAt ? new Date(job.startedAt).toLocaleString('es-ES') : '-'}</span>
                            <span>Solicitado: {new Date(job.createdAt).toLocaleString('es-ES')}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Completed ───────────────────────────────────────────────── */}
      {completedJobs.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Completados
          </h3>
          <div className="space-y-3">
            {completedJobs.map((job) => (
              <div key={job.id} className="glass rounded-xl p-4 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{job.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.color} · {job.filamentType}
                      {job.assignedMachine && ` · ${job.assignedMachine.name}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
