import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Driver } from '../entities/Driver';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const driverRepository = AppDataSource.getRepository(Driver);
const userRepository = AppDataSource.getRepository(User);

/**
 * Register as a driver
 */
export const registerDriver = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { vehicleType, vehicleNumber, vehicleModel, seatingCapacity } = req.body;

    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle type and number required' });
    }

    // Check if user already has driver profile
    const existingDriver = await driverRepository.findOne({ where: { userId } });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver profile already exists' });
    }

    // Create driver profile
    const driver = driverRepository.create({
      userId,
      vehicleType,
      vehicleNumber,
      vehicleModel: vehicleModel || '',
      seatingCapacity: seatingCapacity || 4,
      isAvailable: false,
    });

    await driverRepository.save(driver);

    // Update user isDriver flag
    await userRepository.update(userId!, { isDriver: true });

    // Get updated user
    const updatedUser = await userRepository.findOne({ where: { id: userId } });

    // Generate new JWT token with updated isDriver status
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const newToken = jwt.sign(
      {
        id: updatedUser!.id,
        email: updatedUser!.email,
        role: updatedUser!.role,
        isDriver: true,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Driver profile created successfully',
      driver,
      token: newToken,
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        role: updatedUser!.role,
        isDriver: true,
      },
    });
  } catch (error) {
    console.error('Register driver error:', error);
    res.status(500).json({ error: 'Failed to register driver' });
  }
};

/**
 * Update driver availability
 */
export const updateAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { isAvailable } = req.body;

    const driver = await driverRepository.findOne({ where: { userId } });

    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    driver.isAvailable = isAvailable;
    await driverRepository.save(driver);

    res.json({
      success: true,
      isAvailable: driver.isAvailable,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

/**
 * Update driver location
 */
export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const driver = await driverRepository.findOne({ where: { userId } });

    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    driver.currentLocation = { lat, lng };
    await driverRepository.save(driver);

    // Emit location update via Socket.IO (handled in socket handlers)

    res.json({
      success: true,
      location: driver.currentLocation,
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * Get available drivers near a location
 */
export const getAvailableDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await driverRepository.find({
      where: { isAvailable: true },
      relations: ['user'],
    });

    // Filter out drivers without location
    const driversWithLocation = drivers.filter(d => d.currentLocation);

    res.json({ drivers: driversWithLocation });
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ error: 'Failed to get available drivers' });
  }
};
