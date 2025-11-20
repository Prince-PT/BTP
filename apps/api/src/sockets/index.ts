import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import prisma from '../utils/db';

interface SocketUser {
  id: string;
  email: string;
  role: 'user' | 'driver';
}

export const initializeSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;
    logger.info(`🔌 User connected: ${user.email} (${user.role})`);

    // Driver-specific handlers
    if (user.role === 'driver') {
      // Join driver's personal room
      socket.join(`driver-${user.id}`);

      /**
       * Driver location update
       */
      socket.on('driver:location', async (data) => {
        const { lat, lng, heading, speed } = data;

        try {
          // First check if driver exists
          const driverExists = await prisma.driver.findUnique({
            where: { id: user.id },
          });

          if (!driverExists) {
            logger.error(`Driver ${user.id} not found in database`);
            socket.emit('driver:location:ack', { 
              success: false, 
              error: 'Driver not found' 
            });
            return;
          }

          // Update database (silent - only log errors)
          await prisma.driver.update({
            where: { id: user.id },
            data: {
              currentLat: lat,
              currentLng: lng,
              heading: heading || null,
              speed: speed || null,
            },
          });

          // Get active rides for this driver
          const activeRides = await prisma.ride.findMany({
            where: {
              driverId: user.id,
              status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            },
            select: { id: true },
          });

          console.log(`📍 Driver ${user.id} location update - Broadcasting to ${activeRides.length} active rides`);

          // Broadcast to all riders in active rides
          activeRides.forEach((ride) => {
            console.log(`  → Broadcasting to ride-${ride.id}`);
            io.to(`ride-${ride.id}`).emit('driver:location:update', {
              driverId: user.id,
              lat,
              lng,
              heading,
              speed,
              timestamp: new Date(),
            });
          });

          socket.emit('driver:location:ack', { success: true });
        } catch (error: any) {
          logger.error('❌ Error updating driver location:', {
            error: error.message,
            stack: error.stack,
            driverId: user.id,
          });
          socket.emit('driver:location:ack', { 
            success: false, 
            error: error.message || 'Update failed' 
          });
        }
      });

      /**
       * Driver accepts/declines ride request
       */
      socket.on('ride:respond', async (data) => {
        const { rideId, memberId, accept } = data;

        try {
          if (accept) {
            await prisma.rideMember.update({
              where: { id: memberId },
              data: { status: 'CONFIRMED' },
            });
          } else {
            await prisma.rideMember.update({
              where: { id: memberId },
              data: { status: 'CANCELLED' },
            });
          }

          // Notify the rider
          io.to(`ride-${rideId}`).emit('ride:response', {
            rideId,
            memberId,
            accepted: accept,
          });
        } catch (error) {
          logger.error('Error responding to ride request:', error);
        }
      });
    }

    // Rider-specific handlers
    if (user.role === 'user') {
      /**
       * Subscribe to ride updates
       */
      socket.on('ride:subscribe', async (data) => {
        const { rideId } = data;

        console.log(`🔔 Rider ${user.id} subscribing to ride ${rideId}`);

        // Verify user is part of this ride (either as member or creator)
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
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
                currentLat: true,
                currentLng: true,
                heading: true,
                speed: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        });

        // Check if user created the ride or is a member
        const isCreator = ride?.createdBy === user.id;
        const isMember = ride?.members.some(m => m.userId === user.id);

        console.log(`  Ride status: ${ride?.status}, Has driver: ${!!ride?.driver}, Driver location: ${ride?.driver?.currentLat ? 'Yes' : 'No'}`);

        if (isCreator || isMember) {
          socket.join(`ride-${rideId}`);
          logger.info(`✅ User ${user.id} subscribed to ride ${rideId} (room: ride-${rideId})`);

          // Send current ride status with driver location
          console.log(`  → Sending ride:status to rider`);
          socket.emit('ride:status', ride);
          
          // If driver exists and has location, also send initial location update
          if (ride?.driver?.currentLat && ride?.driver?.currentLng) {
            console.log(`  → Sending initial driver:location:update to rider`);
            socket.emit('driver:location:update', {
              driverId: ride.driver.id,
              lat: ride.driver.currentLat,
              lng: ride.driver.currentLng,
              heading: ride.driver.heading,
              speed: ride.driver.speed,
              timestamp: new Date(),
            });
          }
        } else {
          logger.warn(`⚠️ User ${user.id} attempted to subscribe to ride ${rideId} without permission`);
        }
      });

      /**
       * Unsubscribe from ride updates
       */
      socket.on('ride:unsubscribe', (data) => {
        const { rideId } = data;
        socket.leave(`ride-${rideId}`);
        logger.info(`User ${user.id} unsubscribed from ride ${rideId}`);
      });
    }

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      logger.info(`🔌 User disconnected: ${user.email}`);
    });

    /**
     * Ping/pong for connection health
     */
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  });

  logger.info('✅ Socket.IO handlers initialized');
};
