import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      throw new AppError(message, 400);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  requestOtp: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('user', 'driver').default('user'),
  }),

  verifyOtp: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    role: Joi.string().valid('user', 'driver').default('user'),
  }),

  createRide: Joi.object({
    originLat: Joi.number().min(-90).max(90).required(),
    originLng: Joi.number().min(-180).max(180).required(),
    originAddress: Joi.string().optional(),
    destLat: Joi.number().min(-90).max(90).required(),
    destLng: Joi.number().min(-180).max(180).required(),
    destAddress: Joi.string().optional(),
    departTime: Joi.date().iso().min('now').required(),
    seatsNeeded: Joi.number().integer().min(1).max(4).default(1),
    isShared: Joi.boolean().default(false),
    capacity: Joi.number().integer().min(1).max(8).default(4),
  }),

  joinRide: Joi.object({
    pickupLat: Joi.number().min(-90).max(90).required(),
    pickupLng: Joi.number().min(-180).max(180).required(),
    pickupAddress: Joi.string().optional(),
    dropLat: Joi.number().min(-90).max(90).required(),
    dropLng: Joi.number().min(-180).max(180).required(),
    dropAddress: Joi.string().optional(),
  }),

  updateLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360).optional(),
    speed: Joi.number().min(0).optional(),
  }),

  registerDriver: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).required(),
    phone: Joi.string().required(),
    vehicle: Joi.string().required(),
    vehicleModel: Joi.string().optional(),
    vehicleColor: Joi.string().optional(),
    licensePlate: Joi.string().optional(),
    licenseId: Joi.string().optional(),
  }),
};
