import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Ride } from './Ride';
import { RoutePoint } from './Ride';

export enum RideRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('ride_requests')
export class RideRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  rideId: string; // Null if not yet matched

  @Column({ type: 'uuid' })
  passengerId: string;

  @Column({ type: 'jsonb' })
  pickup: RoutePoint; // Pickup location

  @Column({ type: 'jsonb' })
  dropoff: RoutePoint; // Dropoff location

  @Column({
    type: 'enum',
    enum: RideRequestStatus,
    default: RideRequestStatus.PENDING,
  })
  status: RideRequestStatus;

  @Column({ type: 'float', default: 0 })
  distance: number; // Distance from pickup to dropoff in km

  @Column({ type: 'float', default: 0 })
  estimatedFare: number; // Initial fare estimate

  @Column({ type: 'float', default: 0 })
  actualFare: number; // Final fare after ride

  @Column({ type: 'float', default: 0 })
  detourDistance: number; // Extra distance added to route (if shared)

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pickupTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  dropoffTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.rideRequests)
  @JoinColumn({ name: 'passengerId' })
  passenger: User;

  @ManyToOne(() => Ride, (ride) => ride.rideRequests, { nullable: true })
  @JoinColumn({ name: 'rideId' })
  ride: Ride;
}
