'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, File, X, Clock, Printer, AlertTriangle,
  ChevronDown, ChevronUp, Scissors, Layers, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './file-upload';
import {
  FILAMENT_COLORS, FILAMENT_TYPES, DELIVERY_TIMES, JOB_STATUS_LABELS, MODEL_ISSUES,
  SERVICE_TYPES, PRINT_SCALES, RESIN_COLORS, RESIN_USES,
} from '@/lib/print-constants';

// ── Types ────────────────────────────────────────────────────────────────────

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
  createdAt: string;
  assignedAt?: string;
  makerFeedback?: string | null;
}

interface MyModelsProps {
  printJobs: PrintJob[];
  onRefresh: () => void;
}

// ── Service icons ─────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  print_3d: <Printer className="w-6 h-6" />,
  laser:    <Scissors className="w-6 h-6" />,
  resin:    <Layers className="w-6 h-6" />,
  plans:    <FileText className="w-6 h-6" />,
};

const SERVICE_COLORS: Record<string, string> = {
  print_3d: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  laser:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
  resin:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  plans:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

function getServiceLabel(id?: string) {
  return SERVICE_TYPES.find((s) => s.id === id)?.label ?? 'Impresión 3D';
}

function getDeliveryLabel(value?: string) {
  return DELIVERY_TIMES.find((d) => d.value === value)?.label ?? value ?? 'Estándar';
}

// ── Main component ────────────────────────────────────────────────────────────

export function MyModels({ printJobs, onRefresh }: MyModelsProps) {
  const [showForm, setShowForm]           = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Form state
  const [serviceType, setServiceType]     = useState('');
  const [uploadedFile, setUploadedFile]   = useState<{ fileName: string; fileUrl: string; fileSize?: number } | null>(null);
  const [isUploading, setIsUploading]     = useState(false);
  const [notes, setNotes]                 = useState('');
  const [deliveryTime, setDeliveryTime]   = useState('standard');
  // 3D print
  const [color, setColor]                 = useState('');
  const [filamentType, setFilamentType]   = useState('');
  const [scale, setScale]                 = useState('');
  const [customScale, setCustomScale]     = useState('');
  const [realSize, setRealSize]           = useState('');
  // Laser
  const [laserCutColor, setLaserCutColor]         = useState('');
  const [laserEngravColor, setLaserEngravColor]   = useState('');
  // Resin
  const [resinColor, setResinColor]       = useState('');
  const [resinUse, setResinUse]           = useState('');

  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedService = SERVICE_TYPES.find((s) => s.id === serviceType);

  const resetForm = () => {
    setServiceType('');
    setUploadedFile(null);
    setIsUploading(false);
    setNotes('');
    setDeliveryTime('standard');
    setColor(''); setFilamentType(''); setScale(''); setCustomScale(''); setRealSize('');
    setLaserCutColor(''); setLaserEngravColor('');
    setResinColor(''); setResinUse('');
    setError('');
  };

  const handleServiceChange = (id: string) => {
    setServiceType(id);
    setUploadedFile(null);
    setError('');
  };

  const handleFileUploaded = (fileName: string, fileUrl: string, fileSize?: number) => {
    setUploadedFile({ fileName, fileUrl, fileSize });
    setIsUploading(false);
  };

  const validate = (): string | null => {
    if (!serviceType) return 'Selecciona un tipo de servicio';
    if (!uploadedFile) return 'Sube un archivo primero';

    if (serviceType === 'print_3d') {
      if (!color)        return 'Selecciona el color del filamento';
      if (!filamentType) return 'Selecciona el tipo de filamento';
      if (!scale)        return 'Selecciona la escala del modelo';
      if (scale === 'Personalizada' && !customScale.trim()) return 'Escribe la escala personalizada';
      if (!realSize.trim()) return 'Indica el tamaño real máximo del modelo';
    }
    if (serviceType === 'laser') {
      if (!laserCutColor.trim()) return 'Indica el color de corte en tu archivo';
    }
    if (serviceType === 'resin') {
      if (!resinColor) return 'Selecciona el color de la resina';
      if (!resinUse)   return 'Indica el uso del modelo';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError('');
    setSubmitting(true);

    const finalScale = scale === 'Personalizada' ? customScale.trim() : scale;

    try {
      const res = await fetch('/api/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadedFile!.fileName,
          fileUrl: uploadedFile!.fileUrl,
          fileSize: uploadedFile!.fileSize,
          notes: notes || undefined,
          deliveryTime,
          serviceType,
          // 3D print
          color: serviceType === 'print_3d' ? color : undefined,
          filamentType: serviceType === 'print_3d' ? filamentType : undefined,
          scale: serviceType === 'print_3d' ? finalScale : undefined,
          realSize: serviceType === 'print_3d' ? realSize.trim() : undefined,
          // Laser
          laserCutColor: serviceType === 'laser' ? laserCutColor.trim() : undefined,
          laserEngravColor: serviceType === 'laser' && laserEngravColor.trim() ? laserEngravColor.trim() : undefined,
          // Resin
          resinColor: serviceType === 'resin' ? resinColor : undefined,
          resinUse: serviceType === 'resin' ? resinUse : undefined,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar el trabajo');

      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mis Trabajos de Impresión</h2>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          <Upload className="w-4 h-4 mr-2" />
          Solicitar servicio
        </Button>
      </div>

      {/* ── Request form ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Nueva solicitud</h3>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1 hover:bg-accent rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1 — Service type */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    ¿Qué servicio necesitas? <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SERVICE_TYPES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleServiceChange(st.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          serviceType === st.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-accent/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 border ${
                          serviceType === st.id
                            ? 'bg-primary/20 border-primary/30 text-primary'
                            : SERVICE_COLORS[st.id] ?? ''
                        }`}>
                          {SERVICE_ICONS[st.id]}
                        </div>
                        <p className="font-medium text-sm leading-tight">{st.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{st.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 — File upload (shown after service selected) */}
                <AnimatePresence>
                  {serviceType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Archivo{' '}
                          <span className="text-muted-foreground font-normal">
                            ({selectedService?.acceptedExtensions.join(', ')})
                          </span>{' '}
                          <span className="text-red-400">*</span>
                        </label>
                        {!uploadedFile ? (
                          <FileUpload
                            onUploadComplete={handleFileUploaded}
                            isUploading={isUploading}
                            acceptedExtensions={selectedService ? [...selectedService.acceptedExtensions] : undefined}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <File className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-green-500 truncate">{uploadedFile.fileName}</p>
                              {uploadedFile.fileSize && (
                                <p className="text-xs text-muted-foreground">{uploadedFile.fileSize.toFixed(2)} MB</p>
                              )}
                            </div>
                            <button type="button" onClick={() => setUploadedFile(null)} className="p-2 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Step 3 — Service-specific fields */}

                      {/* ── 3D Print ── */}
                      {serviceType === 'print_3d' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color del filamento <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecciona un color</option>
                                {FILAMENT_COLORS.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Tipo de filamento <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={filamentType}
                                onChange={(e) => setFilamentType(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecciona el material</option>
                                {FILAMENT_TYPES.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Escala del modelo <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={scale}
                                onChange={(e) => setScale(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecciona una escala</option>
                                {PRINT_SCALES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {scale === 'Personalizada' && (
                                <input
                                  type="text"
                                  value={customScale}
                                  onChange={(e) => setCustomScale(e.target.value)}
                                  placeholder="Ej: 1:75, 2:1, 3:500..."
                                  className="mt-2 w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Tamaño real máximo del modelo <span className="text-red-400">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={realSize}
                                  onChange={(e) => setRealSize(e.target.value)}
                                  placeholder="Ej: 0.30 × 0.15 × 0.10"
                                  className="w-full pl-4 pr-14 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">metros</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Largo × Ancho × Alto en metros reales</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Laser ── */}
                      {serviceType === 'laser' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <p className="text-xs text-amber-400 font-medium mb-1">¿Cómo indicar los colores?</p>
                            <p className="text-xs text-muted-foreground">
                              En tu archivo PDF los elementos tienen colores distintos. Indica qué color corresponde a corte y cuál a grabado (ej: Rojo = corte, Negro = grabado).
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color para corte <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={laserCutColor}
                                onChange={(e) => setLaserCutColor(e.target.value)}
                                placeholder="Ej: Rojo, #FF0000, RGB(255,0,0)"
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color para grabado <span className="text-muted-foreground font-normal">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                value={laserEngravColor}
                                onChange={(e) => setLaserEngravColor(e.target.value)}
                                placeholder="Ej: Negro, #000000, RGB(0,0,0)"
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Resin ── */}
                      {serviceType === 'resin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Color de la resina <span className="text-red-400">*</span>
                            </label>
                            <select
                              value={resinColor}
                              onChange={(e) => setResinColor(e.target.value)}
                              className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Selecciona un color</option>
                              {RESIN_COLORS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Uso del modelo <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-3 mt-1">
                              {RESIN_USES.map((u) => (
                                <label
                                  key={u.value}
                                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                                    resinUse === u.value
                                      ? 'border-primary bg-primary/10 font-medium'
                                      : 'border-border hover:border-primary/40'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="resinUse"
                                    value={u.value}
                                    checked={resinUse === u.value}
                                    onChange={() => setResinUse(u.value)}
                                    className="sr-only"
                                  />
                                  {u.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Plans — no extra fields ── */}
                      {serviceType === 'plans' && (
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xs text-blue-400 font-medium mb-1">Impresión de planos</p>
                          <p className="text-xs text-muted-foreground">
                            Sube tu archivo PDF. Si necesitas un tamaño de papel específico (A0, A1, A2...) o alguna indicación especial, indícalo en las notas.
                          </p>
                        </div>
                      )}

                      {/* Step 4 — Common fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Tiempo de entrega <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={deliveryTime}
                            onChange={(e) => setDeliveryTime(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {DELIVERY_TIMES.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Instrucciones especiales, detalles del proyecto..."
                            rows={1}
                            className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-sm text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                        </p>
                      )}

                      <Button type="submit" disabled={!uploadedFile || isUploading || submitting} className="w-full" isLoading={submitting}>
                        {!submitting && <Upload className="w-4 h-4 mr-2" />}
                        Enviar a la Cola de Impresión
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Job list ─────────────────────────────────────────────────── */}
      {printJobs.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Printer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No tienes trabajos de impresión</h3>
          <p className="text-sm text-muted-foreground">
            Solicita un servicio y lo asignaremos a un maker disponible
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {printJobs.map((job) => {
            const statusInfo = JOB_STATUS_LABELS[job.status] ?? JOB_STATUS_LABELS.pending;
            const svcId = job.serviceType ?? 'print_3d';
            const svcColor = SERVICE_COLORS[svcId] ?? '';
            const isOpen = expandedFeedback === job.id;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${svcColor}`}>
                      {SERVICE_ICONS[svcId] ?? <Printer className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.fileName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>{new Date(job.createdAt).toLocaleDateString('es-ES')}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[11px] ${svcColor}`}>
                          {getServiceLabel(svcId)}
                        </span>
                        {job.deliveryTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDeliveryLabel(job.deliveryTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Spec tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {/* 3D print */}
                  {job.color        && <Spec label={`🎨 ${job.color}`} />}
                  {job.filamentType && <Spec label={`🧵 ${job.filamentType}`} />}
                  {job.scale        && <Spec label={`📐 ${job.scale}`} />}
                  {job.realSize     && <Spec label={`📏 ${job.realSize} m`} />}
                  {/* Laser */}
                  {job.laserCutColor   && <Spec label={`✂️ Corte: ${job.laserCutColor}`} />}
                  {job.laserEngravColor && <Spec label={`✏️ Grabado: ${job.laserEngravColor}`} />}
                  {/* Resin */}
                  {job.resinColor && <Spec label={`💧 ${job.resinColor}`} />}
                  {job.resinUse   && <Spec label={RESIN_USES.find((u) => u.value === job.resinUse)?.label ?? job.resinUse} />}
                </div>

                {/* Maker feedback alert (needs_revision) */}
                {job.status === 'needs_revision' && job.makerFeedback && (() => {
                  let fb: { issues: string[]; notes: string; suggestion: string } | null = null;
                  try { fb = JSON.parse(job.makerFeedback); } catch { return null; }
                  if (!fb) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedFeedback(isOpen ? null : job.id)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          El maker reportó problemas en tu modelo
                        </span>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3 text-sm border-t border-orange-500/20">
                          <div className="pt-3 space-y-1.5">
                            {fb.issues.map((issueId) => {
                              const issue = MODEL_ISSUES.find((m) => m.id === issueId);
                              return issue ? (
                                <div key={issueId} className="flex items-start gap-2">
                                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                  <div>
                                    <span className="font-medium">{issue.label}</span>
                                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                          {fb.notes && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Notas del maker:</span>
                              <p className="mt-0.5">{fb.notes}</p>
                            </div>
                          )}
                          {fb.suggestion && (
                            <div className="p-3 rounded-lg bg-background/60 border border-border">
                              <span className="text-xs font-medium text-muted-foreground">Sugerencia:</span>
                              <p className="mt-0.5">{fb.suggestion}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Corrige el modelo y vuelve a enviarlo para continuar con la impresión.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function Spec({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{label}</span>
  );
}
