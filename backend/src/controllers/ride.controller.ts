import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Ride, RideStatus } from '../entities/Ride';
import { RideRequest, RideRequestStatus } from '../entities/RideRequest';
import { Driver } from '../entities/Driver';
import { AuthRequest } from '../middleware/auth';
import { calculateDistance, isPointBetween, calculateRouteDistance } from '../utils/distance';
import { calculateEstimatedFare, recalculateFaresForSharedRide } from '../utils/fare';
import { io } from '../index';

const rideRepository = AppDataSource.getRepository(Ride);
const rideRequestRepository = AppDataSource.getRepository(RideRequest);
const driverRepository = AppDataSource.getRepository(Driver);

/**
 * Create a new ride request (passenger booking)
 */
export const createRideRequest = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = req.user?.id;
    const { pickup, dropoff } = req.body;

    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
      return res.status(400).json({ error: 'Valid pickup and dropoff locations required' });
    }

    // Calculate distance
    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    // Find matching ride or create new request
    const matchedRide = await findMatchingRide(pickup, dropoff);

    let rideRequest: RideRequest;

    if (matchedRide) {
      // Join existing ride
      const currentPassengers = await rideRequestRepository.find({
        where: { rideId: matchedRide.id, status: RideRequestStatus.ACCEPTED },
      });

      const estimatedFare = calculateEstimatedFare(
        distance,
        currentPassengers.length,
        matchedRide.totalDistance
      );

      rideRequest = rideRequestRepository.create({
        rideId: matchedRide.id,
        passengerId,
        pickup,
        dropoff,
        distance,
        estimatedFare,
        status: RideRequestStatus.PENDING,
      });

      await rideRequestRepository.save(rideRequest);

      // Notify driver about new passenger request
      io.to(`driver:${matchedRide.driverId}`).emit('ride:new-passenger-request', {
        rideRequestId: rideRequest.id,
        passenger: { pickup, dropoff },
        estimatedFare,
      });

      res.json({
        success: true,
        message: 'Ride request sent to driver',
        rideRequest,
        isSharedRide: true,
      });
    } else {
      // Create standalone request
      const estimatedFare = calculateEstimatedFare(distance, 0, distance);

      rideRequest = rideRequestRepository.create({
        passengerId,
        pickup,
        dropoff,
        distance,
        estimatedFare,
        status: RideRequestStatus.PENDING,
      });

      await rideRequestRepository.save(rideRequest);

      // Notify available drivers
      const availableDrivers = await driverRepository.find({ where: { isAvailable: true } });
      availableDrivers.forEach(driver => {
        io.to(`driver:${driver.id}`).emit('ride:new-request', {
          rideRequestId: rideRequest.id,
          pickup,
          dropoff,
          estimatedFare,
        });
      });

      res.json({
        success: true,
        message: 'Searching for drivers...',
        rideRequest,
        isSharedRide: false,
      });
    }
  } catch (error) {
    console.error('Create ride request error:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
};

/**
 * Find matching active ride with overlapping route
 */
async function findMatchingRide(pickup: any, dropoff: any): Promise<Ride | null> {
  const activeRides = await rideRepository.find({
    where: { status: RideStatus.ACTIVE },
    relations: ['rideRequests'],
  });

  for (const ride of activeRides) {
    // Check if pickup and dropoff are between ride's origin and destination
    const pickupBetween = isPointBetween(ride.origin, ride.destination, pickup, 15); // 15% max detour
    const dropoffBetween = isPointBetween(ride.origin, ride.destination, dropoff, 15);

    if (pickupBetween && dropoffBetween) {
      // Check if vehicle has capacity
      if (ride.currentPassengerCount < 4) { // Assuming max 4 passengers
        return ride;
      }
    }
  }

  return null;
}

/**
 * Driver accepts a ride request (creates new ride)
 */
export const acceptRideRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { rideRequestId } = req.body;

    // Get driver profile
    const driver = await driverRepository.findOne({ where: { userId } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    // Get ride request
    const rideRequest = await rideRequestRepository.findOne({
      where: { id: rideRequestId },
      relations: ['passenger'],
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    if (rideRequest.status !== RideRequestStatus.PENDING) {
      return res.status(400).json({ error: 'Ride request already processed' });
    }

    // Check if it's a new ride or joining existing
    if (!rideRequest.rideId) {
      // Create new ride
      const ride = rideRepository.create({
        driverId: driver.id,
        origin: rideRequest.pickup,
        destination: rideRequest.dropoff,
        currentRoute: [rideRequest.pickup, rideRequest.dropoff],
        status: RideStatus.ACTIVE,
        totalDistance: rideRequest.distance,
        currentPassengerCount: 1,
        startTime: new Date(),
      });

      await rideRepository.save(ride);

      // Update ride request
      rideRequest.rideId = ride.id;
      rideRequest.status = RideRequestStatus.ACCEPTED;
      await rideRequestRepository.save(rideRequest);

      // Notify passenger
      io.to(`user:${rideRequest.passengerId}`).emit('ride:accepted', {
        rideId: ride.id,
        driver: driver.user,
      });

      res.json({
        success: true,
        message: 'Ride started',
        ride,
      });
    } else {
      // Adding passenger to existing ride
      const ride = await rideRepository.findOne({
        where: { id: rideRequest.rideId },
        relations: ['rideRequests'],
      });

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      // Update route to include new pickup/dropoff
      const newRoute = [...ride.currentRoute!, rideRequest.pickup, rideRequest.dropoff];
      ride.currentRoute = newRoute;
      ride.totalDistance = calculateRouteDistance(newRoute);
      ride.currentPassengerCount += 1;

      await rideRepository.save(ride);

      // Update ride request
      rideRequest.status = RideRequestStatus.ACCEPTED;
      await rideRequestRepository.save(rideRequest);

      // Recalculate fares for all passengers
      const allRequests = await rideRequestRepository.find({
        where: { rideId: ride.id, status: RideRequestStatus.ACCEPTED },
      });

      const fareUpdates = recalculateFaresForSharedRide(
        allRequests.map(r => ({ id: r.id, distance: r.distance })),
        ride.totalDistance
      );

      // Update fares and notify passengers
      for (const request of allRequests) {
        const newFare = fareUpdates.get(request.id);
        if (newFare) {
          request.estimatedFare = newFare;
          await rideRequestRepository.save(request);

          io.to(`user:${request.passengerId}`).emit('ride:fare-updated', {
            newFare,
            reason: 'New passenger joined',
          });
        }
      }

      // Notify new passenger
      io.to(`user:${rideRequest.passengerId}`).emit('ride:accepted', {
        rideId: ride.id,
        driver: driver.user,
      });

      res.json({
        success: true,
        message: 'Passenger added to ride',
        ride,
      });
    }
  } catch (error) {
    console.error('Accept ride request error:', error);
    res.status(500).json({ error: 'Failed to accept ride request' });
  }
};

/**
 * Driver rejects a ride request
 */
export const rejectRideRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { rideRequestId } = req.body;

    const rideRequest = await rideRequestRepository.findOne({
      where: { id: rideRequestId },
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    rideRequest.status = RideRequestStatus.REJECTED;
    await rideRequestRepository.save(rideRequest);

    // Notify passenger
    io.to(`user:${rideRequest.passengerId}`).emit('ride:rejected', {
      rideRequestId,
    });

    res.json({
      success: true,
      message: 'Ride request rejected',
    });
  } catch (error) {
    console.error('Reject ride request error:', error);
    res.status(500).json({ error: 'Failed to reject ride request' });
  }
};

/**
 * Mark passenger as picked up
 */
export const markPickedUp = async (req: AuthRequest, res: Response) => {
  try {
    const { rideRequestId } = req.body;

    const rideRequest = await rideRequestRepository.findOne({
      where: { id: rideRequestId },
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    rideRequest.status = RideRequestStatus.PICKED_UP;
    rideRequest.pickupTime = new Date();
    await rideRequestRepository.save(rideRequest);

    io.to(`user:${rideRequest.passengerId}`).emit('ride:picked-up', {
      rideRequestId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark picked up error:', error);
    res.status(500).json({ error: 'Failed to mark picked up' });
  }
};

/**
 * Complete ride for a passenger
 */
export const completeRideForPassenger = async (req: AuthRequest, res: Response) => {
  try {
    const { rideRequestId } = req.body;

    const rideRequest = await rideRequestRepository.findOne({
      where: { id: rideRequestId },
      relations: ['ride'],
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    rideRequest.status = RideRequestStatus.COMPLETED;
    rideRequest.dropoffTime = new Date();
    rideRequest.actualFare = rideRequest.estimatedFare;
    await rideRequestRepository.save(rideRequest);

    // Update ride passenger count
    const ride = rideRequest.ride;
    ride.currentPassengerCount -= 1;
    await rideRepository.save(ride);

    io.to(`user:${rideRequest.passengerId}`).emit('ride:completed', {
      fare: rideRequest.actualFare,
    });

    res.json({
      success: true,
      fare: rideRequest.actualFare,
    });
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
};

/**
 * Mark payment complete
 */
export const markPaymentComplete = async (req: AuthRequest, res: Response) => {
  try {
    const { rideRequestId } = req.body;

    const rideRequest = await rideRequestRepository.findOne({
      where: { id: rideRequestId },
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    rideRequest.isPaid = true;
    await rideRequestRepository.save(rideRequest);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark payment complete error:', error);
    res.status(500).json({ error: 'Failed to mark payment complete' });
  }
};

/**
 * Get active rides for passenger
 */
export const getMyRides = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const rideRequests = await rideRequestRepository.find({
      where: { passengerId: userId },
      relations: ['ride', 'ride.driver', 'ride.driver.user'],
      order: { createdAt: 'DESC' },
    });

    res.json({ rideRequests });
  } catch (error) {
    console.error('Get my rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
};

/**
 * Get active rides for driver
 */
export const getDriverActiveRides = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const driver = await driverRepository.findOne({ where: { userId } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const rides = await rideRepository.find({
      where: { driverId: driver.id, status: RideStatus.ACTIVE },
      relations: ['rideRequests', 'rideRequests.passenger'],
    });

    res.json({ rides });
  } catch (error) {
    console.error('Get driver rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
};
