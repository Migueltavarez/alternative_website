import { Navbar } from '@/components/navbar';
import { Lock } from 'lucide-react';

export const metadata = {
  title: 'Política de Confidencialidad — Alternative 3D Studio',
};

const sections = [
  {
    title: '1. Objeto',
    body: `Esta política establece las obligaciones de confidencialidad que aplican a todos los colaboradores, Makers y empleados de Alternative 3D Studio ("Alt3D") con respecto a la información reservada de la empresa y de sus clientes.`,
  },
  {
    title: '2. Información confidencial',
    body: `Se considera información confidencial toda aquella que Alt3D designe expresamente como tal o que, por su naturaleza, deba entenderse reservada, incluyendo sin limitación:`,
    bullets: [
      'Datos personales de clientes: nombre, cédula, dirección, teléfono y correo.',
      'Archivos de diseño, modelos 3D, planos y cualquier propiedad intelectual del cliente.',
      'Tarifas internas, márgenes, comisiones y condiciones comerciales de Alt3D.',
      'Procesos, metodologías y tecnologías propietarias de la plataforma.',
      'Información sobre trabajos en curso, estados de órdenes y datos operativos.',
    ],
  },
  {
    title: '3. Obligaciones del colaborador',
    bullets: [
      'No divulgar información confidencial a terceros sin autorización previa y escrita de Alt3D.',
      'Acceder a la información únicamente en la medida necesaria para ejecutar las tareas asignadas.',
      'Notificar de inmediato a Alt3D ante cualquier indicio de filtración o acceso no autorizado.',
      'No reproducir, copiar ni almacenar archivos de clientes más allá del tiempo necesario para completar el trabajo.',
      'Eliminar o devolver toda información confidencial al concluir la relación contractual.',
    ],
  },
  {
    title: '4. Vigencia',
    body: `Las obligaciones de confidencialidad entran en vigor desde el registro del colaborador en la plataforma y se mantienen durante toda la vigencia de la relación, así como por un período de dos (2) años adicionales tras su terminación, independientemente de la causa.`,
  },
  {
    title: '5. Excepciones',
    body: `La obligación de confidencialidad no aplica a información que: (a) sea del dominio público sin mediar incumplimiento del colaborador; (b) el colaborador haya recibido legítimamente de terceros sin restricción; o (c) deba divulgarse por mandato legal o resolución judicial, en cuyo caso el colaborador notificará a Alt3D con la mayor antelación posible.`,
  },
  {
    title: '6. Consecuencias del incumplimiento',
    body: `El incumplimiento de estas obligaciones podrá dar lugar a la terminación inmediata de la relación contractual, sin perjuicio de las acciones civiles y/o penales que Alt3D pueda ejercer de conformidad con la legislación dominicana, incluyendo la Ley No. 172-13 y el Código Penal de la República Dominicana.`,
  },
  {
    title: '7. Seguridad de la información',
    body: `Alt3D implementa medidas de seguridad técnicas y organizativas para proteger la información confidencial: acceso con autenticación de múltiples factores, cifrado en tránsito y en reposo, control de acceso por roles, rate limiting y auditorías periódicas. Se espera que los colaboradores adopten medidas equivalentes en sus propios entornos de trabajo.`,
  },
  {
    title: '8. Legislación aplicable',
    body: `Esta política se rige por las leyes de la República Dominicana, en particular la Ley No. 172-13 sobre Protección de Datos Personales y la Ley No. 53-07 sobre Crímenes y Delitos de Alta Tecnología.`,
  },
];

export default function ConfidencialidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Legal</p>
        </div>
        <h1 className="text-3xl font-bold mb-2">Política de Confidencialidad</h1>
        <p className="text-muted-foreground mb-2">Versión vigente: junio 2025 · República Dominicana</p>
        <p className="text-sm text-muted-foreground mb-10">
          Esta política aplica a todos los Makers, colaboradores y empleados de Alternative 3D Studio. La aceptas al firmar el Contrato de Colaboración.
        </p>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="glass rounded-xl p-6">
              <h2 className="text-base font-bold mb-3">{s.title}</h2>
              {s.body && <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
              {s.bullets && (
                <ul className={`space-y-1.5 ${s.body ? 'mt-3' : ''}`}>
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5 shrink-0">›</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10 text-center">
          ¿Preguntas? Escríbenos a <strong>contacto@alt3dstudio.com</strong>
        </p>
      </div>
    </div>
  );
}
