'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, File, X, Clock, Printer, AlertTriangle,
  ChevronDown, ChevronUp, Scissors, Layers, FileText, Wrench, RefreshCw,
  DollarSign, CheckCircle2, MessageSquare, History, ExternalLink, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './file-upload';
import {
  FILAMENT_COLORS, FILAMENT_TYPES, DELIVERY_TIMES, JOB_STATUS_LABELS, MODEL_ISSUES,
  SERVICE_TYPES, PRINT_SCALES, RESIN_COLORS, RESIN_USES, CORRECTION_COST_CREDITS,
  PRICE_STATUS_LABELS, BANK_ACCOUNTS,
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
  price?: number | null;
  priceStatus?: string;
  appealNote?: string | null;
  paymentProofUrl?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
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

function formatDOP(amount: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
}

// ── Main component ────────────────────────────────────────────────────────────

export function MyModels({ printJobs, onRefresh }: MyModelsProps) {
  const [showForm, setShowForm]           = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Resubmit corrected file
  const [resubmitJobId, setResubmitJobId]   = useState<string | null>(null);
  const [resubmitFile, setResubmitFile]     = useState<{ fileName: string; fileUrl: string; fileSize?: number } | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitError, setResubmitError]   = useState('');

  // Request paid correction
  const [correctionJobId, setCorrectionJobId]   = useState<string | null>(null);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError]   = useState('');

  // Price decision (accept / appeal)
  const [appealOpenJobId, setAppealOpenJobId] = useState<string | null>(null);
  const [appealNote, setAppealNote]           = useState('');
  const [priceDecisionLoading, setPriceDecisionLoading] = useState(false);
  const [priceDecisionError, setPriceDecisionError]     = useState('');

  // Payment proof upload
  const [paymentJobId, setPaymentJobId]   = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError]   = useState('');
  const [copiedBank, setCopiedBank]       = useState<string | null>(null);

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
          color: serviceType === 'print_3d' ? color : undefined,
          filamentType: serviceType === 'print_3d' ? filamentType : undefined,
          scale: serviceType === 'print_3d' ? finalScale : undefined,
          realSize: serviceType === 'print_3d' ? realSize.trim() : undefined,
          laserCutColor: serviceType === 'laser' ? laserCutColor.trim() : undefined,
          laserEngravColor: serviceType === 'laser' && laserEngravColor.trim() ? laserEngravColor.trim() : undefined,
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

  const handleResubmit = async (jobId: string) => {
    if (!resubmitFile) return;
    setResubmitLoading(true);
    setResubmitError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resubmitFile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reenviar');
      setResubmitJobId(null);
      setResubmitFile(null);
      onRefresh();
    } catch (err: any) {
      setResubmitError(err.message);
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleRequestCorrection = async (jobId: string) => {
    setCorrectionLoading(true);
    setCorrectionError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/request-correction`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar corrección');
      setCorrectionJobId(null);
      onRefresh();
    } catch (err: any) {
      setCorrectionError(err.message);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handlePriceDecision = async (jobId: string, action: 'accept' | 'appeal') => {
    if (action === 'appeal' && !appealNote.trim()) {
      setPriceDecisionError('Debes indicar el motivo de la apelación');
      return;
    }
    setPriceDecisionLoading(true);
    setPriceDecisionError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/price-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appealNote: appealNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar decisión');
      setAppealOpenJobId(null);
      setAppealNote('');
      onRefresh();
    } catch (err: any) {
      setPriceDecisionError(err.message);
    } finally {
      setPriceDecisionLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (jobId: string) => {
    if (!paymentProofFile) return;
    if (!paymentMethod) { setPaymentError('Selecciona el banco con el que realizaste el pago'); return; }
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProofUrl: paymentProofFile.fileUrl, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar comprobante');
      setPaymentJobId(null);
      setPaymentProofFile(null);
      setPaymentMethod('');
      onRefresh();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(key);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Jobs with confirmed payment for history section
  const confirmedJobs = printJobs.filter((j) => j.priceStatus === 'confirmed');

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

                {/* Step 2 — File upload */}
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

                      {/* ── Plans ── */}
                      {serviceType === 'plans' && (
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xs text-blue-400 font-medium mb-1">Impresión de planos</p>
                          <p className="text-xs text-muted-foreground">
                            Sube tu archivo PDF. Si necesitas un tamaño de papel específico (A0, A1, A2...) o alguna indicación especial, indícalo en las notas.
                          </p>
                        </div>
                      )}

                      {/* Common fields */}
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
            const ps = job.priceStatus ?? 'unpaid';
            const priceInfo = PRICE_STATUS_LABELS[ps];

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
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {ps !== 'unpaid' && priceInfo && (
                      <span className={`px-2 py-1 rounded-full text-xs border ${priceInfo.color}`}>
                        {priceInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spec tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.color        && <Spec label={`🎨 ${job.color}`} />}
                  {job.filamentType && <Spec label={`🧵 ${job.filamentType}`} />}
                  {job.scale        && <Spec label={`📐 ${job.scale}`} />}
                  {job.realSize     && <Spec label={`📏 ${job.realSize} m`} />}
                  {job.laserCutColor   && <Spec label={`✂️ Corte: ${job.laserCutColor}`} />}
                  {job.laserEngravColor && <Spec label={`✏️ Grabado: ${job.laserEngravColor}`} />}
                  {job.resinColor && <Spec label={`💧 ${job.resinColor}`} />}
                  {job.resinUse   && <Spec label={RESIN_USES.find((u) => u.value === job.resinUse)?.label ?? job.resinUse} />}
                </div>

                {/* ── Price / Payment section ───────────────────────── */}
                {ps === 'quoted' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                        <DollarSign className="w-4 h-4" />
                        Cotización recibida
                      </span>
                      <span className="text-xl font-bold">{formatDOP(job.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Acepta el precio para proceder con el pago, o apela si crees que no es correcto.
                    </p>

                    {priceDecisionError && appealOpenJobId === job.id && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{priceDecisionError}
                      </p>
                    )}

                    {/* Appeal textarea */}
                    {appealOpenJobId === job.id && (
                      <div className="space-y-2">
                        <textarea
                          value={appealNote}
                          onChange={(e) => setAppealNote(e.target.value)}
                          placeholder="Explica por qué estás apelando el precio..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 text-sm"
                            onClick={() => handlePriceDecision(job.id, 'appeal')}
                            disabled={priceDecisionLoading}
                            isLoading={priceDecisionLoading}
                          >
                            {!priceDecisionLoading && <MessageSquare className="w-4 h-4 mr-2" />}
                            Enviar apelación
                          </Button>
                          <Button
                            variant="outline"
                            className="text-sm"
                            onClick={() => { setAppealOpenJobId(null); setAppealNote(''); setPriceDecisionError(''); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {appealOpenJobId !== job.id && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 text-sm"
                          onClick={() => handlePriceDecision(job.id, 'accept')}
                          disabled={priceDecisionLoading}
                          isLoading={priceDecisionLoading}
                        >
                          {!priceDecisionLoading && <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Aceptar precio
                        </Button>
                        <Button
                          variant="outline"
                          className="text-sm text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                          onClick={() => { setAppealOpenJobId(job.id); setAppealNote(''); setPriceDecisionError(''); }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Apelar
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {(ps === 'accepted' || ps === 'appealed') && job.price != null && (
                  <div className={`mt-3 rounded-xl border p-4 ${
                    ps === 'appealed'
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-cyan-500/30 bg-cyan-500/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold flex items-center gap-2 ${ps === 'appealed' ? 'text-orange-400' : 'text-cyan-400'}`}>
                        <DollarSign className="w-4 h-4" />
                        {ps === 'accepted' ? 'Precio aceptado' : 'Apelación enviada'}
                      </span>
                      <span className="text-lg font-bold">{formatDOP(job.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ps === 'accepted'
                        ? 'Esperando validación del administrador para proceder con el pago.'
                        : 'El administrador revisará tu apelación. Te notificaremos cuando esté resuelta.'}
                    </p>
                    {ps === 'appealed' && job.appealNote && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Tu nota: {job.appealNote}</p>
                    )}
                  </div>
                )}

                {ps === 'validated' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-violet-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Listo para pagar
                      </span>
                      <span className="text-xl font-bold">{formatDOP(job.price)}</span>
                    </div>

                    {/* Bank accounts */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Realiza la transferencia a cualquiera de estas cuentas:</p>
                      {BANK_ACCOUNTS.map((bank) => (
                        <div key={bank.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{bank.name}</p>
                            <p className="text-xs text-muted-foreground">{bank.type} · {bank.holder}</p>
                            <p className="text-sm font-mono mt-0.5">{bank.number}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bank.number, bank.id)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0"
                            title="Copiar número"
                          >
                            {copiedBank === bank.id
                              ? <Check className="w-4 h-4 text-green-400" />
                              : <Copy className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Upload proof */}
                    {paymentJobId !== job.id ? (
                      <Button
                        className="w-full text-sm"
                        onClick={() => { setPaymentJobId(job.id); setPaymentProofFile(null); setPaymentMethod(''); setPaymentError(''); }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir comprobante de pago
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Subir comprobante</p>
                          <button
                            onClick={() => { setPaymentJobId(null); setPaymentProofFile(null); setPaymentMethod(''); setPaymentError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Banco utilizado</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          >
                            <option value="">Selecciona el banco</option>
                            {BANK_ACCOUNTS.map((b) => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </div>

                        {!paymentProofFile ? (
                          <FileUpload
                            onUploadComplete={(name, url) => setPaymentProofFile({ fileName: name, fileUrl: url })}
                            isUploading={false}
                            acceptedExtensions={['.jpg', '.jpeg', '.png', '.webp']}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <File className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-green-500 flex-1 truncate">{paymentProofFile.fileName}</span>
                            <button onClick={() => setPaymentProofFile(null)} className="p-1 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {paymentError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{paymentError}
                          </p>
                        )}

                        {paymentProofFile && (
                          <Button
                            className="w-full"
                            onClick={() => handleSubmitPaymentProof(job.id)}
                            disabled={paymentLoading}
                            isLoading={paymentLoading}
                          >
                            {!paymentLoading && <Upload className="w-4 h-4 mr-2" />}
                            Enviar comprobante
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {ps === 'payment_uploaded' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Comprobante enviado
                      </span>
                      <span className="text-lg font-bold">{formatDOP(job.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      El administrador está verificando tu pago. Te notificaremos cuando sea confirmado.
                    </p>
                    {job.paymentMethod && (
                      <p className="text-xs text-muted-foreground">Banco: {job.paymentMethod}</p>
                    )}
                    {job.paymentProofUrl && (
                      <a
                        href={job.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver comprobante
                      </a>
                    )}
                  </div>
                )}

                {ps === 'confirmed' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Pago confirmado
                      </span>
                      <span className="text-lg font-bold text-green-400">{formatDOP(job.price)}</span>
                    </div>
                    {job.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Confirmado el {new Date(job.paidAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

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
                            Elige una opción abajo para continuar con tu pedido.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Revision actions ─────────────────────────────────── */}
                {job.status === 'needs_revision' && (
                  <div className="mt-3 space-y-3">
                    {resubmitJobId !== job.id && correctionJobId !== job.id && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="text-sm"
                          onClick={() => {
                            setResubmitJobId(job.id);
                            setResubmitFile(null);
                            setResubmitError('');
                            setCorrectionJobId(null);
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Subir archivo corregido
                        </Button>
                        <Button
                          variant="outline"
                          className="text-sm text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                          onClick={() => {
                            setCorrectionJobId(job.id);
                            setCorrectionError('');
                            setResubmitJobId(null);
                            setResubmitFile(null);
                          }}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          Solicitar corrección — {CORRECTION_COST_CREDITS} créditos
                        </Button>
                      </div>
                    )}

                    {/* Resubmit form */}
                    {resubmitJobId === job.id && (
                      <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-primary" />
                            Subir archivo corregido
                          </p>
                          <button
                            onClick={() => { setResubmitJobId(null); setResubmitFile(null); setResubmitError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {!resubmitFile ? (
                          <FileUpload
                            onUploadComplete={(name, url, size) =>
                              setResubmitFile({ fileName: name, fileUrl: url, fileSize: size })
                            }
                            isUploading={false}
                            acceptedExtensions={(() => {
                              const svc = SERVICE_TYPES.find((s) => s.id === (job.serviceType ?? 'print_3d'));
                              return svc ? [...svc.acceptedExtensions] : undefined;
                            })()}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <File className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-green-500 flex-1 truncate">{resubmitFile.fileName}</span>
                            <button onClick={() => setResubmitFile(null)} className="p-1 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {resubmitError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{resubmitError}
                          </p>
                        )}
                        {resubmitFile && (
                          <Button
                            className="w-full"
                            onClick={() => handleResubmit(job.id)}
                            disabled={resubmitLoading}
                            isLoading={resubmitLoading}
                          >
                            {!resubmitLoading && <Upload className="w-4 h-4 mr-2" />}
                            Confirmar y reenviar a impresión
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Correction confirmation */}
                    {correctionJobId === job.id && (
                      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Solicitar corrección del modelo
                          </p>
                          <button
                            onClick={() => { setCorrectionJobId(null); setCorrectionError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Un maker corregirá los problemas de tu modelo 3D. Se descontarán{' '}
                          <strong className="text-foreground">{CORRECTION_COST_CREDITS} créditos</strong> de tu cuenta de forma inmediata.
                        </p>
                        {correctionError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{correctionError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleRequestCorrection(job.id)}
                            disabled={correctionLoading}
                            isLoading={correctionLoading}
                          >
                            {!correctionLoading && <Wrench className="w-4 h-4 mr-2" />}
                            Confirmar — {CORRECTION_COST_CREDITS} créditos
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => { setCorrectionJobId(null); setCorrectionError(''); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Payment History ───────────────────────────────────────────── */}
      {confirmedJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold">Historial de Pagos</h3>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Archivo</th>
                    <th className="text-left px-4 py-3 font-medium">Servicio</th>
                    <th className="text-left px-4 py-3 font-medium">Banco</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {confirmedJobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[200px]">{job.fileName}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getServiceLabel(job.serviceType)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {job.paymentMethod ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">
                        {job.price != null ? formatDOP(job.price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {job.paidAt
                          ? new Date(job.paidAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {job.paymentProofUrl && (
                          <a
                            href={job.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Ver
                          </a>
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
    </motion.div>
  );
}

function Spec({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{label}</span>
  );
}
