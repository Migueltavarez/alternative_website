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
  needs_revision:        { label: 'Requiere revisión',    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  correction_requested:  { label: 'Corrección solicitada', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

export const CORRECTION_COST_CREDITS = 50;

export const SERVICE_TYPES = [
  {
    id: 'print_3d',
    label: 'Impresión 3D',
    description: 'FDM con filamento (PLA, PETG, ABS...)',
    acceptedExtensions: ['.stl', '.obj', '.3mf', '.step', '.stp'],
    acceptStr: '.stl,.obj,.3mf,.step,.stp',
  },
  {
    id: 'laser',
    label: 'Grabado y Corte Láser',
    description: 'Corte y grabado sobre madera, acrílico, cuero y más',
    acceptedExtensions: ['.pdf'],
    acceptStr: '.pdf',
  },
  {
    id: 'resin',
    label: 'Impresión en Resina',
    description: 'Alta resolución con tecnología SLA/MSLA',
    acceptedExtensions: ['.stl', '.obj', '.3mf'],
    acceptStr: '.stl,.obj,.3mf',
  },
  {
    id: 'plans',
    label: 'Impresión de Planos',
    description: 'Planos técnicos en papel (A0, A1, A2...)',
    acceptedExtensions: ['.pdf'],
    acceptStr: '.pdf',
  },
] as const;

export const PRINT_SCALES = [
  '1:1', '1:2', '1:5', '1:10', '1:20', '1:25', '1:50',
  '1:75', '1:100', '1:200', '1:250', '1:500', '1:1000',
  'Personalizada',
] as const;

export const RESIN_COLORS = [
  'Transparente', 'Blanco', 'Negro', 'Gris', 'Verde', 'Azul',
  'Rojo', 'Amarillo', 'Carne/Skin', 'Dental (Beige)',
] as const;

export const RESIN_USES = [
  { value: 'decorative', label: 'Decorativo' },
  { value: 'medical', label: 'Uso médico / protésico' },
] as const;

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

export const PRICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unpaid:           { label: 'Sin cotizar',          color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  quoted:           { label: 'Precio enviado',        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  accepted:         { label: 'Precio aceptado',       color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  appealed:         { label: 'Precio apelado',        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  validated:        { label: 'Listo para pagar',      color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  payment_uploaded: { label: 'Comprobante enviado',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmed:        { label: 'Pago confirmado',       color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export const BANK_ACCOUNTS = [
  { id: 'popular',     name: 'Banco Popular Dominicano', type: 'Cuenta de Ahorro', number: '845305069',   holder: 'Miguel Tavarez' },
  { id: 'banreservas', name: 'Banco BanReservas',        type: 'Cuenta de Ahorro', number: '9602115241',  holder: 'Miguel Tavarez' },
  { id: 'bhd',         name: 'Banco BHD León',           type: 'Cuenta de Ahorro', number: '28045670024', holder: 'Miguel Tavarez' },
  { id: 'qik',         name: 'Banco Qik',                type: 'Cuenta de Ahorro', number: '1004202038',  holder: 'Miguel Tavarez' },
] as const;
