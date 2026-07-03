import { Resend } from 'resend';
import { env } from '../config/env';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

async function send(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    // Email not configured — log in dev so the developer can act on the link manually
    console.warn(`[email] RESEND_API_KEY not set. Would have sent "${options.subject}" to ${options.to}`);
    console.warn(`[email] ${options.text}`);
    return;
  }

  const { error } = await client.emails.send({
    from: env.FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    // Non-fatal — log and continue; do not leak email errors to the caller
    console.error('[email] Failed to send:', error);
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${env.APP_SCHEME}://reset-password?token=${token}`;

  await send({
    to,
    subject: 'Reset your Yakine password',
    text: `You requested a password reset.\n\nOpen this link in the Yakine app to set a new password:\n${link}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#6C63FF;">Reset your Yakine password</h2>
        <p>You requested a password reset. Tap the button below to set a new password.</p>
        <a href="${link}"
           style="display:inline-block;background:#6C63FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Reset password
        </a>
        <p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>.<br>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${env.APP_SCHEME}://verify-email?token=${token}`;

  await send({
    to,
    subject: 'Verify your Yakine account',
    text: `Welcome to Yakine!\n\nPlease verify your email address by opening this link in the Yakine app:\n${link}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#6C63FF;">Welcome to Yakine!</h2>
        <p>Please verify your email address to complete your account setup.</p>
        <a href="${link}"
           style="display:inline-block;background:#6C63FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Verify email
        </a>
        <p style="color:#888;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
      </div>
    `,
  });
}
