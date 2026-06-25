// ── QMS Stage definitions ─────────────────────────────────────────────────────

export const QMS_STAGES = [
  { key: 'file_validation',  label: 'Validación de Archivo', shortLabel: 'Validación',  color: 'blue',    step: 1 },
  { key: 'print_setup',      label: 'Preparación de Impresión', shortLabel: 'Preparación', color: 'violet',  step: 2 },
  { key: 'in_production',    label: 'Producción',             shortLabel: 'Producción',  color: 'orange',  step: 3 },
  { key: 'post_processing',  label: 'Post-Procesado',         shortLabel: 'Post-Proceso',color: 'cyan',    step: 4 },
  { key: 'quality_check',    label: 'Control de Calidad',     shortLabel: 'Control QC',  color: 'green',   step: 5 },
  { key: 'ready',            label: 'Listo para Entrega',     shortLabel: 'Listo',       color: 'emerald', step: 6 },
  { key: 'delivered',        label: 'Entregado',              shortLabel: 'Entregado',   color: 'purple',  step: 7 },
  { key: 'redo',             label: 'Rehacer',                shortLabel: 'Rehacer',     color: 'red',     step: -1 },
] as const;

export type QmsStageKey = typeof QMS_STAGES[number]['key'];

export const QMS_STAGE_LABELS: Record<string, { label: string; color: string }> = {
  file_validation: { label: 'Validación de Archivo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  print_setup:     { label: 'Preparación de Impresión', color: 'bg-primary/20 text-primary border-primary/30' },
  in_production:   { label: 'En Producción',          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  post_processing: { label: 'Post-Procesado',         color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  quality_check:   { label: 'Control de Calidad',     color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ready:           { label: 'Listo para Entrega',     color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  delivered:       { label: 'Entregado',              color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  redo:            { label: 'Rehacer',                color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const STAGE_FLOW: Record<string, string | null> = {
  file_validation: 'print_setup',
  print_setup:     'in_production',
  in_production:   'post_processing',
  post_processing: 'quality_check',
  quality_check:   'ready',
  ready:           'delivered',
  delivered:       null,
  redo:            'file_validation',
};

// ── Photo categories ──────────────────────────────────────────────────────────

export const PHOTO_CATEGORIES = [
  { key: 'received',    label: 'Archivo Recibido' },
  { key: 'print_start', label: 'Inicio Impresión' },
  { key: 'process',     label: 'En Proceso' },
  { key: 'finished',    label: 'Producto Terminado' },
  { key: 'packaging',   label: 'Empaque' },
  { key: 'delivery',    label: 'Entrega' },
] as const;

// ── Defect types ──────────────────────────────────────────────────────────────

export const DEFECT_TYPES = [
  { key: 'warping',          label: 'Warping',              desc: 'Deformación por temperatura' },
  { key: 'layer_shift',      label: 'Layer Shift',          desc: 'Desplazamiento de capas' },
  { key: 'stringing',        label: 'Stringing',            desc: 'Hilos entre partes' },
  { key: 'wrong_color',      label: 'Color Incorrecto',     desc: 'No coincide con lo solicitado' },
  { key: 'transport_damage', label: 'Daño en Transporte',   desc: 'Rotura o golpes' },
  { key: 'file_error',       label: 'Error de Archivo',     desc: 'Problema con el modelo' },
  { key: 'under_extrusion',  label: 'Sub-extrusión',        desc: 'Paredes débiles o porosas' },
  { key: 'over_extrusion',   label: 'Sobre-extrusión',      desc: 'Exceso de material' },
  { key: 'adhesion_failure', label: 'Falla de Adhesión',    desc: 'No pegó a la cama' },
  { key: 'support_damage',   label: 'Daño por Soportes',    desc: 'Marcas de soportes en superficie' },
  { key: 'other',            label: 'Otro',                 desc: 'Describir en notas' },
] as const;

// ── QC score classification ───────────────────────────────────────────────────

export function getQcClassification(total: number): { label: string; color: string; canProceed: boolean } {
  if (total >= 95) return { label: 'Excelente', color: 'text-emerald-400', canProceed: true };
  if (total >= 85) return { label: 'Aprobado', color: 'text-green-400', canProceed: true };
  if (total >= 70) return { label: 'Revisión', color: 'text-yellow-400', canProceed: false };
  return { label: 'Rehacer', color: 'text-red-400', canProceed: false };
}

// ── Checklist definitions (for UI rendering + validation) ─────────────────────

export const FILE_VALIDATION_CHECKS = [
  { key: 'correctFile',           label: 'Archivo correcto recibido' },
  { key: 'correctScale',          label: 'Escala correcta' },
  { key: 'validDimensions',       label: 'Dimensiones válidas' },
  { key: 'minWalls',              label: 'Paredes mínimas verificadas' },
  { key: 'modelRepaired',         label: 'Modelo reparado / validado' },
  { key: 'orientationValidated',  label: 'Orientación validada' },
  { key: 'materialConfirmed',     label: 'Material confirmado' },
] as const;

export const PRINT_SETUP_CHECKS = [
  { key: 'correctFilament',          label: 'Filamento correcto cargado' },
  { key: 'correctColor',             label: 'Color correcto' },
  { key: 'correctProfile',           label: 'Perfil de impresión correcto' },
  { key: 'cleanNozzle',              label: 'Boquilla limpia' },
  { key: 'leveledBed',               label: 'Cama nivelada' },
  { key: 'estimatedTimeValidated',   label: 'Tiempo estimado validado' },
  { key: 'stockConfirmed',           label: 'Stock de material confirmado' },
] as const;

export const POST_PROCESSING_CHECKS = [
  { key: 'supportRemoval', label: 'Retiro de soportes' },
  { key: 'sanding',        label: 'Lijado' },
  { key: 'cleaning',       label: 'Limpieza' },
  { key: 'assembly',       label: 'Ensamble' },
  { key: 'gluing',         label: 'Pegado' },
  { key: 'painting',       label: 'Pintura' },
  { key: 'varnish',        label: 'Barniz' },
  { key: 'other',          label: 'Otro proceso' },
] as const;

// ── TypeScript interfaces for JSON fields ─────────────────────────────────────

export interface FileValidationData {
  checks: Record<string, boolean>;
  status: 'approved' | 'needs_correction' | 'rejected';
  notes: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface PrintSetupData {
  checks: Record<string, boolean>;
  printer: string;
  operator: string;
  material: string;
  estimatedWeightG: number;
  estimatedTimeMin: number;
}

export interface ProductionData {
  startedAt: string;
  endedAt: string;
  firstLayerCheck: 'excellent' | 'acceptable' | 'restart';
  notes: string;
  operator: string;
  printer: string;
}

export interface PostProcessingData {
  checks: Record<string, boolean>;
  notes: string;
}

export interface QualityScoreData {
  scores: {
    dimensions: number;
    finish: number;
    color: number;
    resistance: number;
    packaging: number;
  };
  total: number;
  classification: string;
  defects: string[];
  notes: string;
  inspectedBy: string;
  inspectedAt: string;
}
