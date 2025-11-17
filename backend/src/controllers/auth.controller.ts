import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email';

const userRepository = AppDataSource.getRepository(User);

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Generate and send OTP to email
 */
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Valid name required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiration
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { otp, expiresAt });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    console.log(`📧 OTP sent to ${email}: ${otp} (expires in 10 minutes)`);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { mockOTP: otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

/**
 * Verify OTP and login/register user
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, name, role } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Check OTP
    const storedOTP = otpStore.get(email);
    
    if (!storedOTP) {
      return res.status(401).json({ error: 'OTP not found or expired. Please request a new one.' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res.status(401).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP is valid, remove it
    otpStore.delete(email);

    // Check if user exists
    let user = await userRepository.findOne({ where: { email } });
    let isNewUser = false;

    // If new user, create account
    if (!user) {
      if (!name || !role) {
        return res.status(400).json({ error: 'Name and role required for registration' });
      }

      user = userRepository.create({
        email,
        name,
        role,
        isActive: true,
      });

      await userRepository.save(user);
      isNewUser = true;
      console.log(`✅ New user registered: ${name} (${email})`);
      
      // Send welcome email
      await sendWelcomeEmail(email, name);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        isDriver: user.isDriver,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDriver: user.isDriver,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['driver'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isDriver: user.isDriver,
      driver: user.driver,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
