import { Router } from 'express';
import {
  createRideRequest,
  acceptRideRequest,
  rejectRideRequest,
  markPickedUp,
  completeRideForPassenger,
  markPaymentComplete,
  getMyRides,
  getDriverActiveRides,
} from '../controllers/ride.controller';
import { authMiddleware, requireDriver } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Passenger routes
router.post('/request', createRideRequest);
router.get('/my-rides', getMyRides);

// Driver routes
router.post('/accept', requireDriver, acceptRideRequest);
router.post('/reject', requireDriver, rejectRideRequest);
router.post('/pickup', requireDriver, markPickedUp);
router.post('/complete', requireDriver, completeRideForPassenger);
router.post('/payment', requireDriver, markPaymentComplete);
router.get('/active', requireDriver, getDriverActiveRides);

export default router;
