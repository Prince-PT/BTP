import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter;

// Initialize email transporter
export const initializeMailer = async () => {
  // Debug: Log environment variables (without showing full credentials)
  logger.info('🔍 Email Config Check:');
  logger.info(`   SMTP_HOST: ${process.env.SMTP_HOST ? '✓' : '✗'}`);
  logger.info(`   SMTP_USER: ${process.env.SMTP_USER ? '✓' : '✗'}`);
  logger.info(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✓ (hidden)' : '✗'}`);
  logger.info(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use provided SMTP credentials
    const port = parseInt(process.env.SMTP_PORT || '587');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add timeouts to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    logger.info(`✅ Email service initialized with ${process.env.SMTP_HOST}`);
    logger.info(`   Sending from: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);
    
    // Verify connection asynchronously (don't block startup)
    transporter.verify()
      .then(() => {
        logger.info('✅ SMTP connection verified successfully!');
      })
      .catch((error) => {
        logger.error('❌ SMTP connection verification failed:', error);
        logger.warn('⚠️  Email sending may fail. Please check SMTP credentials.');
      });
  } else {
    // Use Ethereal for development
    logger.info('⚠️  Missing SMTP credentials, falling back to Ethereal (dev mode)');
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

  try {
    // Add 15 second timeout for email sending
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000)
    );
    
    const info: any = await Promise.race([sendPromise, timeoutPromise]);
    logger.info(`✅ OTP email sent successfully to ${email}`);
    
    // For development with Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Ethereal Preview URL: ${previewUrl}`);
    } else {
      logger.info(`📧 Real email sent via ${process.env.SMTP_HOST}`);
    }
  } catch (error: any) {
    logger.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    // Don't throw error - let user proceed without email
    logger.warn(`⚠️  User can still use OTP from logs/database`);
  }
};

// Initialize on module load
initializeMailer().catch((err) => {
  logger.error('Failed to initialize email service:', err);
});
