import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Driver } from './Driver';
import { RideRequest } from './RideRequest';
import { Notification } from './Notification';

export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string; // Hashed password

  @Column({ type: 'boolean', default: false })
  isDriver: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Driver, (driver) => driver.user)
  driver: Driver;

  @OneToMany(() => RideRequest, (rideRequest) => rideRequest.passenger)
  rideRequests: RideRequest[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
