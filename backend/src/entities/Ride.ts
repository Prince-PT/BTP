import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Driver } from './Driver';
import { RideRequest } from './RideRequest';

export enum RideStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface RoutePoint {
  lat: number;
  lng: number;
  address?: string;
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'jsonb' })
  origin: RoutePoint; // Starting point { lat, lng, address }

  @Column({ type: 'jsonb' })
  destination: RoutePoint; // End point { lat, lng, address }

  @Column({ type: 'jsonb', nullable: true })
  currentRoute: RoutePoint[]; // Array of waypoints including pickups/dropoffs

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.PENDING,
  })
  status: RideStatus;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'float', default: 0 })
  totalDistance: number; // in kilometers

  @Column({ type: 'float', default: 0 })
  baseFare: number; // Driver's base earnings

  @Column({ type: 'int', default: 0 })
  currentPassengerCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Driver, (driver) => driver.rides)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @OneToMany(() => RideRequest, (rideRequest) => rideRequest.ride)
  rideRequests: RideRequest[];
}
