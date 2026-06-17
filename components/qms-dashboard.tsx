'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronRight,
  Camera, FileCheck, Layers, Scissors, Shield, Package, Truck,
  RotateCcw, X, Plus, Trash2, ZoomIn, Download, Star,
  BarChart2, ClipboardList, Image as ImageIcon, Activity,
  Play, Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  QMS_STAGES, QMS_STAGE_LABELS, STAGE_FLOW,
  FILE_VALIDATION_CHECKS, PRINT_SETUP_CHECKS, POST_PROCESSING_CHECKS,
  PHOTO_CATEGORIES, DEFECT_TYPES, getQcClassification,
  type FileValidationData, type PrintSetupData, type ProductionData,
  type PostProcessingData, type QualityScoreData,
} from '@/lib/qms-constants';
import { SERVICE_TYPES } from '@/lib/print-constants';

// ── Local types ───────────────────────────────────────────────────────────────

interface QmsJob {
  id: string;
  fileName: string;
  serviceType: string;
  status: string;
  qmsStage: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  user: { id: string; name: string | null; email: string };
  assignedWorker?: { id: string; name: string | null } | null;
  qualityInspection?: { id: string } | null;
  qualityPhotos?: { id: string }[];
  _count?: { productionLogs: number };
}

interface FullJob extends QmsJob {
  qualityInspection: {
    id: string;
    fileValidation: string | null;
    printSetup: string | null;
    productionData: string | null;
    postProcessing: string | null;
    qualityScore: string | null;
  } | null;
  qualityPhotos: QmsPhoto[];
  productionLogs: ProductionLogEntry[];
  assignedMachine?: { id: string; name: string; machineType: string } | null;
}

interface QmsPhoto {
  id: string;
  printJobId: string;
  category: string;
  fileUrl: string;
  caption: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface ProductionLogEntry {
  id: string;
  stage: string;
  action: string;
  fromStage?: string | null;
  toStage?: string | null;
  userId: string;
  userName: string;
  comment?: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function stageBadge(stage: string | null) {
  if (!stage) return null;
  const info = QMS_STAGE_LABELS[stage];
  if (!info) return null;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>
      {info.label}
    </span>
  );
}

function serviceLabel(id: string) {
  return SERVICE_TYPES.find(s => s.id === id)?.label ?? id;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  file_validation: <FileCheck className="w-4 h-4" />,
  print_setup:     <Layers className="w-4 h-4" />,
  in_production:   <Play className="w-4 h-4" />,
  post_processing: <Scissors className="w-4 h-4" />,
  quality_check:   <Shield className="w-4 h-4" />,
  ready:           <Package className="w-4 h-4" />,
  delivered:       <Truck className="w-4 h-4" />,
  redo:            <RotateCcw className="w-4 h-4" />,
};

// ── Stage progress bar ────────────────────────────────────────────────────────

function StageProgress({ current }: { current: string | null }) {
  const mainStages = QMS_STAGES.filter(s => s.key !== 'redo');
  const currentIdx = mainStages.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {mainStages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
            i < currentIdx ? 'bg-primary border-primary text-white' :
            i === currentIdx ? 'border-primary text-primary bg-primary/10' :
            'border-border text-muted-foreground'
          }`}>
            {i < currentIdx ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
          </div>
          {i < mainStages.length - 1 && (
            <div className={`h-px w-4 transition-all ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Checklist checkbox ────────────────────────────────────────────────────────

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5">
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
          checked ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
        }`}
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </label>
  );
}

// ── Checklist: File Validation ────────────────────────────────────────────────

function FileValidationForm({ data, onChange }: { data: Partial<FileValidationData>; onChange: (d: Partial<FileValidationData>) => void }) {
  const checks = data.checks ?? {};
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {FILE_VALIDATION_CHECKS.map(c => (
          <CheckItem key={c.key} label={c.label} checked={!!checks[c.key]}
            onChange={v => onChange({ ...data, checks: { ...checks, [c.key]: v } })} />
        ))}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Estado del archivo</label>
        <div className="flex gap-2 flex-wrap">
          {([['approved','Aprobado','green'], ['needs_correction','Requiere corrección','yellow'], ['rejected','Rechazado','red']] as const).map(([val, label, color]) => (
            <button key={val} onClick={() => onChange({ ...data, status: val })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                data.status === val
                  ? color === 'green' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Observaciones</label>
        <textarea value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })}
          rows={3} placeholder="Notas adicionales..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}

// ── Checklist: Print Setup ────────────────────────────────────────────────────

function PrintSetupForm({ data, onChange }: { data: Partial<PrintSetupData>; onChange: (d: Partial<PrintSetupData>) => void }) {
  const checks = data.checks ?? {};
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {PRINT_SETUP_CHECKS.map(c => (
          <CheckItem key={c.key} label={c.label} checked={!!checks[c.key]}
            onChange={v => onChange({ ...data, checks: { ...checks, [c.key]: v } })} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          ['printer', 'Impresora'],
          ['operator', 'Operador'],
          ['material', 'Material'],
        ] as [keyof PrintSetupData, string][]).map(([field, label]) => (
          <div key={field}>
            <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
            <input type="text" value={(data as any)[field] ?? ''}
              onChange={e => onChange({ ...data, [field]: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Peso estimado (g)</label>
          <input type="number" value={data.estimatedWeightG ?? ''} min={0}
            onChange={e => onChange({ ...data, estimatedWeightG: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Tiempo estimado (min)</label>
          <input type="number" value={data.estimatedTimeMin ?? ''} min={0}
            onChange={e => onChange({ ...data, estimatedTimeMin: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
    </div>
  );
}

// ── Checklist: Production ─────────────────────────────────────────────────────

function ProductionForm({ data, onChange }: { data: Partial<ProductionData>; onChange: (d: Partial<ProductionData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Hora inicio</label>
          <input type="datetime-local" value={data.startedAt?.slice(0, 16) ?? ''}
            onChange={e => onChange({ ...data, startedAt: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Hora fin</label>
          <input type="datetime-local" value={data.endedAt?.slice(0, 16) ?? ''}
            onChange={e => onChange({ ...data, endedAt: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Operador</label>
          <input type="text" value={data.operator ?? ''}
            onChange={e => onChange({ ...data, operator: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Impresora</label>
          <input type="text" value={data.printer ?? ''}
            onChange={e => onChange({ ...data, printer: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Inspección de primera capa</label>
        <div className="flex gap-2">
          {([['excellent','Excelente','green'], ['acceptable','Aceptable','yellow'], ['restart','Reiniciar','red']] as const).map(([val, label, color]) => (
            <button key={val} onClick={() => onChange({ ...data, firstLayerCheck: val })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex-1 ${
                data.firstLayerCheck === val
                  ? color === 'green' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Notas</label>
        <textarea value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })}
          rows={2} placeholder="Observaciones de producción..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}

// ── Checklist: Post Processing ────────────────────────────────────────────────

function PostProcessingFormComp({ data, onChange }: { data: Partial<PostProcessingData>; onChange: (d: Partial<PostProcessingData>) => void }) {
  const checks = data.checks ?? {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1">
        {POST_PROCESSING_CHECKS.map(c => (
          <CheckItem key={c.key} label={c.label} checked={!!checks[c.key]}
            onChange={v => onChange({ ...data, checks: { ...checks, [c.key]: v } })} />
        ))}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Observaciones</label>
        <textarea value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })}
          rows={2} placeholder="Observaciones del post-proceso..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}

// ── Quality Score Form ────────────────────────────────────────────────────────

function QualityScoreForm({ data, onChange }: { data: Partial<QualityScoreData>; onChange: (d: Partial<QualityScoreData>) => void }) {
  const scores = data.scores ?? { dimensions: 0, finish: 0, color: 0, resistance: 0, packaging: 0 };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const { label, color, canProceed } = getQcClassification(total);
  const selectedDefects = data.defects ?? [];

  const updateScore = (key: keyof typeof scores, val: number) => {
    const ns = { ...scores, [key]: Math.min(20, Math.max(0, val)) };
    const nt = Object.values(ns).reduce((a, b) => a + b, 0);
    const { label: cl } = getQcClassification(nt);
    onChange({ ...data, scores: ns, total: nt, classification: cl });
  };

  return (
    <div className="space-y-4">
      {([
        ['dimensions', 'Dimensiones'],
        ['finish', 'Acabado superficial'],
        ['color', 'Color / Apariencia'],
        ['resistance', 'Resistencia / Estructura'],
        ['packaging', 'Empaque'],
      ] as [keyof typeof scores, string][]).map(([key, label]) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <span className="text-sm font-bold">{scores[key]} <span className="text-muted-foreground font-normal">/ 20</span></span>
          </div>
          <input type="range" min={0} max={20} value={scores[key]}
            onChange={e => updateScore(key, Number(e.target.value))}
            className="w-full accent-primary" />
        </div>
      ))}

      <div className={`p-3 rounded-xl border text-center transition-all ${
        canProceed ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
      }`}>
        <p className="text-3xl font-black">{total}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
        <p className={`text-sm font-semibold mt-1 ${color}`}>{label}</p>
        {!canProceed && <p className="text-xs text-red-400 mt-1">Mínimo 85 para aprobar</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Defectos detectados</label>
        <div className="grid grid-cols-2 gap-1">
          {DEFECT_TYPES.map(d => (
            <label key={d.key} className="flex items-center gap-2 cursor-pointer group py-1">
              <input type="checkbox" checked={selectedDefects.includes(d.key)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...selectedDefects, d.key]
                    : selectedDefects.filter(x => x !== d.key);
                  onChange({ ...data, defects: next });
                }}
                className="accent-primary" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground">{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Notas del inspector</label>
        <textarea value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })}
          rows={2} placeholder="Observaciones finales..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}

// ── Photo Gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ photos, jobId, onRefresh }: { photos: QmsPhoto[]; jobId: string; onRefresh: () => void }) {
  const [lightbox, setLightbox] = useState<QmsPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState('received');
  const [newCaption, setNewCaption] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const { fileUrl } = await upRes.json();
      if (!fileUrl) throw new Error('Upload failed');
      await fetch(`/api/qms/jobs/${jobId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, category: newCategory, caption: newCaption || undefined }),
      });
      setNewCaption('');
      onRefresh();
    } catch { alert('Error al subir foto'); } finally { setUploading(false); }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    await fetch(`/api/qms/jobs/${jobId}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Upload row */}
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Categoría</label>
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {PHOTO_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground block mb-1">Leyenda (opcional)</label>
          <input type="text" value={newCaption} onChange={e => setNewCaption(e.target.value)}
            placeholder="Descripción..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Subir foto
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Photos grouped by category */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No hay fotos aún
        </div>
      ) : (
        PHOTO_CATEGORIES.map(cat => {
          const catPhotos = photos.filter(p => p.category === cat.key);
          if (!catPhotos.length) return null;
          return (
            <div key={cat.key}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{cat.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {catPhotos.map(p => (
                  <div key={p.id} className="relative group rounded-lg overflow-hidden aspect-square bg-card border border-border">
                    <img src={`/api/download${p.fileUrl}`} alt={p.caption ?? cat.label}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setLightbox(p)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </button>
                      <a href={`/api/download${p.fileUrl}`} download className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">
                        <Download className="w-4 h-4 text-white" />
                      </a>
                      <button onClick={() => deletePhoto(p.id)} className="p-1.5 rounded-full bg-red-500/30 hover:bg-red-500/50 transition">
                        <Trash2 className="w-4 h-4 text-red-300" />
                      </button>
                    </div>
                    {p.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1"><p className="text-[10px] text-white truncate">{p.caption}</p></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
              <img src={`/api/download${lightbox.fileUrl}`} alt={lightbox.caption ?? ''} className="w-full h-full object-contain rounded-xl" />
              {lightbox.caption && <p className="text-center text-sm text-white/70 mt-2">{lightbox.caption}</p>}
              <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ logs }: { logs: ProductionLogEntry[] }) {
  if (!logs.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
      Sin actividad registrada
    </div>
  );
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {logs.map((log, i) => {
          const stageInfo = QMS_STAGE_LABELS[log.toStage ?? log.stage];
          return (
            <div key={log.id} className="relative flex gap-4 pl-8">
              <div className={`absolute left-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                i === logs.length - 1 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
              }`}>
                {STAGE_ICONS[log.toStage ?? log.stage] ?? <Clock className="w-3 h-3" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.userName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('es-ES')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {log.comment && <p className="text-xs text-muted-foreground mt-1 italic">{log.comment}</p>}
                {stageInfo && <span className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded-full border font-semibold ${stageInfo.color}`}>{stageInfo.label}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Job Detail Panel ──────────────────────────────────────────────────────────

function JobDetail({ job, onRefresh }: { job: FullJob; onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<'stage' | 'photos' | 'timeline' | 'score'>('stage');
  const [checklistData, setChecklistData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceComment, setAdvanceComment] = useState('');
  const [error, setError] = useState('');

  const stage = job.qmsStage ?? '';
  const insp = job.qualityInspection;

  // Load existing checklist data for current stage
  useEffect(() => {
    if (!insp || !stage) return;
    const fieldMap: Record<string, string> = {
      file_validation: 'fileValidation', print_setup: 'printSetup',
      in_production: 'productionData', post_processing: 'postProcessing',
      quality_check: 'qualityScore',
    };
    const field = fieldMap[stage];
    if (field && (insp as any)[field]) {
      try { setChecklistData(JSON.parse((insp as any)[field])); } catch {}
    } else {
      setChecklistData({});
    }
  }, [job.id, stage, insp]);

  const saveChecklist = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/qms/jobs/${job.id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, data: checklistData }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onRefresh();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const advanceStage = async (forceRedo = false) => {
    setAdvancing(true);
    setError('');
    try {
      const res = await fetch(`/api/qms/jobs/${job.id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: advanceComment || undefined, forceRedo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAdvanceComment('');
      onRefresh();
    } catch (e: any) { setError(e.message); } finally { setAdvancing(false); }
  };

  const nextStage = STAGE_FLOW[stage];
  const stageInfo = QMS_STAGE_LABELS[stage];

  const tabs = [
    { key: 'stage' as const, label: 'Etapa Actual', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { key: 'photos' as const, label: `Fotos (${job.qualityPhotos.length})`, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { key: 'timeline' as const, label: `Timeline (${job.productionLogs.length})`, icon: <Activity className="w-3.5 h-3.5" /> },
    ...((['quality_check','ready','delivered'].includes(stage)) ? [{ key: 'score' as const, label: 'Puntuación QC', icon: <Star className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{job.fileName}</p>
            <p className="text-xs text-muted-foreground">{job.user.name || job.user.email} · {serviceLabel(job.serviceType)}</p>
          </div>
          {stageInfo && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${stageInfo.color}`}>{stageInfo.label}</span>}
        </div>
        <StageProgress current={stage} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 ${
              activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'stage' && (
          <div className="space-y-4">
            {stage === 'file_validation' && (
              <FileValidationForm data={checklistData} onChange={setChecklistData} />
            )}
            {stage === 'print_setup' && (
              <PrintSetupForm data={checklistData} onChange={setChecklistData} />
            )}
            {stage === 'in_production' && (
              <ProductionForm data={checklistData} onChange={setChecklistData} />
            )}
            {stage === 'post_processing' && (
              <PostProcessingFormComp data={checklistData} onChange={setChecklistData} />
            )}
            {stage === 'quality_check' && (
              <QualityScoreForm data={checklistData} onChange={setChecklistData} />
            )}
            {(stage === 'ready' || stage === 'delivered' || stage === 'redo') && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-primary opacity-50" />
                <p className="text-sm">{stageInfo?.label} — {stage === 'delivered' ? 'Pedido entregado al cliente.' : 'Listo para continuar.'}</p>
                {stage === 'redo' && <p className="text-xs mt-1 text-red-400">Este pedido debe ser rehecho desde la validación de archivo.</p>}
              </div>
            )}
          </div>
        )}
        {activeTab === 'photos' && (
          <PhotoGallery photos={job.qualityPhotos} jobId={job.id} onRefresh={onRefresh} />
        )}
        {activeTab === 'timeline' && (
          <Timeline logs={job.productionLogs} />
        )}
        {activeTab === 'score' && insp?.qualityScore && (() => {
          const score = parseJson<Partial<QualityScoreData>>(insp.qualityScore, {});
          const { label, color } = getQcClassification(score.total ?? 0);
          return (
            <div className="space-y-4">
              <div className="p-4 glass rounded-xl text-center">
                <p className="text-5xl font-black">{score.total ?? 0}<span className="text-lg font-normal text-muted-foreground">/100</span></p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{label}</p>
                {score.inspectedBy && <p className="text-xs text-muted-foreground mt-1">Inspeccionado por {score.inspectedBy}</p>}
              </div>
              <div className="space-y-2">
                {Object.entries(score.scores ?? {}).map(([key, val]) => {
                  const labels: Record<string, string> = { dimensions: 'Dimensiones', finish: 'Acabado', color: 'Color', resistance: 'Resistencia', packaging: 'Empaque' };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{labels[key] ?? key}</span>
                        <span className="font-semibold">{val}/20</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(val / 20) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {(score.defects ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Defectos detectados</p>
                  <div className="flex flex-wrap gap-1">
                    {score.defects!.map(d => {
                      const dt = DEFECT_TYPES.find(x => x.key === d);
                      return <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">{dt?.label ?? d}</span>;
                    })}
                  </div>
                </div>
              )}
              {score.notes && <p className="text-xs text-muted-foreground italic">{score.notes}</p>}
            </div>
          );
        })()}
      </div>

      {/* Action footer */}
      {stage !== 'delivered' && (
        <div className="p-4 border-t border-border space-y-3">
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <input type="text" value={advanceComment} onChange={e => setAdvanceComment(e.target.value)}
            placeholder="Comentario opcional para el historial..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-2">
            {(['file_validation','print_setup','in_production','post_processing','quality_check'].includes(stage)) && (
              <Button variant="outline" onClick={saveChecklist} isLoading={saving} disabled={saving || advancing} className="flex-1 text-sm">
                Guardar checklist
              </Button>
            )}
            {nextStage && nextStage !== 'redo' && stage !== 'redo' && (
              <Button onClick={() => advanceStage(false)} isLoading={advancing} disabled={saving || advancing} className="flex-1 text-sm">
                <ChevronRight className="w-4 h-4 mr-1" />
                {QMS_STAGE_LABELS[nextStage]?.label ?? 'Siguiente'}
              </Button>
            )}
            {stage === 'redo' && (
              <Button onClick={() => advanceStage(false)} isLoading={advancing} disabled={advancing} className="flex-1 text-sm">
                <RotateCcw className="w-4 h-4 mr-1" />Reiniciar validación
              </Button>
            )}
            {!['redo','ready','delivered'].includes(stage) && (
              <Button variant="outline" onClick={() => advanceStage(true)} disabled={advancing}
                className="text-sm text-red-400 border-red-500/30 hover:bg-red-500/10 px-3">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main QMS Dashboard ────────────────────────────────────────────────────────

export function QmsDashboard() {
  const [jobs, setJobs] = useState<QmsJob[]>([]);
  const [stageCounts, setStageCounts] = useState<{ qmsStage: string | null; _count: { id: number } }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [fullJob, setFullJob] = useState<FullJob | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<QmsJob[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [qmsRes, allRes] = await Promise.all([
        fetch('/api/qms/jobs'),
        fetch('/api/qms/jobs?all=1'),
      ]);
      const { jobs: qj, stageCounts: sc } = await qmsRes.json();
      const { jobs: aj } = await allRes.json();
      setJobs(qj);
      setStageCounts(sc);
      setAllJobs(aj);
    } finally { setLoading(false); }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/qms/jobs/${id}`);
      setFullJob(await res.json());
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (selectedJobId) fetchDetail(selectedJobId);
  }, [selectedJobId, fetchDetail]);

  const initiateQms = async (jobId: string) => {
    setInitiating(jobId);
    try {
      const res = await fetch('/api/qms/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        await fetchJobs();
        setSelectedJobId(jobId);
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } finally { setInitiating(null); }
  };

  const filteredJobs = stageFilter === 'all' ? jobs : jobs.filter(j => j.qmsStage === stageFilter);
  const totalByStage = Object.fromEntries(stageCounts.map(s => [s.qmsStage, s._count.id]));

  const handleRefresh = () => {
    fetchJobs();
    if (selectedJobId) fetchDetail(selectedJobId);
  };

  const pendingJobs = allJobs.filter(j => !j.qmsStage);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'En QMS', value: jobs.length, color: 'text-primary' },
          { label: 'Listo para entrega', value: totalByStage['ready'] ?? 0, color: 'text-emerald-400' },
          { label: 'Entregados', value: totalByStage['delivered'] ?? 0, color: 'text-purple-400' },
          { label: 'Rehacer', value: totalByStage['redo'] ?? 0, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        {/* Left: job list */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Stage filter */}
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setStageFilter('all')}
              className={`text-xs px-2 py-1 rounded-lg border transition-all ${stageFilter === 'all' ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
              Todos ({jobs.length})
            </button>
            {QMS_STAGES.filter(s => totalByStage[s.key]).map(s => (
              <button key={s.key} onClick={() => setStageFilter(s.key)}
                className={`text-xs px-2 py-1 rounded-lg border transition-all ${stageFilter === s.key ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                {s.shortLabel} ({totalByStage[s.key] ?? 0})
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {stageFilter === 'all' ? 'En seguimiento' : QMS_STAGE_LABELS[stageFilter]?.label}
            </p>
            <button onClick={handleRefresh} className="p-1 rounded hover:bg-accent transition text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* QMS job list */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-primary" /></div>
            ) : filteredJobs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Sin pedidos en esta etapa</p>
            ) : (
              filteredJobs.map(job => (
                <button key={job.id} onClick={() => setSelectedJobId(job.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedJobId === job.id ? 'bg-primary/10 border-primary/40' : 'border-border hover:bg-accent/40'
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold truncate flex-1">{job.fileName}</p>
                    {job.qmsStage && stageBadge(job.qmsStage)}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{job.user.name || job.user.email}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(job.createdAt).toLocaleDateString('es-ES')}</p>
                </button>
              ))
            )}
          </div>

          {/* Non-QMS jobs section */}
          <div className="border-t border-border pt-3">
            <button onClick={() => setShowAll(!showAll)} className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition">
              <span>Pedidos sin QMS ({pendingJobs.length})</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showAll && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 space-y-1">
                  {pendingJobs.slice(0, 10).map(job => (
                    <div key={job.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border">
                      <p className="text-xs truncate flex-1">{job.fileName}</p>
                      <Button variant="outline" className="text-[10px] px-2 py-1 h-auto shrink-0"
                        onClick={() => initiateQms(job.id)}
                        isLoading={initiating === job.id}
                        disabled={!!initiating}>
                        Iniciar QMS
                      </Button>
                    </div>
                  ))}
                  {pendingJobs.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Todos los pedidos tienen QMS activo</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 glass rounded-2xl overflow-hidden">
          {detailLoading ? (
            <div className="flex items-center justify-center h-full"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>
          ) : fullJob && selectedJobId ? (
            <JobDetail key={selectedJobId} job={fullJob} onRefresh={handleRefresh} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
              <Shield className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Selecciona un pedido para ver su QMS</p>
              <p className="text-xs text-center">Gestiona los controles de calidad, sube fotos y avanza las etapas de producción</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
