import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const from = process.env.SMTP_USER || 'noreply@alternative3d.com';

  await transporter.sendMail({
    from: `"Alternative 3D Studio" <${from}>`,
    to: email,
    subject: 'Restablecer contraseña — Alternative 3D Studio',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Restablecer contraseña</h2>
        <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="color:#888;font-size:13px;">Si no solicitaste esto, ignora este mensaje.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">Alternative 3D Studio · República Dominicana</p>
      </div>
    `,
  });
}
