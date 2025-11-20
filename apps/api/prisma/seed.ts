import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample drivers
  const driver1 = await prisma.driver.create({
    data: {
      email: 'driver1@rideshare.dev',
      name: 'John Driver',
      phone: '+1234567890',
      vehicle: 'Sedan',
      vehicleModel: 'Toyota Camry',
      vehicleColor: 'Silver',
      licensePlate: 'ABC-1234',
      licenseId: 'DL12345',
      isActive: true,
      isAvailable: true,
      currentLat: 40.7128,
      currentLng: -74.0060,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      email: 'driver2@rideshare.dev',
      name: 'Sarah Driver',
      phone: '+1234567891',
      vehicle: 'SUV',
      vehicleModel: 'Honda CR-V',
      vehicleColor: 'Blue',
      licensePlate: 'XYZ-5678',
      licenseId: 'DL67890',
      isActive: true,
      isAvailable: true,
      currentLat: 40.7589,
      currentLng: -73.9851,
    },
  });

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: 'rider1@rideshare.dev',
      name: 'Alice Rider',
      phone: '+1234567892',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'rider2@rideshare.dev',
      name: 'Bob Rider',
      phone: '+1234567893',
    },
  });

  // Create sample rides
  const ride1 = await prisma.ride.create({
    data: {
      driverId: driver1.id,
      originLat: 40.7128,
      originLng: -74.0060,
      originAddress: 'Lower Manhattan, NY',
      destLat: 40.7589,
      destLng: -73.9851,
      destAddress: 'Times Square, NY',
      departTime: new Date(Date.now() + 3600000), // 1 hour from now
      isShared: true,
      capacity: 4,
      seatsTaken: 2,
      baseFare: 15.0,
      distanceKm: 5.2,
      estimatedDuration: 20,
      status: 'OPEN',
      members: {
        create: [
          {
            userId: user1.id,
            pickupLat: 40.7128,
            pickupLng: -74.0060,
            pickupAddress: 'Lower Manhattan, NY',
            dropLat: 40.7589,
            dropLng: -73.9851,
            dropAddress: 'Times Square, NY',
            price: 12.5,
            status: 'CONFIRMED',
          },
        ],
      },
    },
  });

  const ride2 = await prisma.ride.create({
    data: {
      driverId: driver2.id,
      originLat: 40.7589,
      originLng: -73.9851,
      originAddress: 'Times Square, NY',
      destLat: 40.7614,
      destLng: -73.9776,
      destAddress: 'Central Park, NY',
      departTime: new Date(Date.now() + 7200000), // 2 hours from now
      isShared: true,
      capacity: 3,
      seatsTaken: 1,
      baseFare: 8.0,
      distanceKm: 2.1,
      estimatedDuration: 10,
      status: 'OPEN',
      members: {
        create: [
          {
            userId: user2.id,
            pickupLat: 40.7589,
            pickupLng: -73.9851,
            pickupAddress: 'Times Square, NY',
            dropLat: 40.7614,
            dropLng: -73.9776,
            dropAddress: 'Central Park, NY',
            price: 8.0,
            status: 'CONFIRMED',
          },
        ],
      },
    },
  });

  console.log('✅ Seeding completed!');
  console.log({
    drivers: [driver1, driver2],
    users: [user1, user2],
    rides: [ride1, ride2],
  });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
