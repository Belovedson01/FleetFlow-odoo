import bcrypt from 'bcryptjs';
import { PrismaClient, DriverStatus, Role, TripStatus, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password@123', 10);

  await prisma.user.upsert({
    where: { email: 'manager@fleetflow.com' },
    update: {},
    create: {
      name: 'Maya Manager',
      email: 'manager@fleetflow.com',
      password,
      role: Role.MANAGER
    }
  });

  await prisma.user.upsert({
    where: { email: 'dispatcher@fleetflow.com' },
    update: {},
    create: {
      name: 'Derek Dispatcher',
      email: 'dispatcher@fleetflow.com',
      password,
      role: Role.DISPATCHER
    }
  });

  await prisma.user.upsert({
    where: { email: 'safety@fleetflow.com' },
    update: {},
    create: {
      name: 'Sara Safety',
      email: 'safety@fleetflow.com',
      password,
      role: Role.SAFETY
    }
  });

  await prisma.user.upsert({
    where: { email: 'analyst@fleetflow.com' },
    update: {},
    create: {
      name: 'Aria Analyst',
      email: 'analyst@fleetflow.com',
      password,
      role: Role.ANALYST
    }
  });

  const [vehicle1, vehicle2, vehicle3] = await Promise.all([
    prisma.vehicle.upsert({
      where: { licensePlate: 'FF-TRK-101' },
      update: {},
      create: {
        name: 'Truck Alpha',
        model: 'Volvo FH16',
        licensePlate: 'FF-TRK-101',
        maxCapacityKg: 18000,
        odometer: 120000,
        acquisitionCost: 120000,
        status: VehicleStatus.AVAILABLE
      }
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'FF-TRK-202' },
      update: {},
      create: {
        name: 'Truck Beta',
        model: 'Scania R500',
        licensePlate: 'FF-TRK-202',
        maxCapacityKg: 15000,
        odometer: 98000,
        acquisitionCost: 95000,
        status: VehicleStatus.AVAILABLE
      }
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'FF-VAN-303' },
      update: {},
      create: {
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

  const [driver1, driver2] = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-44511' },
      update: {},
      create: {
        name: 'John Ortiz',
        licenseNumber: 'LIC-44511',
        licenseCategory: 'C',
        licenseExpiry: new Date('2028-06-18'),
        status: DriverStatus.ON_DUTY,
        safetyScore: 94
      }
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-88732' },
      update: {},
      create: {
        name: 'Priya Das',
        licenseNumber: 'LIC-88732',
        licenseCategory: 'C+E',
        licenseExpiry: new Date('2027-12-05'),
        status: DriverStatus.ON_DUTY,
        safetyScore: 97
      }
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-55177' },
      update: {},
      create: {
        name: 'Miguel Costa',
        licenseNumber: 'LIC-55177',
        licenseCategory: 'B',
        licenseExpiry: new Date('2024-10-01'),
        status: DriverStatus.SUSPENDED,
        safetyScore: 72
      }
    })
  ]);

  const completedTrip = await prisma.trip.findFirst({
    where: {
      vehicleId: vehicle1.id,
      driverId: driver1.id,
      origin: 'Dallas',
      destination: 'Austin',
      status: TripStatus.COMPLETED
    }
  });
  if (!completedTrip) {
    await prisma.trip.create({
      data: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        cargoWeight: 9000,
        origin: 'Dallas',
        destination: 'Austin',
        revenue: 2300,
        status: TripStatus.COMPLETED,
        startOdometer: 119000,
        endOdometer: 119320
      }
    });
  }

  const dispatchedTrip = await prisma.trip.findFirst({
    where: {
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      origin: 'Houston',
      destination: 'San Antonio',
      status: TripStatus.DISPATCHED
    }
  });
  if (!dispatchedTrip) {
    await prisma.trip.create({
      data: {
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
    });
    await prisma.vehicle.update({
      where: { id: vehicle2.id },
      data: { status: VehicleStatus.ON_TRIP }
    });
    await prisma.driver.update({
      where: { id: driver2.id },
      data: { status: DriverStatus.ON_TRIP }
    });
  }

  const service = await prisma.serviceLog.findFirst({
    where: {
      vehicleId: vehicle3.id,
      description: 'Brake pad replacement'
    }
  });
  if (!service) {
    await prisma.serviceLog.create({
      data: {
        vehicleId: vehicle3.id,
        description: 'Brake pad replacement',
        cost: 650,
        date: new Date('2026-01-10')
      }
    });
  }

  const fuel1 = await prisma.fuelLog.findFirst({
    where: {
      vehicleId: vehicle1.id,
      odometer: 119320
    }
  });
  if (!fuel1) {
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle1.id,
        liters: 140,
        cost: 595,
        odometer: 119320,
        date: new Date('2026-01-05')
      }
    });
  }

  const fuel2 = await prisma.fuelLog.findFirst({
    where: {
      vehicleId: vehicle2.id,
      odometer: 97920
    }
  });
  if (!fuel2) {
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle2.id,
        liters: 100,
        cost: 430,
        odometer: 97920,
        date: new Date('2026-01-12')
      }
    });
  }
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
