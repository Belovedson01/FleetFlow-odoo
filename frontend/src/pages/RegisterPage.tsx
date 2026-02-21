import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { authService } from '../services/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['MANAGER', 'DISPATCHER', 'SAFETY', 'ANALYST'])
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'DISPATCHER'
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitError('');
      await authService.register(values);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Registration failed');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Create FleetFlow Account</h1>
        <p className="mb-6 text-sm text-slate-500">Register and start with role-based access.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
            <Controller control={form.control} name="name" render={({ field }) => <Input {...field} />} />
            {form.formState.errors.name ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => <Input type="email" autoComplete="email" {...field} />}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => <Input type="password" autoComplete="new-password" {...field} />}
            />
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select {...field}>
                  <option value="MANAGER">Manager</option>
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="SAFETY">Safety</option>
                  <option value="ANALYST">Analyst</option>
                </Select>
              )}
            />
            {form.formState.errors.role ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.role.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Register'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
