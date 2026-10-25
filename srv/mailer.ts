import cds from '@sap/cds';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const LOG = cds.log('mail');

let transporter: Promise<Transporter> | undefined;

/**
 * Real SMTP when SMTP_HOST is set (see .env.example), otherwise a throwaway
 * Ethereal test inbox so the project works without any setup.
 */
async function createTransporter(): Promise<Transporter> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST) {
    const port = Number(SMTP_PORT ?? 587);
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }

  const account = await nodemailer.createTestAccount();
  LOG.info('SMTP_HOST not set, sending through an Ethereal test inbox');
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
}

export async function sendWelcomeMail(spacefarer: {
  name: string;
  email: string;
}) {
  transporter ??= createTransporter().catch((err) => {
    transporter = undefined;
    throw err;
  });

  const info = await (
    await transporter
  ).sendMail({
    from:
      process.env.MAIL_FROM ?? 'Galactic Command <no-reply@galactic.example>',
    to: spacefarer.email,
    subject: 'Welcome aboard, spacefarer!',
    text: `Congratulations ${spacefarer.name}! Your adventure among the stars starts now.`,
  });

  // Only set for Ethereal; false for a real SMTP server
  const previewUrl = nodemailer.getTestMessageUrl(info);
  LOG.info(
    `Welcome mail sent to ${spacefarer.email}`,
    previewUrl ? { previewUrl } : '',
  );
}
