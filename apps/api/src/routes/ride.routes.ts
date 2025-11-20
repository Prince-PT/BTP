import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import {
  createRide,
  confirmPayment,
  acceptRide,
  joinSharedRide,
  approveJoinRequest,
  completeRideMember,
} from '../services/matching.service';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { calculateDistance } from '../utils/geo';

const router = Router();

/**
 * GET /api/rides/available
 * Get available ride requests for drivers to accept
 */
router.get('/available', authenticate, requireRole('driver'), async (req: AuthRequest, res) => {
  const { lat, lng, radius = 10 } = req.query;

  // Get pending ride requests within radius
  const rides = await prisma.ride.findMany({
    where: {
      status: 'PENDING',
      driverId: null,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { departTime: 'asc' },
  });

  // If driver location is provided, calculate distances
  if (lat && lng) {
    const driverLat = parseFloat(lat as string);
    const driverLng = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    const { calculateDistance } = await import('../utils/geo');
    
    const ridesWithDistance = rides
      .map(ride => ({
        ...ride,
        distanceToPickup: calculateDistance(driverLat, driverLng, ride.originLat, ride.originLng),
      }))
      .filter(ride => ride.distanceToPickup <= radiusKm)
      .sort((a, b) => a.distanceToPickup - b.distanceToPickup);

    return res.json({ rides: ridesWithDistance, count: ridesWithDistance.length });
  }

  return res.json({ rides, count: rides.length });
});

/**
 * GET /api/rides/shared/all
 * Get all available shared rides (no location filtering)
 */
router.get('/shared/all', authenticate, requireRole('user'), async (req: AuthRequest, res) => {
  const rides = await prisma.ride.findMany({
    where: {
      status: {
        in: ['ASSIGNED', 'PENDING'],
      },
      isShared: true,
      driverId: { not: null },
      departTime: {
        gte: new Date(), // Only future rides
      },
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          vehicle: true,
          vehicleModel: true,
          vehicleColor: true,
          licensePlate: true,
        },
      },
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { departTime: 'asc' },
  });

  // Filter rides that have available capacity
  const availableRides = rides
    .filter(ride => ride.seatsTaken < ride.capacity)
    .map(ride => ({
      ...ride,
      availableSeats: ride.capacity - ride.seatsTaken,
    }));

  res.json({ rides: availableRides, count: availableRides.length });
});

/**
 * GET /api/rides/shared/available
 * Get available shared rides that have capacity
 */
router.get('/shared/available', authenticate, requireRole('user'), async (req: AuthRequest, res) => {
  const { originLat, originLng, destLat, destLng, radius = 5 } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    throw new AppError('Origin and destination coordinates required', 400);
  }

  const userOriginLat = parseFloat(originLat as string);
  const userOriginLng = parseFloat(originLng as string);
  const userDestLat = parseFloat(destLat as string);
  const userDestLng = parseFloat(destLng as string);
  const searchRadius = parseFloat(radius as string);

  // Find rides that:
  // 1. Are ASSIGNED or IN_PROGRESS
  // 2. Have available capacity
  // 3. Are within reasonable distance from user's route
  const rides = await prisma.ride.findMany({
    where: {
      status: {
        in: ['ASSIGNED', 'PENDING'],
      },
      isShared: true,
      driverId: { not: null },
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          vehicle: true,
          vehicleModel: true,
          vehicleColor: true,
          licensePlate: true,
        },
      },
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Filter rides based on proximity and capacity
  const availableRides = rides
    .filter(ride => {
      const hasCapacity = ride.seatsTaken < ride.capacity;
      
      // Calculate if user's route is compatible
      const originDistance = calculateDistance(
        userOriginLat,
        userOriginLng,
        ride.originLat,
        ride.originLng
      );
      const destDistance = calculateDistance(
        userDestLat,
        userDestLng,
        ride.destLat,
        ride.destLng
      );
      
      const isCompatible = originDistance <= searchRadius && destDistance <= searchRadius;
      
      return hasCapacity && isCompatible;
    })
    .map(ride => ({
      ...ride,
      availableSeats: ride.capacity - ride.seatsTaken,
    }));

  res.json({ rides: availableRides, count: availableRides.length });
});

/**
 * POST /api/rides/:id/accept
 * Accept a ride request (driver only)
 */
router.post(
  '/:id/accept',
  authenticate,
  requireRole('driver'),
  async (req: AuthRequest, res) => {
    const result = await acceptRide(req.params.id, req.user!.id);
    res.json(result);
  }
);

/**
 * POST /api/rides/:rideId/members/:memberId/approve
 * Approve or reject a join request (driver only)
 */
router.post(
  '/:rideId/members/:memberId/approve',
  authenticate,
  requireRole('driver'),
  async (req: AuthRequest, res) => {
    const { approved } = req.body;
    
    if (typeof approved !== 'boolean') {
      throw new AppError('approved field is required and must be a boolean', 400);
    }
    
    const { approveJoinRequest } = await import('../services/matching.service');
    const result = await approveJoinRequest(
      req.params.rideId,
      req.params.memberId,
      req.user!.id,
      approved
    );
    
    // Get the updated ride with all members
    const updatedRide = await prisma.ride.findUnique({
      where: { id: req.params.rideId },
      include: {
        driver: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    // Emit WebSocket event to all subscribers
    const io = req.app.get('io');
    if (io && updatedRide) {
      io.to(`ride-${req.params.rideId}`).emit('ride:status', updatedRide);
      console.log(`📡 Broadcasted join request ${approved ? 'approval' : 'rejection'} for ride ${req.params.rideId}`);
    }
    
    res.json(result);
  }
);

/**
 * POST /api/rides/:id/join
 * Join an existing shared ride
 */
router.post(
  '/:id/join',
  authenticate,
  requireRole('user'),
  async (req: AuthRequest, res) => {
    const { pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress } = req.body;
    
    const result = await joinSharedRide(req.params.id, req.user!.id, {
      pickupLat,
      pickupLng,
      pickupAddress,
      dropLat,
      dropLng,
      dropAddress,
    });
    
    res.json(result);
  }
);

/**
 * POST /api/rides
 * Create a new ride request (rider only)
 */
router.post(
  '/',
  authenticate,
  requireRole('user'),
  validate(schemas.createRide),
  async (req: AuthRequest, res) => {
    const ride = await createRide(req.user!.id, req.body);
    res.status(201).json(ride);
  }
);

/**
 * GET /api/rides/:id
 * Get ride details
 */
router.get('/:id', authenticate, async (req, res) => {
  const ride = await prisma.ride.findUnique({
    where: { id: req.params.id },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          vehicle: true,
          vehicleModel: true,
          vehicleColor: true,
          licensePlate: true,
          currentLat: true,
          currentLng: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  res.json(ride);
});

/**
 * POST /api/rides/:id/confirm-payment
 * Confirm payment for a ride
 */
router.post(
  '/:id/confirm-payment',
  authenticate,
  requireRole('user'),
  async (req: AuthRequest, res) => {
    const { paymentToken } = req.body;
    const result = await confirmPayment(req.params.id, req.user!.id, paymentToken);
    res.json(result);
  }
);

/**
 * POST /api/rides/:rideId/members/:memberId/complete
 * Mark a ride member as dropped off and recalculate prices
 */
router.post(
  '/:rideId/members/:memberId/complete',
  authenticate,
  requireRole('driver'),
  async (req: AuthRequest, res) => {
    const result = await completeRideMember(
      req.params.rideId,
      req.params.memberId,
      req.user!.id
    );
    res.json(result);
  }
);

/**
 * GET /api/rides/user/:userId
 * Get rides for a specific user
 */
router.get('/user/:userId', authenticate, async (req: AuthRequest, res) => {
  // Only allow users to get their own rides (or admin in future)
  if (req.user!.id !== req.params.userId && req.user!.role !== 'driver') {
    throw new AppError('Unauthorized', 403);
  }

  const rides = await prisma.rideMember.findMany({
    where: { userId: req.params.userId },
    include: {
      ride: {
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              vehicle: true,
              vehicleModel: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(rides);
});

/**
 * PATCH /api/rides/:id/status
 * Update ride status (driver only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('driver'),
  async (req: AuthRequest, res) => {
    const { status } = req.body;
    
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
    });

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    if (ride.driverId !== req.user!.id) {
      throw new AppError('You can only update your own rides', 403);
    }

    const updatedRide = await prisma.ride.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'IN_PROGRESS' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
      },
    });

    res.json(updatedRide);
  }
);

export default router;
