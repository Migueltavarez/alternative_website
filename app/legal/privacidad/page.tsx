import { Navbar } from '@/components/navbar';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad — Alternative 3D Studio',
};

const sections = [
  {
    title: '1. Responsable del tratamiento',
    body: `Alternative 3D Studio (en adelante "Alt3D") es la entidad responsable del tratamiento de los datos personales recabados a través de esta plataforma, con domicilio en la República Dominicana.`,
  },
  {
    title: '2. Datos que recopilamos',
    bullets: [
      'Datos de identificación: nombre completo, número de cédula y fecha de nacimiento.',
      'Datos de contacto: correo electrónico, número de teléfono y dirección postal.',
      'Datos de uso: historial de trabajos, preferencias de servicio y actividad en la plataforma.',
      'Datos técnicos: dirección IP, tipo de dispositivo y navegador.',
      'Datos de pago: comprobantes de transferencia y referencias de pago (no almacenamos datos de tarjetas).',
    ],
  },
  {
    title: '3. Finalidad del tratamiento',
    bullets: [
      'Gestionar tu cuenta y prestarte los servicios contratados.',
      'Procesar órdenes de fabricación digital y coordinar su entrega.',
      'Enviar notificaciones transaccionales relacionadas con tus pedidos.',
      'Cumplir con obligaciones legales y fiscales aplicables en la República Dominicana.',
      'Prevenir fraudes y garantizar la seguridad de la plataforma.',
    ],
  },
  {
    title: '4. Base legal',
    body: `El tratamiento de tus datos se basa en la ejecución del contrato de servicio que aceptas al registrarte, en el cumplimiento de obligaciones legales y, en su caso, en tu consentimiento expreso. Nos regimos por la Ley No. 172-13 sobre Protección de Datos Personales de la República Dominicana.`,
  },
  {
    title: '5. Conservación de los datos',
    body: `Conservamos tus datos durante el tiempo que mantengas tu cuenta activa y por el período adicional que exija la legislación dominicana aplicable (mínimo 5 años para datos de facturación). Transcurrido ese plazo, los datos se eliminarán de forma segura.`,
  },
  {
    title: '6. Compartición de datos',
    body: `No vendemos ni alquilamos tus datos personales a terceros. Podemos compartirlos únicamente con proveedores de servicios que actúan bajo nuestras instrucciones (servicios de correo electrónico, almacenamiento en la nube) y con autoridades públicas cuando sea legalmente requerido.`,
  },
  {
    title: '7. Tus derechos',
    bullets: [
      'Acceso: solicitar una copia de los datos que tenemos sobre ti.',
      'Rectificación: corregir datos inexactos o incompletos.',
      'Cancelación: solicitar la eliminación de tus datos cuando ya no sean necesarios.',
      'Oposición: oponerte al tratamiento para determinadas finalidades.',
    ],
    footer: 'Para ejercer cualquiera de estos derechos, escríbenos a contacto@alt3dstudio.com.',
  },
  {
    title: '8. Seguridad',
    body: `Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos contra accesos no autorizados, pérdida, destrucción o divulgación accidental: cifrado en tránsito (HTTPS/TLS), control de acceso basado en roles, rate limiting en endpoints sensibles y auditorías periódicas de seguridad.`,
  },
  {
    title: '9. Cookies',
    body: `Utilizamos únicamente cookies estrictamente necesarias para el funcionamiento de la sesión. No utilizamos cookies de seguimiento ni publicidad de terceros.`,
  },
  {
    title: '10. Modificaciones',
    body: `Podemos actualizar esta política en cualquier momento. Te notificaremos por correo electrónico o mediante un aviso en la plataforma con al menos 15 días de anticipación antes de que los cambios entren en vigor.`,
  },
];

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Legal</p>
        </div>
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground mb-2">Versión vigente: junio 2025 · República Dominicana</p>
        <p className="text-sm text-muted-foreground mb-10">
          En Alternative 3D Studio nos tomamos en serio la protección de tus datos personales. Esta política describe qué datos recopilamos, cómo los usamos y qué derechos tienes sobre ellos.
        </p>

        <div className="space-y-8">
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
              {s.footer && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{s.footer}</p>}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10 text-center">
          ¿Tienes preguntas? Escríbenos a <strong>contacto@alt3dstudio.com</strong>
        </p>
      </div>
    </div>
  );
}
