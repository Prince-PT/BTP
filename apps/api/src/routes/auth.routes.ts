import { Router } from 'express';
import { requestOTP, verifyOTP } from '../services/auth.service';
import { validate, schemas } from '../middleware/validation';

const router = Router();

/**
 * POST /api/auth/request-otp
 * Request OTP for login
 */
router.post('/request-otp', validate(schemas.requestOtp), async (req, res) => {
  const { email, role } = req.body;
  const result = await requestOTP(email, role || 'user');
  res.json(result);
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and get JWT token
 */
router.post('/verify-otp', validate(schemas.verifyOtp), async (req, res) => {
  const { email, otp, role } = req.body;
  const result = await verifyOTP(email, otp, role || 'user');
  res.json(result);
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
