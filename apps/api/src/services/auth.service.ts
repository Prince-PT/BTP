import prisma from '../utils/db';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { sendOtpEmail } from './email.service';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');

export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const requestOTP = async (email: string, role: 'user' | 'driver') => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Create or find user/driver
  if (role === 'user') {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  } else {
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      throw new AppError('Driver not registered. Please register first.', 404);
    }
  }

  // Store OTP
  await prisma.oTPLog.create({
    data: {
      email,
      otp,
      purpose: 'login',
      expiresAt,
      ...(role === 'user' 
        ? { user: { connect: { email } } }
        : { driver: { connect: { email } } }
      ),
    },
  });

  // Send email
  await sendOtpEmail(email, otp);

  return {
    message: 'OTP sent to your email',
    expiresAt,
  };
};

export const verifyOTP = async (email: string, otp: string, role: 'user' | 'driver') => {
  const otpLog = await prisma.oTPLog.findFirst({
    where: {
      email,
      otp,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpLog) {
    throw new AppError('Invalid or expired OTP', 401);
  }

  // Mark OTP as used
  await prisma.oTPLog.update({
    where: { id: otpLog.id },
    data: { used: true, usedAt: new Date() },
  });

  // Get user or driver
  let userId: string;
  if (role === 'user') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);
    userId = user.id;
  } else {
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) throw new AppError('Driver not found', 404);
    userId = driver.id;
  }

  // Generate JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }
  
  const jwtOptions: SignOptions = { 
    expiresIn: '7d'
  };
  
  const token = jwt.sign(
    { id: userId, email, role },
    jwtSecret,
    jwtOptions
  );

  return {
    token,
    user: { id: userId, email, role },
  };
};
