import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: '"Sunlytix" <no-reply@sunlytix.com>',
    to,
    subject: 'Verify your Sunlytix account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0F19; color: #E6EAF2; padding: 40px; border-radius: 12px; border: 1px solid #2A3448;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F8CFF; margin: 0; font-size: 28px;">Welcome to Sunlytix</h1>
          <p style="color: #9AA4B2; margin-top: 10px;">Predict. Prevent. Power the Sun.</p>
        </div>
        
        <div style="background-color: #121826; padding: 30px; border-radius: 8px; border: 1px solid #2A3448;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining Sunlytix. Please verify your email address to activate your account and start monitoring your solar assets.
          </p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F8CFF; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9AA4B2; margin-top: 25px; line-height: 1.5;">
            If the button above doesn't work, copy and paste the following link into your browser:<br>
            <span style="color: #4F8CFF; word-break: break-all;">${verifyUrl}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748B;">
          © ${new Date().getFullYear()} Sunlytix. All rights reserved.
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"Sunlytix" <no-reply@sunlytix.com>',
    to,
    subject: 'Reset your Sunlytix password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0F19; color: #E6EAF2; padding: 40px; border-radius: 12px; border: 1px solid #2A3448;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F8CFF; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="background-color: #121826; padding: 30px; border-radius: 8px; border: 1px solid #2A3448;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your Sunlytix account. Click the button below to set a new password.
          </p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F8CFF; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9AA4B2; margin-top: 25px;">
            This link will expire in <strong>15 minutes</strong> for your security.
          </p>
          
          <p style="font-size: 14px; color: #9AA4B2; margin-top: 15px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748B;">
          © ${new Date().getFullYear()} Sunlytix. All rights reserved.
        </div>
      </div>
    `,
  });
}
