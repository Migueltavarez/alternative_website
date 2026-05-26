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
  pending:   { label: 'En Cola',       color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  assigned:  { label: 'Asignado',      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  accepted:  { label: 'Aceptado',      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  printing:  { label: 'Imprimiendo',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed: { label: 'Completado',    color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelado',     color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};
