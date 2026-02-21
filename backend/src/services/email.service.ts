import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const isProduction = process.env.NODE_ENV === 'production';
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);

if (smtpConfigured) {
  // eslint-disable-next-line no-console
  console.log('SMTP configured. Real email delivery enabled.');
} else if (isProduction) {
  throw new Error('SMTP configuration missing in production environment.');
} else {
  // eslint-disable-next-line no-console
  console.warn('SMTP configuration missing. Using development fallback logger.');
}

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`[email:fallback] to=${to} subject="${subject}"`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html
  });
};
