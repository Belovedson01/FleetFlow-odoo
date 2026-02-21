import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { defaultRouteByRole } from '../lib/navigation';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/auth.store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    if (token && user) {
      navigate(defaultRouteByRole[user.role], { replace: true });
    }
  }, [navigate, token, user]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError('');
      const result = await authService.login(values.email, values.password);
      setAuth(result.token, result.user);
      navigate(defaultRouteByRole[result.user.role], { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">FleetFlow</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to your fleet operations console</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
            <Input type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
            <Input type="password" {...form.register('password')} />
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-5 text-xs text-slate-500">
          Seed users: manager@fleetflow.com, dispatcher@fleetflow.com, safety@fleetflow.com,
          analyst@fleetflow.com
        </p>
      </div>
    </div>
  );
};
