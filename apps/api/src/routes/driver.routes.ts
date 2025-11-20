import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/driver/register
 * Register as a driver
 */
router.post('/register', validate(schemas.registerDriver), async (req, res) => {
  const { email, name, phone, vehicle, vehicleModel, vehicleColor, licensePlate, licenseId } =
    req.body;

  const existingDriver = await prisma.driver.findUnique({
    where: { email },
  });

  if (existingDriver) {
    throw new AppError('Driver already registered', 400);
  }

  const driver = await prisma.driver.create({
    data: {
      email,
      name,
      phone,
      vehicle,
      vehicleModel,
      vehicleColor,
      licensePlate,
      licenseId,
    },
  });

  res.status(201).json({ message: 'Driver registered successfully', driver });
});

/**
 * GET /api/driver/profile
 * Get driver profile
 */
router.get('/profile', authenticate, requireRole('driver'), async (req: AuthRequest, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.user!.id },
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  res.json(driver);
});

/**
 * PATCH /api/driver/profile
 * Update driver profile
 */
router.patch('/profile', authenticate, requireRole('driver'), async (req: AuthRequest, res) => {
  const { name, phone, vehicle, vehicleModel, vehicleColor, licensePlate, licenseId } = req.body;

  const driver = await prisma.driver.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(vehicle && { vehicle }),
      ...(vehicleModel && { vehicleModel }),
      ...(vehicleColor && { vehicleColor }),
      ...(licensePlate && { licensePlate }),
      ...(licenseId && { licenseId }),
    },
  });

  res.json(driver);
});

/**
 * POST /api/driver/location
 * Update driver location
 */
router.post(
  '/location',
  authenticate,
  requireRole('driver'),
  validate(schemas.updateLocation),
  async (req: AuthRequest, res) => {
    const { lat, lng, heading, speed } = req.body;

    const driver = await prisma.driver.update({
      where: { id: req.user!.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        heading,
        speed,
      },
    });

    // Broadcast location update via WebSocket
    const io = req.app.get('io');
    io.to(`driver-${driver.id}`).emit('driver:location:update', {
      driverId: driver.id,
      lat,
      lng,
      heading,
      speed,
      timestamp: new Date(),
    });

    res.json({ message: 'Location updated', location: { lat, lng } });
  }
);

/**
 * PATCH /api/driver/availability
 * Update driver availability
 */
// Preflight handler
router.options('/availability', (req, res) => {
  res.status(204).send();
});

router.patch(
  '/availability',
  authenticate,
  requireRole('driver'),
  async (req: AuthRequest, res) => {
    const { isAvailable } = req.body;

    const driver = await prisma.driver.update({
      where: { id: req.user!.id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    res.json({ isAvailable: driver.isAvailable });
  }
);

/**
 * GET /api/driver/rides
 * Get driver's rides
 */
router.get('/rides', authenticate, requireRole('driver'), async (req: AuthRequest, res) => {
  const { status } = req.query;

  const rides = await prisma.ride.findMany({
    where: {
      driverId: req.user!.id,
      ...(status && { status: status as any }),
    },
    include: {
      members: {
        // Include ALL members (don't filter by status here - let frontend decide)
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true, // Add email for display
              phone: true,
            },
          },
        },
        orderBy: {
          dropOrder: 'asc', // Order by drop sequence
        },
      },
    },
    orderBy: { departTime: 'desc' },
  });

  // Log for debugging
  console.log(`Driver ${req.user!.id} has ${rides.length} rides`);
  rides.forEach(ride => {
    console.log(`  Ride ${ride.id}: ${ride.members.length} members`);
  });

  res.json(rides);
});

export default router;
