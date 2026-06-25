import { Navbar } from '@/components/navbar';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones — Alternative 3D Studio',
};

const sections = [
  {
    title: '1. Aceptación',
    body: `Al crear una cuenta o utilizar los servicios de Alternative 3D Studio ("Alt3D", "la Plataforma"), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debes utilizar la plataforma.`,
  },
  {
    title: '2. Descripción del servicio',
    body: `Alt3D es una plataforma digital que conecta a clientes con fabricantes (Makers) especializados en impresión 3D, corte láser, maquetería, diseño 3D y servicios relacionados. Alt3D actúa como intermediario y no es responsable directa de la ejecución física de los trabajos.`,
  },
  {
    title: '3. Registro y cuenta',
    bullets: [
      'Debes ser mayor de edad para registrarte.',
      'La información proporcionada al registrarte debe ser veraz y actualizada.',
      'Eres responsable de mantener la confidencialidad de tus credenciales de acceso.',
      'Notifica a Alt3D de inmediato si sospechas de un uso no autorizado de tu cuenta.',
    ],
  },
  {
    title: '4. Cédula y verificación de identidad',
    body: `Para completar tu perfil debes proporcionar tu número de cédula dominicana, el cual es verificado algorítmicamente. Alt3D se reserva el derecho de solicitar documentación adicional para confirmar tu identidad en caso de disputas.`,
  },
  {
    title: '5. Precios y pagos',
    bullets: [
      'Los precios de cada servicio son cotizados por el Maker asignado y deben ser aceptados por el cliente antes de iniciar el trabajo.',
      'Los pagos se realizan mediante transferencia bancaria o método acordado con Alt3D.',
      'Una vez confirmado el pago, el trabajo inicia su proceso de fabricación.',
      'Los precios se expresan en pesos dominicanos (RD$) salvo indicación contraria.',
    ],
  },
  {
    title: '6. Política de cancelaciones y reembolsos',
    bullets: [
      'Los trabajos pueden cancelarse sin cargo si el Maker aún no ha iniciado la fabricación.',
      'Si el trabajo ya inició, la cancelación puede incurrir en un cargo parcial según el avance.',
      'Defectos de fabricación atribuibles al Maker serán rehecho sin costo adicional.',
      'Alt3D no emite reembolsos por archivos de diseño incorrectos enviados por el cliente.',
    ],
  },
  {
    title: '7. Propiedad intelectual',
    body: `Los archivos de diseño y modelos 3D que subas a la plataforma son de tu propiedad o debes tener los derechos necesarios para compartirlos. Alt3D y los Makers obtienen únicamente una licencia limitada para ejecutar el trabajo solicitado. No copiarán, distribuirán ni usarán los archivos para otros fines.`,
  },
  {
    title: '8. Conducta prohibida',
    bullets: [
      'Subir archivos que violen derechos de autor, marcas registradas o patentes.',
      'Solicitar la fabricación de objetos que infrinjan leyes dominicanas o internacionales.',
      'Intentar eludir sistemas de seguridad, autenticación o rate limiting de la plataforma.',
      'Contactar a Makers o clientes fuera de la plataforma para evadir comisiones.',
    ],
  },
  {
    title: '9. Limitación de responsabilidad',
    body: `Alt3D no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de la plataforma. La responsabilidad máxima de Alt3D frente a cualquier reclamación estará limitada al valor del trabajo específico en disputa.`,
  },
  {
    title: '10. Modificaciones',
    body: `Alt3D puede modificar estos términos en cualquier momento, notificando a los usuarios con al menos 15 días de antelación por correo electrónico. El uso continuado de la plataforma tras la notificación implica la aceptación de los nuevos términos.`,
  },
  {
    title: '11. Legislación aplicable',
    body: `Estos términos se rigen por las leyes de la República Dominicana. Cualquier controversia se resolverá ante los tribunales competentes del Distrito Nacional, previa gestión amistosa de la disputa.`,
  },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Legal</p>
        </div>
        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-muted-foreground mb-2">Versión vigente: junio 2025 · República Dominicana</p>
        <p className="text-sm text-muted-foreground mb-10">
          Lee estos términos antes de usar la plataforma. Al registrarte, confirmas que los aceptas en su totalidad.
        </p>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="glass rounded-xl p-6">
              <h2 className="text-base font-bold mb-3">{s.title}</h2>
              {s.body && <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
              {s.bullets && (
                <ul className="space-y-1.5">
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
