# FleetFlow

FleetFlow is a modular fleet and logistics management platform with:

- React + TypeScript frontend
- Express + TypeScript backend
- PostgreSQL with Prisma ORM
- JWT auth with role-based access control
- Real-time dashboard updates via Socket.IO

## Quick Start

1. Open terminal in `fleetflow/`
2. Run:

```bash
docker-compose up --build
```

Backend API will be at `http://localhost:4000`, frontend at `http://localhost:5173`.

## Seeded Accounts

Password for all accounts: `Password@123`

- Manager: `manager@fleetflow.com`
- Dispatcher: `dispatcher@fleetflow.com`
- Safety: `safety@fleetflow.com`
- Analyst: `analyst@fleetflow.com`

## Core Features

- Vehicle, driver, trip, service, and fuel full CRUD endpoints
- Trip creation hard business rules:
  - Driver must be `ON_DUTY`
  - Driver license must be valid (not expired)
  - Vehicle must be `AVAILABLE`
  - Cargo weight cannot exceed vehicle max capacity
- Trip status transitions:
  - `DISPATCHED` -> vehicle and driver set to `ON_TRIP`
  - `COMPLETED` -> vehicle set to `AVAILABLE`, driver set to `ON_DUTY`, vehicle odometer updated
- Maintenance automation:
  - Creating a service log sets vehicle status to `IN_SHOP`
- Analytics computed dynamically from relational DB:
  - Total operational cost per vehicle
  - Fuel efficiency (distance/liters)
  - ROI per vehicle
- CSV and PDF export from backend analytics endpoint
- Real-time UI refresh on KPI and status changes

## Role Permissions

- `MANAGER`: manage vehicles/drivers and view reports
- `DISPATCHER`: create and operate trips, fuel logs
- `SAFETY`: update driver compliance
- `ANALYST`: reports/analytics only

## Suggested Commit Sequence

1. Project setup
2. Database schema + seed
3. Auth + RBAC
4. Vehicle module
5. Driver module
6. Trip module + business rules
7. Maintenance + fuel modules
8. Analytics + exports
9. Frontend UI pages
10. Realtime integration
