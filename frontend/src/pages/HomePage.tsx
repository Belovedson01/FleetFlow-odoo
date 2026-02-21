import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const roles = [
  {
    title: 'Fleet Manager',
    description: 'Oversees fleet assets, utilization, compliance and strategic operations.'
  },
  {
    title: 'Dispatcher',
    description: 'Assigns vehicles and drivers, monitors trips and handles live logistics changes.'
  },
  {
    title: 'Safety Officer',
    description: 'Tracks license validity, driver compliance and safety performance metrics.'
  },
  {
    title: 'Financial Analyst',
    description: 'Analyzes cost, ROI, fuel trends and performance reports across the fleet.'
  }
];

export const HomePage = () => {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">FleetFlow</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Modular Fleet and Logistics Management System
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Run end-to-end fleet operations with real-time dispatching, maintenance intelligence, fuel
            tracking and role-based command workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login">
              <Button>Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">Register</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.title} className="h-full">
              <h2 className="text-lg font-semibold text-slate-800">{role.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{role.description}</p>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
};
