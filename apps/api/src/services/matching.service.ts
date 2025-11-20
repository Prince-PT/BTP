import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { calculateDistance } from '../utils/geo';
import {
  calculateSingleRideFare,
  calculateFaresForAllRiders,
  buildRouteSegments,
  type RiderSegment,
} from '../utils/pricing';

/**
 * Create a new ride request (by rider)
 */
export const createRide = async (
  userId: string,
  rideData: {
    originLat: number;
    originLng: number;
    originAddress?: string;
    destLat: number;
    destLng: number;
    destAddress?: string;
    departTime: Date;
    seatsNeeded: number;
    isShared?: boolean;
    capacity?: number;
  }
) => {
  const distance = calculateDistance(
    rideData.originLat,
    rideData.originLng,
    rideData.destLat,
    rideData.destLng
  );

  // Convert departTime to Date if it's a string
  const departureDate = typeof rideData.departTime === 'string' 
    ? new Date(rideData.departTime) 
    : rideData.departTime;

  // CRITICAL: ALL riders pay for FULL CAPACITY upfront (driver gets full taxi revenue)
  // - For SHARED rides: Fare will be recalculated and reduced as others join
  // - For NON-SHARED rides: Rider pays full, no one else can join
  // - seatsNeeded is used to split cost among passengers at drop-off time
  const fullCapacity = rideData.capacity || 4;

  // Use new pricing system - always charge for full capacity
  const fareCalculation = calculateSingleRideFare(
    rideData.originLat,
    rideData.originLng,
    rideData.destLat,
    rideData.destLng,
    fullCapacity, // ALWAYS charge for full capacity
    undefined, // No driver location yet
    undefined,
    departureDate
  );

  const totalFare = fareCalculation.totalFare;

  const ride = await prisma.ride.create({
    data: {
      ...rideData,
      createdBy: userId,
      distanceKm: distance,
      baseFare: totalFare, // Total fare for all seats
      status: 'PENDING',
      estimatedDuration: Math.ceil(distance / 0.5), // Assume 30km/h average speed
      isShared: rideData.isShared || false,
      capacity: rideData.capacity || 4,
      seatsTaken: rideData.seatsNeeded || 1,
    },
  });

  // Create a ride member entry for the requester
  await prisma.rideMember.create({
    data: {
      rideId: ride.id,
      userId,
      pickupLat: rideData.originLat,
      pickupLng: rideData.originLng,
      pickupAddress: rideData.originAddress,
      dropLat: rideData.destLat,
      dropLng: rideData.destLng,
      dropAddress: rideData.destAddress,
      price: totalFare, // Total price for this member's booking
      originalPrice: totalFare,
      status: 'CONFIRMED',
      dropOrder: 1,
    },
  });

  return ride;
};

/**
 * Accept a ride request (by driver)
 */
export const acceptRide = async (rideId: string, driverId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  if (ride.status !== 'PENDING') {
    throw new AppError('This ride request is no longer available', 400);
  }

  if (ride.driverId) {
    throw new AppError('This ride has already been accepted by another driver', 400);
  }

  // Check if driver is available
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver || !driver.isAvailable || !driver.isActive) {
    throw new AppError('Driver is not available', 400);
  }

  // Update ride with driver assignment
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      driverId,
      status: 'ASSIGNED',
      acceptedAt: new Date(),
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  return updatedRide;
};

/**
 * Confirm payment for a ride (mock implementation)
 */
export const confirmPayment = async (rideId: string, userId: string, _paymentToken: string) => {
  // TODO: Integrate with real payment gateway (e.g., Stripe)
  // For now, just mock the payment

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: true,
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  const member = ride.members.find(m => m.userId === userId);
  if (!member) {
    throw new AppError('You are not a member of this ride', 404);
  }

  if (member.status !== 'CONFIRMED') {
    await prisma.rideMember.update({
      where: { id: member.id },
      data: { status: 'CONFIRMED' },
    });
  }

  return { 
    success: true, 
    message: 'Payment confirmed',
    amount: member.price,
  };
};

/**
 * Legacy function for shared rides (kept for future enhancement)
 * Join an existing ride - NOT CURRENTLY USED
 */
export const joinRide = async (
  _rideId: string,
  _userId: string,
  _memberData: {
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    dropLat: number;
    dropLng: number;
    dropAddress?: string;
  }
) => {
  throw new AppError('Shared rides not yet implemented', 501);
};

/**
 * Join an existing shared ride
 */
export const joinSharedRide = async (
  rideId: string,
  userId: string,
  memberData: {
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    dropLat: number;
    dropLng: number;
    dropAddress?: string;
  }
) => {
  // Get the ride with all members
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  if (!ride.isShared) {
    throw new AppError('This ride is not available for sharing', 400);
  }

  if (ride.seatsTaken >= ride.capacity) {
    throw new AppError('This ride is already at full capacity', 400);
  }

  if (!ride.driverId) {
    throw new AppError('This ride has not been assigned a driver yet', 400);
  }

  // Check if user is already a member
  const existingMember = ride.members.find(m => m.userId === userId);
  if (existingMember) {
    throw new AppError('You are already part of this ride', 400);
  }

  // Calculate offset (additional distance from main route)
  const offsetFromOrigin = calculateDistance(
    ride.originLat,
    ride.originLng,
    memberData.pickupLat,
    memberData.pickupLng
  );
  const offsetFromDest = calculateDistance(
    ride.destLat,
    ride.destLng,
    memberData.dropLat,
    memberData.dropLng
  );
  const totalOffset = offsetFromOrigin + offsetFromDest;

  // Initial price calculation using new pricing system
  const fareCalc = calculateSingleRideFare(
    memberData.pickupLat,
    memberData.pickupLng,
    memberData.dropLat,
    memberData.dropLng,
    1, // Single seat for join request
    undefined, // Driver location not needed for estimate
    undefined,
    ride.departTime
  );

  // Add the new member with PENDING status (requires driver approval)
  const newMember = await prisma.rideMember.create({
    data: {
      rideId: ride.id,
      userId,
      pickupLat: memberData.pickupLat,
      pickupLng: memberData.pickupLng,
      pickupAddress: memberData.pickupAddress,
      dropLat: memberData.dropLat,
      dropLng: memberData.dropLng,
      dropAddress: memberData.dropAddress,
      price: fareCalc.totalFare,
      originalPrice: fareCalc.totalFare,
      offsetKm: totalOffset,
      status: 'PENDING' as any, // Driver must approve (TS cache issue with new enum)
      dropOrder: ride.members.length + 1,
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
  });

  // DO NOT update seatsTaken yet - only after driver approves
  
  return { 
    message: 'Join request sent to driver for approval',
    member: newMember,
    ride: {
      id: ride.id,
      status: ride.status,
    },
  };
};

/**
 * Approve or reject a join request for a shared ride
 */
export const approveJoinRequest = async (
  rideId: string,
  memberId: string,
  driverId: string,
  approved: boolean
) => {
  // Get the ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  if (ride.driverId !== driverId) {
    throw new AppError('You are not the driver of this ride', 403);
  }

  // Get the member
  const member = await prisma.rideMember.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.rideId !== rideId) {
    throw new AppError('Member is not part of this ride', 400);
  }

  if (member.status !== ('PENDING' as any)) {
    throw new AppError('This join request has already been processed', 400);
  }

  if (approved) {
    // Check if there's still capacity
    if (ride.seatsTaken >= ride.capacity) {
      throw new AppError('This ride is already at full capacity', 400);
    }

    // Approve the member
    await prisma.rideMember.update({
      where: { id: memberId },
      data: {
        status: 'CONFIRMED',
      },
    });

    // Update seatsTaken
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        seatsTaken: ride.seatsTaken + 1,
      },
    });

    return {
      message: 'Join request approved',
      member: { ...member, status: 'CONFIRMED' },
    };
  } else {
    // Reject the member
    await prisma.rideMember.update({
      where: { id: memberId },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      message: 'Join request rejected',
      member: { ...member, status: 'CANCELLED' },
    };
  }
};

/**
 * Calculate dynamic pricing based on solo and shared distances (in INR)
 */
const calculateDynamicPrice = (
  soloDistance: number,
  sharedDistance: number,
  totalSharedMembers: number,
  offsetKm: number = 0
): number => {
  const BASE_FARE = 30;      // ₹30
  const PER_KM_RATE = 10;    // ₹10/km
  const OFFSET_RATE = 15;    // ₹15/km for offset
  
  // Solo distance: full price
  const soloCost = soloDistance * PER_KM_RATE;
  
  // Shared distance: split among all members
  const sharedCost = (sharedDistance * PER_KM_RATE) / totalSharedMembers;
  
  // Offset penalty (rider pays 50% of offset cost)
  const offsetCost = offsetKm * OFFSET_RATE * 0.5;
  
  const total = BASE_FARE + soloCost + sharedCost + offsetCost;
  
  // Round to nearest rupee, minimum ₹30
  return Math.round(Math.max(total, 30));
};

/**
 * Complete a ride member (mark as dropped off) and recalculate prices
 */
export const completeRideMember = async (
  rideId: string,
  memberId: string,
  driverId: string
) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
        orderBy: {
          dropOrder: 'asc',
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  if (ride.driverId !== driverId) {
    throw new AppError('You are not the driver for this ride', 403);
  }

  const member = ride.members.find(m => m.id === memberId);
  if (!member) {
    throw new AppError('Member not found in this ride', 404);
  }

  if (member.status === 'DROPPED_OFF') {
    throw new AppError('This member has already been dropped off', 400);
  }

  // Mark member as dropped off
  await prisma.rideMember.update({
    where: { id: memberId },
    data: {
      status: 'DROPPED_OFF',
      droppedOffAt: new Date(),
    },
  });

  // Recalculate prices for ALL members using the advanced pricing system
  if (ride.isShared) {
    await recalculatePricesForSharedRide(ride.id);
  }

  // Check if all members are dropped off
  const allDroppedOff = ride.members.every(
    m => m.status === 'DROPPED_OFF' || m.status === 'CANCELLED'
  );

  if (allDroppedOff) {
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  // Return updated ride details
  const updatedRide = await prisma.ride.findUnique({
    where: { id: rideId },
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

  return updatedRide;
};

/**
 * Recalculate prices for all members in a ride
 */
export const recalculatePrices = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        where: {
          status: { not: 'CANCELLED' }
        },
      },
    },
  });

  if (!ride) {
    throw new AppError('Ride not found', 404);
  }

  if (!ride.isShared) {
    return ride; // No need to recalculate for non-shared rides
  }

  const activeMembers = ride.members.filter(m => m.status !== 'DROPPED_OFF');

  for (const member of activeMembers) {
    const memberDistance = calculateDistance(
      member.pickupLat,
      member.pickupLng,
      member.dropLat,
      member.dropLng
    );

    const newPrice = calculateDynamicPrice(
      memberDistance * 0.3,
      memberDistance * 0.7,
      activeMembers.length,
      member.offsetKm || 0
    );

    await prisma.rideMember.update({
      where: { id: member.id },
      data: {
        price: newPrice,
      },
    });
  }

  return prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: true,
    },
  });
};

/**
 * Recalculate fares for all members in a shared ride using advanced pricing
 * This considers actual route segments and drop order
 */
async function recalculatePricesForSharedRide(rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      members: {
        where: {
          status: { notIn: ['CANCELLED'] },
        },
      },
      driver: {
        select: {
          currentLat: true,
          currentLng: true,
        },
      },
    },
  });

  if (!ride || ride.members.length === 0) return;

  // Build rider segments from confirmed/active members only
  const riderSegments: RiderSegment[] = ride.members
    .filter(m => m.status === 'CONFIRMED' || m.status === 'PICKED_UP' || m.status === 'DROPPED_OFF')
    .map(m => ({
      riderId: m.userId,
      riderName: m.userId,
      pickupLat: m.pickupLat,
      pickupLng: m.pickupLng,
      dropLat: m.dropLat,
      dropLng: m.dropLng,
      dropOrder: m.dropOrder || 999,
    }));

  if (riderSegments.length === 0) return;

  // Build route segments
  const routeSegments = buildRouteSegments(
    ride.originLat,
    ride.originLng,
    riderSegments
  );

  // Calculate fares for all riders
  const fares = calculateFaresForAllRiders(
    riderSegments,
    routeSegments,
    ride.driver?.currentLat || undefined,
    ride.driver?.currentLng || undefined,
    ride.departTime
  );

  // Update each member's price
  for (const member of ride.members) {
    const fareData = fares.get(member.userId);
    if (fareData) {
      await prisma.rideMember.update({
        where: { id: member.id },
        data: {
          price: fareData.totalFare,
          soloDistanceKm: fareData.soloDistance,
          sharedDistanceKm: fareData.sharedDistance,
        },
      });
    }
  }
}
