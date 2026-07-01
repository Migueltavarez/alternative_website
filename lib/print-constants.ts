export const DR_PROVINCES = [
  'Distrito Nacional',
  'Azua',
  'Baoruco',
  'Barahona',
  'Dajabón',
  'Duarte',
  'Elías Piña',
  'El Seibo',
  'Espaillat',
  'Hato Mayor',
  'Hermanas Mirabal',
  'Independencia',
  'La Altagracia',
  'La Romana',
  'La Vega',
  'María Trinidad Sánchez',
  'Monseñor Nouel',
  'Monte Cristi',
  'Monte Plata',
  'Pedernales',
  'Peravia',
  'Puerto Plata',
  'Samaná',
  'San Cristóbal',
  'San José de Ocoa',
  'San Juan',
  'San Pedro de Macorís',
  'Sánchez Ramírez',
  'Santiago',
  'Santiago Rodríguez',
  'Santo Domingo',
  'Valverde',
] as const;

export const MACHINE_TYPES = [
  { value: 'printer_3d', label: 'Impresora 3D' },
  { value: 'resin', label: 'Impresora de Resina' },
  { value: 'laser', label: 'Máquina Láser' },
] as const;

export const LASER_TYPES = ['CO2', 'Plasma'] as const;

// Maps a job's service type to the machine type(s) eligible to fulfill it.
// null  → any active machine / worker
// []    → DESIGNER role only
export const SERVICE_MACHINE_TYPES: Record<string, string[] | null> = {
  print_3d:       ['printer_3d'],
  resin:          ['resin'],
  laser:          ['laser'],
  plans:          null,
  design:         [],
  armado_maqueta: null,
  planimetria:    null,
  asesoria:       [],
};

export const ROLE_LABELS: Record<string, string> = {
  USER: 'Usuario',
  WORKER: 'Printeo / Corte Láser',
  DESIGNER: 'Diseñador',
  SELLER: 'Vendedor',
  ADMIN: 'Administrador',
};

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

export const FILAMENT_INFO: Record<string, string> = {
  'PLA':            'Usos: figuras decorativas, prototipos, modelos escolares, souvenirs.',
  'PLA+':           'Usos: piezas funcionales, soportes, organizadores, accesorios del hogar.',
  'SILK PLA':       'Usos: figurines, trofeos, piezas de exhibicion, regalos personalizados.',
  'ABS':            'Usos: carcasas electronicas, piezas mecanicas, herramientas, piezas de alta temperatura.',
  'PETG':           'Usos: contenedores, piezas en contacto con agua, piezas mecanicas ligeras.',
  'TPU (Flexible)': 'Usos: fundas de telefono, protectores, juntas, piezas que necesitan flexibilidad.',
  'ASA':            'Usos: piezas de exterior, autopartes, senaletica, todo lo expuesto al sol o lluvia.',
  'Nylon':          'Usos: engranajes, bisagras, piezas de ingenieria, mecanismos con alta carga.',
  'Resina (SLA)':   'Usos: figuras con alto detalle, joyeria, modelos miniatura, piezas dentales.',
  'WOOD PLA':       'Usos: maquetas arquitectonicas, decoracion rustica, artesania, accesorios de madera.',
};

export const NOZZLE_SIZES = [
  '0.2mm',
  '0.4mm (Estándar)',
  '0.6mm',
  '0.8mm',
  '1.0mm',
] as const;

export const DELIVERY_TIMES = [
  { value: 'standard', label: 'Estándar (2-7 días)',   price: 0,   priceLabel: 'Gratis' },
  { value: 'express',  label: 'Express (1-3 días)',    price: 100, priceLabel: 'RD$100' },
  { value: 'urgent',   label: 'Urgente (1-24 horas)', price: 200, priceLabel: 'RD$200' },
] as const;

export const JOB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:              { label: 'En Cola',               color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  assigned:             { label: 'Asignado',              color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  accepted:             { label: 'Aceptado',              color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  printing:             { label: 'Imprimiendo',           color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed:            { label: 'Listo — confirmar entrega', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  ready_to_ship:        { label: 'Listo para envío',      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  shipped:              { label: 'En camino',             color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  delivered:            { label: 'Entregado',             color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:            { label: 'Cancelado',             color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  needs_revision:       { label: 'Requiere revisión',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  correction_requested: { label: 'Corrección solicitada', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
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
  {
    id: 'design',
    label: 'Diseño 3D',
    description: 'Modelado y diseño de piezas desde cero',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.webp'],
    acceptStr: '.jpg,.jpeg,.png,.pdf,.webp',
  },
  {
    id: 'armado_maqueta',
    label: 'Armado de maquetas',
    description: 'Ensamblaje y construcción de maquetas a escala',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.webp'],
    acceptStr: '.jpg,.jpeg,.png,.pdf,.webp',
  },
  {
    id: 'planimetria',
    label: 'Planimetría',
    description: 'Elevaciones, secciones, planos técnicos y detalles',
    acceptedExtensions: ['.pdf', '.dwg', '.dxf'],
    acceptStr: '.pdf,.dwg,.dxf',
  },
  {
    id: 'asesoria',
    label: 'Asesorías',
    description: 'Consultoría técnica especializada en fabricación digital',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.webp'],
    acceptStr: '.jpg,.jpeg,.png,.pdf,.webp',
  },
] as const;

export const DESIGN_MATERIALS = [
  'PLA', 'PLA+', 'PETG', 'ABS', 'TPU (Flexible)', 'Resina',
  'Nylon', 'Madera', 'Acrílico', 'Metal', 'Otro',
] as const;

export const DESIGN_USES = [
  { value: 'decorative', label: 'Decorativo' },
  { value: 'mechanical', label: 'Mecánico / Funcional' },
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
  validated:        { label: 'Listo para pagar',      color: 'bg-primary/20 text-primary border-primary/30' },
  payment_uploaded: { label: 'Comprobante enviado',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmed:        { label: 'Pago confirmado',       color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export const BANK_ACCOUNTS = [
  { id: 'popular',     name: 'Banco Popular Dominicano', type: 'Cuenta de Ahorro', number: '845305069',   holder: 'Miguel Tavarez' },
  { id: 'banreservas', name: 'Banco BanReservas',        type: 'Cuenta de Ahorro', number: '9602115241',  holder: 'Miguel Tavarez' },
  { id: 'bhd',         name: 'Banco BHD León',           type: 'Cuenta de Ahorro', number: '28045670024', holder: 'Miguel Tavarez' },
  { id: 'qik',         name: 'Banco Qik',                type: 'Cuenta de Ahorro', number: '1004202038',  holder: 'Miguel Tavarez' },
] as const;
