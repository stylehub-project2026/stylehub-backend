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
    tls: {
      rejectUnauthorized: false, // Fix self-signed certificate error
    },
  });
};

const sendResetPasswordEmail = async ({ to, name, resetToken, role }) => {
  // Fix: use frontend URL not backend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&role=${role}`;

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

const sendSubscriptionStatusEmail = async ({ to, brandName, status }) => {
  const isApproved = status === 'active';

  const transporter = createTransporter();

  const subject = isApproved
    ? '🎉 Your StyleHub Store is Live!'
    : '❌ Your StyleHub Application Was Not Approved';

  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5e6d41, #92a079); padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 1.8rem;">🎉 Welcome to StyleHub!</h1>
        </div>
        <div style="padding: 2rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #5e6d41;">Hi ${brandName},</h2>
          <p style="color: #555; line-height: 1.7;">
            Great news! Your store has been <strong style="color: #2d7a35;">approved</strong> and is now live on StyleHub.
            Customers can already find your brand page.
          </p>
          <a href="${process.env.FRONTEND_URL || 'https://stylehub-frontend-ten.vercel.app'}/seller/dashboard"
             style="display:inline-block; padding:14px 28px; background:#7b8b5b;
                    color:#fff; border-radius:25px; text-decoration:none; margin:16px 0; font-weight:700;">
            Go to Your Dashboard →
          </a>
          <p style="color:#888; font-size:13px; margin-top: 1rem;">
            Start adding products and grow your brand on StyleHub!
          </p>
          <hr style="border:none; border-top:1px solid #eee; margin: 1.5rem 0;">
          <p style="color:#aaa; font-size:11px;">© ${new Date().getFullYear()} StyleHub</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #c0392b; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 1.8rem;">Application Update</h1>
        </div>
        <div style="padding: 2rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #333;">Hi ${brandName},</h2>
          <p style="color: #555; line-height: 1.7;">
            Unfortunately, we were unable to verify your payment and your store application was <strong style="color: #c0392b;">not approved</strong> at this time.
          </p>
          <p style="color: #555; line-height: 1.7;">
            This may be due to an issue with the payment details or reference. Please contact our support team for assistance.
          </p>
          <a href="mailto:support@stylehub.com"
             style="display:inline-block; padding:14px 28px; background:#c0392b;
                    color:#fff; border-radius:25px; text-decoration:none; margin:16px 0; font-weight:700;">
            Contact Support
          </a>
          <hr style="border:none; border-top:1px solid #eee; margin: 1.5rem 0;">
          <p style="color:#aaa; font-size:11px;">© ${new Date().getFullYear()} StyleHub</p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"StyleHub" <noreply@stylehub.com>',
    to,
    subject,
    html,
  });
};

module.exports = { sendResetPasswordEmail, sendSubscriptionStatusEmail };