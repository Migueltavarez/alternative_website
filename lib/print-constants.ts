export const FILAMENT_COLORS = [
  'Blanco',
  'Negro',
  'Gris Claro',
  'Gris Oscuro',
  'Rojo',
  'Azul',
  'Azul Marino',
  'Verde',
  'Verde Oscuro',
  'Amarillo',
  'Naranja',
  'Violeta',
  'Rosa',
  'Transparente',
  'Dorado',
  'Plateado',
  'Cobre',
  'Café',
  'Beige',
  'SILK Rojo',
  'SILK Azul',
  'SILK Dorado',
  'SILK Plateado',
] as const;

export const FILAMENT_TYPES = [
  'PLA',
  'PLA+',
  'SILK PLA',
  'ABS',
  'PETG',
  'TPU (Flexible)',
  'ASA',
  'Nylon',
  'Resina (SLA)',
  'WOOD PLA',
] as const;

export const NOZZLE_SIZES = [
  '0.2mm',
  '0.4mm (Estándar)',
  '0.6mm',
  '0.8mm',
  '1.0mm',
] as const;

export const DELIVERY_TIMES = [
  { value: 'standard', label: 'Estándar (7-10 días hábiles)' },
  { value: 'express', label: 'Express (3-5 días hábiles)' },
  { value: 'urgent', label: 'Urgente (1-2 días hábiles)' },
] as const;

export const JOB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: 'En Cola',           color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  assigned:         { label: 'Asignado',          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  accepted:         { label: 'Aceptado',          color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  printing:         { label: 'Imprimiendo',       color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed:        { label: 'Completado',        color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:        { label: 'Cancelado',         color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  needs_revision:   { label: 'Requiere revisión', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

export const MODEL_ISSUES = [
  { id: 'non_manifold',    label: 'Geometría no manifold',         description: 'El modelo tiene bordes o vértices que no cierran correctamente' },
  { id: 'thin_walls',      label: 'Paredes muy delgadas',          description: 'Hay secciones menores al mínimo imprimible' },
  { id: 'inverted_normals',label: 'Normales invertidas',           description: 'Las caras del modelo están orientadas hacia adentro' },
  { id: 'wrong_scale',     label: 'Escala incorrecta',             description: 'El tamaño del modelo no corresponde con lo esperado' },
  { id: 'overhangs',       label: 'Overhangs excesivos',           description: 'Hay voladizos mayores a 45° que requieren soportes adicionales' },
  { id: 'not_watertight',  label: 'Modelo no es watertight',       description: 'El modelo tiene agujeros o superficies abiertas' },
  { id: 'low_resolution',  label: 'Resolución STL muy baja',       description: 'La malla tiene muy pocas caras y se verán bordes angulosos' },
  { id: 'intersections',   label: 'Geometría con intersecciones',  description: 'Partes del modelo se cruzan entre sí' },
  { id: 'other',           label: 'Otro problema',                 description: 'Descríbelo en las notas' },
] as const;
