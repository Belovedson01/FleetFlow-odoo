export type Role = 'MANAGER' | 'DISPATCHER' | 'SAFETY' | 'ANALYST';
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
export type DriverStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED' | 'ON_TRIP';
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type Vehicle = {
  id: number;
  name: string;
  model: string;
  licensePlate: string;
  maxCapacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  createdAt: string;
};

export type Driver = {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  status: DriverStatus;
  safetyScore: number;
  createdAt: string;
};

export type Trip = {
  id: number;
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  origin: string;
  destination: string;
  revenue: number;
  status: TripStatus;
  startOdometer: number | null;
  endOdometer: number | null;
  createdAt: string;
  vehicle: Vehicle;
  driver: Driver;
};

export type ServiceLog = {
  id: number;
  vehicleId: number;
  description: string;
  cost: number;
  date: string;
  createdAt: string;
  vehicle: Vehicle;
};

export type FuelLog = {
  id: number;
  vehicleId: number;
  liters: number;
  cost: number;
  odometer: number;
  date: string;
  createdAt: string;
  vehicle: Vehicle;
};

export type DashboardResponse = {
  kpis: {
    activeFleetCount: number;
    maintenanceAlerts: number;
    utilizationPct: number;
    pendingTrips: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  fuelEfficiencyTrend: Array<{ month: string; kmPerLiter: number }>;
  topCostliestVehicles: Array<{
    vehicleId: number;
    vehicleName: string;
    licensePlate: string;
    revenue: number;
    maintenanceCost: number;
    fuelCost: number;
    totalOperationalCost: number;
    distance: number;
    liters: number;
    fuelEfficiency: number;
    roi: number;
  }>;
};

export type AnalyticsResponse = {
  kpis: {
    totalOperationalCost: number;
    fleetRoi: number;
    fleetFuelEfficiency: number;
  };
  vehicles: DashboardResponse['topCostliestVehicles'];
};
