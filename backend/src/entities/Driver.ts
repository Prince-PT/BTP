import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Ride } from './Ride';

export interface Location {
  lat: number;
  lng: number;
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  vehicleType: string; // e.g., 'car', 'bike', 'auto'

  @Column({ type: 'varchar', length: 50 })
  vehicleNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleModel: string;

  @Column({ type: 'int', default: 4 })
  seatingCapacity: number;

  @Column({ type: 'boolean', default: false })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  currentLocation: Location; // { lat, lng }

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalRides: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.driver)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Ride, (ride) => ride.driver)
  rides: Ride[];
}
