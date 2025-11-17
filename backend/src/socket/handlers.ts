import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/data-source';
import { Driver } from '../entities/Driver';

const driverRepository = AppDataSource.getRepository(Driver);

/**
 * Setup Socket.IO event handlers
 */
export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // User joins their personal room
    socket.on('user:join', (data: { userId: string; role: string }) => {
      socket.join(`user:${data.userId}`);
      console.log(`👤 User ${data.userId} joined room (${data.role})`);

      // If driver, also join driver room
      if (data.role === 'driver') {
        socket.join(`driver:${data.userId}`);
      }
    });

    // Driver joins driver-specific room for tracking
    socket.on('driver:join', (data: { driverId: string }) => {
      socket.join(`driver:${data.driverId}`);
      socket.join(`tracking:${data.driverId}`); // For location tracking
      console.log(`🚗 Driver ${data.driverId} joined tracking room`);
    });

    // Passenger joins ride room to track driver
    socket.on('ride:join', (data: { rideId: string; userId: string }) => {
      socket.join(`ride:${data.rideId}`);
      console.log(`🚖 User ${data.userId} joined ride ${data.rideId}`);
    });

    // Driver sends location updates
    socket.on('driver:location:update', async (data: { 
      driverId: string; 
      location: { lat: number; lng: number } 
    }) => {
      try {
        // Update driver location in database
        const driver = await driverRepository.findOne({ 
          where: { id: data.driverId } 
        });

        if (driver) {
          driver.currentLocation = data.location;
          await driverRepository.save(driver);

          // Broadcast to all tracking this driver
          io.to(`tracking:${data.driverId}`).emit('driver:location:updated', {
            driverId: data.driverId,
            location: data.location,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    });

    // Real-time chat messages (driver-passenger)
    socket.on('chat:message', (data: { 
      rideId: string; 
      senderId: string; 
      message: string 
    }) => {
      // Broadcast to all in the ride room
      io.to(`ride:${data.rideId}`).emit('chat:message:received', {
        senderId: data.senderId,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Driver accepts ride request notification
    socket.on('ride:accept', (data: { rideId: string; passengerId: string }) => {
      io.to(`user:${data.passengerId}`).emit('ride:accepted', {
        rideId: data.rideId,
        message: 'Your ride has been accepted!',
      });
    });

    // Ride status updates
    socket.on('ride:status:update', (data: { 
      rideId: string; 
      status: string; 
      passengers: string[] 
    }) => {
      // Notify all passengers in the ride
      data.passengers.forEach(passengerId => {
        io.to(`user:${passengerId}`).emit('ride:status:changed', {
          rideId: data.rideId,
          status: data.status,
        });
      });
    });

    // SOS/Emergency alert
    socket.on('emergency:alert', (data: { 
      userId: string; 
      location: { lat: number; lng: number }; 
      rideId?: string 
    }) => {
      console.log(`🚨 EMERGENCY ALERT from user ${data.userId}`);
      // Broadcast to admin/support (implement as needed)
      io.emit('emergency:received', data);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
