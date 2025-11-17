import { Router } from 'express';
import {
  registerDriver,
  updateAvailability,
  updateLocation,
  getAvailableDrivers,
} from '../controllers/driver.controller';
import { authMiddleware, requireDriver } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/register', registerDriver);
router.put('/availability', requireDriver, updateAvailability);
router.put('/location', requireDriver, updateLocation);
router.get('/available', getAvailableDrivers);

export default router;
