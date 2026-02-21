import bcrypt from 'bcryptjs';
import { PrismaClient, DriverStatus, Role, TripStatus, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.fuelLog.deleteMany();
  await prisma.serviceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Password@123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Maya Manager', email: 'manager@fleetflow.com', password, role: Role.MANAGER },
      {
        name: 'Derek Dispatcher',
        email: 'dispatcher@fleetflow.com',
        password,
        role: Role.DISPATCHER
      },
      { name: 'Sara Safety', email: 'safety@fleetflow.com', password, role: Role.SAFETY },
      { name: 'Aria Analyst', email: 'analyst@fleetflow.com', password, role: Role.ANALYST }
    ]
  });

  const [vehicle1, vehicle2, vehicle3] = await Promise.all([
    prisma.vehicle.create({
      data: {
        name: 'Truck Alpha',
        model: 'Volvo FH16',
        licensePlate: 'FF-TRK-101',
        maxCapacityKg: 18000,
        odometer: 120000,
        acquisitionCost: 120000,
        status: VehicleStatus.AVAILABLE
      }
    }),
    prisma.vehicle.create({
      data: {
        name: 'Truck Beta',
        model: 'Scania R500',
        licensePlate: 'FF-TRK-202',
        maxCapacityKg: 15000,
        odometer: 98000,
        acquisitionCost: 95000,
        status: VehicleStatus.AVAILABLE
      }
    }),
    prisma.vehicle.create({
      data: {
        name: 'Van Gamma',
        model: 'Mercedes Sprinter',
        licensePlate: 'FF-VAN-303',
        maxCapacityKg: 3500,
        odometer: 65000,
        acquisitionCost: 55000,
        status: VehicleStatus.IN_SHOP
      }
    })
  ]);

  const [driver1, driver2, driver3] = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'John Ortiz',
        licenseNumber: 'LIC-44511',
        licenseCategory: 'C',
        licenseExpiry: new Date('2028-06-18'),
        status: DriverStatus.ON_DUTY,
        safetyScore: 94
      }
    }),
    prisma.driver.create({
      data: {
        name: 'Priya Das',
        licenseNumber: 'LIC-88732',
        licenseCategory: 'C+E',
        licenseExpiry: new Date('2027-12-05'),
        status: DriverStatus.ON_DUTY,
        safetyScore: 97
      }
    }),
    prisma.driver.create({
      data: {
        name: 'Miguel Costa',
        licenseNumber: 'LIC-55177',
        licenseCategory: 'B',
        licenseExpiry: new Date('2024-10-01'),
        status: DriverStatus.SUSPENDED,
        safetyScore: 72
      }
    })
  ]);

  await prisma.trip.createMany({
    data: [
      {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        cargoWeight: 9000,
        origin: 'Dallas',
        destination: 'Austin',
        revenue: 2300,
        status: TripStatus.COMPLETED,
        startOdometer: 119000,
        endOdometer: 119320
      },
      {
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        cargoWeight: 4500,
        origin: 'Houston',
        destination: 'San Antonio',
        revenue: 1800,
        status: TripStatus.DISPATCHED,
        startOdometer: 97700,
        endOdometer: null
      }
    ]
  });

  await prisma.serviceLog.create({
    data: {
      vehicleId: vehicle3.id,
      description: 'Brake pad replacement',
      cost: 650,
      date: new Date('2026-01-10')
    }
  });

  await prisma.fuelLog.createMany({
    data: [
      {
        vehicleId: vehicle1.id,
        liters: 140,
        cost: 595,
        odometer: 119320,
        date: new Date('2026-01-05')
      },
      {
        vehicleId: vehicle2.id,
        liters: 100,
        cost: 430,
        odometer: 97920,
        date: new Date('2026-01-12')
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
