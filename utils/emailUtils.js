const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendResetPasswordEmail = async ({ to, name, resetToken, role }) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}&role=${role}`;

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log(`\n[DEV] Reset link for ${role}: ${resetUrl}\n`);
    return { messageId: 'dev-mode' };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"StyleHub" <noreply@stylehub.com>',
    to,
    subject: 'Reset Your Password - StyleHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7c3f;">Hi ${name},</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block; padding:12px 24px; background:#6b7c3f;
                  color:#fff; border-radius:6px; text-decoration:none; margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#888; font-size:12px;">If you didn't request this, ignore this email.</p>
        <hr style="border:none; border-top:1px solid #eee;">
        <p style="color:#aaa; font-size:11px;">© ${new Date().getFullYear()} StyleHub</p>
      </div>
    `,
  });
};

module.exports = { sendResetPasswordEmail };
