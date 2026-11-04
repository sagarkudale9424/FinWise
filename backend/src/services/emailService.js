const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

async function sendLoginThankYouEmail(user) {
  if (user.loginEmails === false) return;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const missing = Object.entries({ SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    console.info(`Login email skipped: configure ${missing.join(', ')} in backend/.env.`);
    return;
  }

  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid SMTP_PORT configuration.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const firstName = String(user.name || 'there').trim().split(/\s+/)[0] || 'there';
  const safeName = escapeHtml(firstName);

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: user.email,
    subject: 'Thanks for logging in to FinWise',
    text: `Hi ${firstName},\n\nThanks for logging in to FinWise. We hope you have a great day managing your finances.\n\nIf this wasn't you, please secure your account by changing your password.`,
    html: `<p>Hi ${safeName},</p><p>Thanks for logging in to FinWise. We hope you have a great day managing your finances.</p><p>If this wasn't you, please secure your account by changing your password.</p>`,
  });
}

module.exports = { sendLoginThankYouEmail };
