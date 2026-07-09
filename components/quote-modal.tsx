'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Loader2, ChevronRight, RotateCcw,
  Package, Clock, Layers, AlertCircle,
} from 'lucide-react';
import { FILAMENT_TYPES, FILAMENT_INFO, FILAMENT_COLORS } from '@/lib/print-constants';

type Step = 'upload' | 'options' | 'loading' | 'result' | 'confirm' | 'submitting' | 'error';
type Quality = 'draft' | 'standard' | 'fine';

interface STLData {
  volumeCm3: number;
  bbox: { x: number; y: number; z: number };
  triangleCount: number;
}

interface QuoteData {
  weightG: number;
  printTimeHours: number;
  priceClient: number;
  costMaterial: number;
  costMachine: number;
}

const INFILL_OPTIONS = [15, 20, 30, 50, 100];

const QUALITY_OPTIONS: { value: Quality; label: string; sub: string }[] = [
  { value: 'draft',    label: 'Borrador',  sub: '0.3 mm · más rápido' },
  { value: 'standard', label: 'Estándar',  sub: '0.2 mm · recomendado' },
  { value: 'fine',     label: 'Fino',      sub: '0.1 mm · más detalle' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  initialFile?: File | null;
  onOrderAsGuest: () => void;
}

export function QuoteModal({ isOpen, onClose, isLoggedIn, initialFile, onOrderAsGuest }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [material, setMaterial] = useState('PLA');
  const [infill, setInfill] = useState(20);
  const [quality, setQuality] = useState<Quality>('standard');
  const [stl, setStl] = useState<STLData | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [error, setError] = useState('');
  const [color, setColor] = useState('Blanco');
  const [scale, setScale] = useState(1.0);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setError('');
    setSubmitError('');
    if (initialFile) {
      setFile(initialFile);
      setStep('options');
    } else {
      setFile(null);
      setStep('upload');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFile]);

  function setResult(r: { stl: STLData; quote: QuoteData } | null) {
    setStl(r?.stl ?? null);
    setQuote(r?.quote ?? null);
  }

  const acceptFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.stl')) {
      setError('Solo se aceptan archivos STL por ahora.');
      setStep('error');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('El archivo no puede superar 100 MB.');
      setStep('error');
      return;
    }
    setFile(f);
    setStep('options');
  }, []);

  const calculate = async () => {
    if (!file) return;
    setStep('loading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('material', material);
      fd.append('infill', String(infill));
      fd.append('quality', quality);
      fd.append('scale', String(scale));
      const res = await fetch('/api/quote', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al calcular');
      setResult({ stl: data.stl, quote: data.quote });
      setStep('result');
    } catch (err: any) {
      setError(err.message ?? 'Error al procesar el archivo.');
      setStep('error');
    }
  };

  const handleOrder = () => {
    if (!isLoggedIn) {
      onClose();
      onOrderAsGuest();
      return;
    }
    setSubmitError('');
    setStep('confirm');
  };

  const submitOrder = async () => {
    if (!file || !quote || !stl) return;
    setStep('submitting');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error ?? 'Error al subir archivo');

      const jobRes = await fetch('/api/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: uploadData.fileUrl,
          fileSize: uploadData.fileSize,
          serviceType: 'print_3d',
          color,
          filamentType: material,
          deliveryType,
          deliveryTime: 'standard',
          notes: confirmNotes || null,
          autoQuoted: true,
          quotedPrice: quote.priceClient,
          infill,
          qualityLevel: quality,
          quoteVolumeCm3: stl.volumeCm3,
          quoteBboxX: stl.bbox.x,
          quoteBboxY: stl.bbox.y,
          quoteBboxZ: stl.bbox.z,
        }),
      });
      const jobData = await jobRes.json();
      if (!jobRes.ok || jobData.error) throw new Error(jobData.error ?? 'Error al crear pedido');

      onClose();
      window.location.href = '/dashboard?tab=servicios';
    } catch (err: any) {
      setSubmitError(err.message ?? 'Error al crear el pedido');
      setStep('confirm');
    }
  };

  const backdrop = (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    />
  );

  if (!isOpen) return null;

  return (
    <>
      {backdrop}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl w-full max-w-md pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
            <div>
              <h2 className="font-bold text-lg">Cotizador instantáneo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === 'upload'     && 'Sube tu archivo STL'}
                {step === 'options'    && `${file?.name} · ${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`}
                {step === 'loading'    && 'Analizando tu archivo...'}
                {step === 'result'     && `${stl?.volumeCm3.toFixed(1)} cm³ · ${stl?.bbox.x.toFixed(0)}×${stl?.bbox.y.toFixed(0)}×${stl?.bbox.z.toFixed(0)} mm`}
                {step === 'confirm'    && 'Detalles del pedido'}
                {step === 'submitting' && 'Creando tu pedido...'}
                {step === 'error'      && 'Algo salió mal'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* ── UPLOAD ── */}
            {step === 'upload' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 py-12 transition-all ${
                  dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Arrastra tu archivo STL</p>
                  <p className="text-sm text-muted-foreground mt-0.5">o haz clic para seleccionarlo</p>
                  <p className="text-xs text-muted-foreground mt-3">Máx. 100 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
                />
              </div>
            )}

            {/* ── OPTIONS ── */}
            {step === 'options' && (
              <div className="space-y-5">
                {/* Material */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Material</label>
                  <select
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {FILAMENT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {FILAMENT_INFO[material] && (
                    <p className="text-xs text-muted-foreground mt-1">{FILAMENT_INFO[material]}</p>
                  )}
                </div>

                {/* Infill */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Infill <span className="text-muted-foreground font-normal">(relleno interior)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {INFILL_OPTIONS.map(v => (
                      <button
                        key={v}
                        onClick={() => setInfill(v)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          infill === v
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:border-primary/40'
                        }`}
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {infill <= 15 && 'Mínimo — solo estructural, sin resistencia.'}
                    {infill === 20 && 'Estándar para la mayoría de piezas.'}
                    {infill === 30 && 'Buen balance de resistencia y velocidad.'}
                    {infill === 50 && 'Alta resistencia para piezas funcionales.'}
                    {infill === 100 && 'Sólido — máxima resistencia, más pesado.'}
                  </p>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Calidad de impresión</label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUALITY_OPTIONS.map(q => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        className={`p-2.5 rounded-lg text-left transition-colors border ${
                          quality === q.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="text-sm font-medium">{q.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{q.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Escala <span className="text-muted-foreground font-normal">(multiplicador del tamaño original)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.01"
                      max="10"
                      step="0.05"
                      value={scale}
                      onChange={e => setScale(Math.max(0.01, Math.min(10, parseFloat(e.target.value) || 1)))}
                      className="w-24 px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <span className="text-sm text-muted-foreground">×</span>
                    {scale !== 1 && (
                      <span className="text-xs text-muted-foreground">
                        = {(scale * 100).toFixed(0)}% del tamaño
                        {scale < 1 ? ' (reducido)' : ' (ampliado)'}
                      </span>
                    )}
                    {scale === 1 && <span className="text-xs text-muted-foreground">Tamaño original</span>}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                  >
                    Cambiar archivo
                  </button>
                  <button
                    onClick={calculate}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Calcular precio
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── LOADING ── */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analizando geometría del modelo...</p>
              </div>
            )}

            {/* ── RESULT ── */}
            {step === 'result' && quote && (
              <div className="space-y-4">
                {/* Config summary */}
                <div className="rounded-xl bg-card border border-border p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{material}</strong></span>
                  <span>Infill {infill}%</span>
                  <span>{QUALITY_OPTIONS.find(q => q.value === quality)?.label}</span>
                  {scale !== 1 && <span>Escala ×{scale}</span>}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Package,  label: 'Peso est.',   value: `${quote.weightG.toFixed(1)} g` },
                    { icon: Clock,    label: 'Tiempo est.', value: `~${quote.printTimeHours.toFixed(1)} h` },
                    { icon: Layers,   label: 'Volumen',     value: `${stl!.volumeCm3.toFixed(1)} cm³` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-card border border-border p-3 text-center">
                      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold text-sm mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-card border border-border p-4 text-center text-sm text-muted-foreground">
                  El equipo de Alternative 3D Studio revisará tu modelo y te enviará una cotización.
                </div>

                {/* CTAs */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('options')}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ajustar
                  </button>
                  <button
                    onClick={handleOrder}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {isLoggedIn ? 'Crear pedido' : 'Ordenar ahora'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── CONFIRM ── */}
            {step === 'confirm' && (
              <div className="space-y-5">
                {/* Color */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Color del filamento</label>
                  <select
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {FILAMENT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Delivery type */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo de entrega</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'pickup',   label: 'Recoger',     sub: 'Sin costo adicional' },
                      { value: 'delivery', label: 'Envío',       sub: 'Coordinar con Maker' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDeliveryType(opt.value)}
                        className={`p-3 rounded-lg text-left transition-colors border ${
                          deliveryType === opt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Notas <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={confirmNotes}
                    onChange={e => setConfirmNotes(e.target.value)}
                    placeholder="Ej: terminado liso, sin soportes visibles..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                  />
                </div>

                {/* Quote summary */}
                <div className="rounded-xl bg-card border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{material}</span>
                    {' · '}Infill {infill}%
                    {' · '}{QUALITY_OPTIONS.find(q => q.value === quality)?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Precio pendiente de cotización por el equipo</p>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('result')}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={submitOrder}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Enviar pedido
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── SUBMITTING ── */}
            {step === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Creando tu pedido...</p>
              </div>
            )}

            {/* ── ERROR ── */}
            {step === 'error' && (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="font-medium">No pudimos procesar el archivo</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <button
                  onClick={() => { setStep('upload'); setFile(null); setError(''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
