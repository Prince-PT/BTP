export interface User {
  id: string;
  name: string;
  phone?: string;
  email: string;
  role: 'student' | 'faculty';
  isDriver: boolean;
  driver?: Driver;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel?: string;
  seatingCapacity: number;
  isAvailable: boolean;
  currentLocation?: Location;
  rating: number;
  totalRides: number;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Ride {
  id: string;
  driverId: string;
  origin: Location;
  destination: Location;
  currentRoute?: Location[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  totalDistance: number;
  baseFare: number;
  currentPassengerCount: number;
  driver?: Driver;
  rideRequests?: RideRequest[];
}

export interface RideRequest {
  id: string;
  rideId?: string;
  passengerId: string;
  pickup: Location;
  dropoff: Location;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'completed' | 'cancelled';
  distance: number;
  estimatedFare: number;
  actualFare: number;
  detourDistance: number;
  isPaid: boolean;
  pickupTime?: Date;
  dropoffTime?: Date;
  passenger?: User;
  ride?: Ride;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  seen: boolean;
  createdAt: Date;
}
