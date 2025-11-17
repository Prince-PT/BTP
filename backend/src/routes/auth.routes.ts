import { Router } from 'express';
import { sendOTP, verifyOTP, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/profile', authMiddleware, getProfile);

export default router;
