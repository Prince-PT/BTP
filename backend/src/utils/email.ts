import nodemailer from 'nodemailer';

/**
 * Email service for sending OTPs
 * In production, configure with real SMTP credentials
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create transporter (using ethereal for testing, or configure real SMTP)
const createTransporter = async () => {
  // For development: Use ethereal email (fake SMTP)
  // For production: Use real SMTP like Gmail, SendGrid, etc.
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Real SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use ethereal (test account)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<boolean> => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Campus Rideshare - Your OTP Code',
      text: `Hello ${name},\n\nYour OTP for Campus Rideshare login is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nCampus Rideshare Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Campus Rideshare</h1>
              <p>LNMIIT Smart Mobility Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your One-Time Password (OTP) for login is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 10 minutes</li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              <div class="footer">
                <p>Best regards,<br>Campus Rideshare Team</p>
                <p style="color: #9ca3af; font-size: 12px;">This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Campus Rideshare" <noreply@campusrideshare.com>',
      ...mailOptions,
    });

    // Log preview URL for development (ethereal)
    if (!process.env.SMTP_HOST) {
      console.log('📧 Preview Email URL:', nodemailer.getTestMessageUrl(info));
    }

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Welcome to Campus Rideshare!',
      text: `Hello ${name},\n\nWelcome to Campus Rideshare - LNMIIT's smart mobility platform!\n\nYou can now book rides, share trips, and make your campus commute easier.\n\nBest regards,\nCampus Rideshare Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Campus Rideshare!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for joining Campus Rideshare - LNMIIT's smart mobility platform.</p>
              <p>With Campus Rideshare, you can:</p>
              <ul>
                <li>🚗 Book rides across campus</li>
                <li>💰 Share rides and split costs</li>
                <li>🚀 Real-time tracking</li>
                <li>👥 Safe, verified drivers</li>
              </ul>
              <p>Ready to get started?</p>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Campus Rideshare" <noreply@campusrideshare.com>',
      ...mailOptions,
    });

    console.log('✅ Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
};
