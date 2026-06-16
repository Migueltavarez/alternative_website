import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL || 'Alternative 3D Studio <onboarding@resend.dev>';

async function send(payload: Parameters<Resend['emails']['send']>[0]) {
  const { data, error } = await getResend().emails.send(payload);
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await send({
    from: FROM,
    to: email,
    subject: 'Restablecer contraseña — Alternative 3D Studio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#8b5cf6;font-size:24px;margin:0;">Alternative 3D Studio</h1>
        </div>
        <h2 style="font-size:20px;margin:0 0 12px;">Restablecer contraseña</h2>
        <p style="color:#94a3b8;line-height:1.6;">Recibiste este correo porque solicitaste restablecer tu contraseña. El enlace expira en <strong style="color:#e2e8f0;">1 hora</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color:#64748b;font-size:13px;">Si no solicitaste esto, ignora este mensaje. Tu contraseña no cambiará.</p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="color:#475569;font-size:12px;text-align:center;margin:0;">Alternative 3D Studio · República Dominicana</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, verifyUrl: string, name?: string | null) {
  const firstName = name?.split(' ')[0] || 'allí';

  await send({
    from: FROM,
    to: email,
    subject: 'Verifica tu correo — Alternative 3D Studio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#8b5cf6;font-size:24px;margin:0;">Alternative 3D Studio</h1>
        </div>
        <h2 style="font-size:20px;margin:0 0 12px;">¡Hola, ${firstName}!</h2>
        <p style="color:#94a3b8;line-height:1.6;">Gracias por registrarte. Para activar tu cuenta haz clic en el botón de abajo. El enlace expira en <strong style="color:#e2e8f0;">24 horas</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Verificar mi correo
          </a>
        </div>
        <p style="color:#64748b;font-size:13px;">Si no creaste esta cuenta, ignora este mensaje.</p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="color:#475569;font-size:12px;text-align:center;margin:0;">Alternative 3D Studio · República Dominicana</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const firstName = name?.split(' ')[0] || 'allí';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';

  await send({
    from: FROM,
    to: email,
    subject: '¡Bienvenido a Alternative 3D Studio!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#8b5cf6;font-size:24px;margin:0;">Alternative 3D Studio</h1>
        </div>
        <h2 style="font-size:20px;margin:0 0 12px;">¡Hola, ${firstName}!</h2>
        <p style="color:#94a3b8;line-height:1.6;">
          Tu cuenta en <strong style="color:#e2e8f0;">Alternative 3D Studio</strong> ha sido creada exitosamente. Ya puedes subir tus modelos 3D y comenzar a imprimir.
        </p>
        <div style="background:#1e1b4b;border:1px solid #312e81;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px;font-weight:600;color:#a5b4fc;">¿Qué puedes hacer?</p>
          <ul style="margin:0;padding:0 0 0 16px;color:#94a3b8;line-height:1.8;">
            <li>Subir archivos STL/OBJ para impresión</li>
            <li>Solicitar cotizaciones personalizadas</li>
            <li>Ver el progreso de tu impresión en tiempo real</li>
            <li>Gestionar tus pedidos y pagos</li>
          </ul>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Ir a mi panel
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="color:#475569;font-size:12px;text-align:center;margin:0;">Alternative 3D Studio · República Dominicana</p>
      </div>
    `,
  });
}
