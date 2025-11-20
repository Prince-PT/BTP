import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter;

// Initialize email transporter
export const initializeMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use provided SMTP credentials
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info('📧 Email service initialized with provided SMTP');
  } else {
    // Use Ethereal for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('📧 Email service initialized with Ethereal (development)');
    logger.info(`   User: ${testAccount.user}`);
  }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  if (!transporter) {
    await initializeMailer();
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"RideShare" <noreply@rideshare.dev>',
    to: email,
    subject: 'Your RideShare Login Code',
    text: `Your login code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">RideShare Login Code</h2>
        <p>Your login code is:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4F46E5; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This code will expire in 5 minutes.</p>
        <p style="color: #6B7280; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  logger.info(`📧 OTP email sent to ${email}`);
  
  // For development with Ethereal, log the preview URL
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

// Initialize on module load
initializeMailer().catch((err) => {
  logger.error('Failed to initialize email service:', err);
});
