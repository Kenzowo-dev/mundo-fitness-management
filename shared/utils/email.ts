/**
 * Abstracción para envío de emails.
 * Permite swappear proveedor (nodemailer, sendgrid, mailgun, etc.) sin cambiar código de dominio.
 * En desarrollo: loggea el token para testing manual.
 * En producción: inyecta proveedor real.
 */

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<void>;
}

export interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  expiresInHours: number;
  firstName?: string;
  resetUrl: string;
}

export class NoopEmailProvider implements EmailProvider {
  async sendEmail(_to: string, _subject: string, _html: string, _text?: string): Promise<void> {
    // No-op: silencioso, para tests o cuando no se configura email
  }
}

export class DevLogEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    console.log('┌─────────────────────────────────────────────────────────────────');
    console.log('│ 📧 DEV EMAIL (no enviado realmente)');
    console.log('├─────────────────────────────────────────────────────────────────');
    console.log(`│ To: ${to}`);
    console.log(`│ Subject: ${subject}`);
    console.log(`│ Text: ${text || html.substring(0, 200)}...`);
    console.log('└─────────────────────────────────────────────────────────────────');
  }
}

export function buildPasswordResetEmail(data: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const { resetToken, expiresInHours, firstName, resetUrl } = data;
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  return {
    subject: 'Restablece tu contraseña - Mundo Fitness',
    text: `${greeting}\n\nHas solicitado restablecer tu contraseña. Tu token de recuperación es: ${resetToken}\n\nEste token expira en ${expiresInHours} hora(s).\n\nSi no solicitaste esto, ignora este mensaje.\n\n---\nEquipo Mundo Fitness`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9fafb; border-radius: 8px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .token-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center; }
    .token { font-family: 'SF Mono', Monaco, monospace; font-size: 18px; font-weight: bold; color: #1f2937; letter-spacing: 2px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">Mundo Fitness</div></div>
    <p>${greeting}</p>
    <p>Has solicitado restablecer tu contraseña. Usa el siguiente token:</p>
    <div class="token-box"><div class="token">${resetToken}</div></div>
    <p>O haz clic en el enlace (si está configurado): <a href="${resetUrl}?token=${resetToken}">${resetUrl}</a></p>
    <p><strong>Este token expira en ${expiresInHours} hora(s).</strong></p>
    <p>Si no solicitaste esto, ignora este mensaje.</p>
    <div class="footer">Equipo Mundo Fitness</div>
  </div>
</body>
</html>
    `.trim(),
  };
}

let emailProvider: EmailProvider = new NoopEmailProvider();

export function setEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

export function getEmailProvider(): EmailProvider {
  return emailProvider;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  const { subject, html, text } = buildPasswordResetEmail(data);
  await emailProvider.sendEmail(data.email, subject, html, text);
}