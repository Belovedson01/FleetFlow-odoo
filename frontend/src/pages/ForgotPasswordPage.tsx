import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email')
});

type ForgotForm = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage = () => {
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitError('');
      const response = await authService.forgotPassword(values.email);
      setMessage(response.message);
      form.reset({ email: '' });
    } catch (err: any) {
      setMessage('');
      setSubmitError(err?.response?.data?.message || 'Unable to process request');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Forgot Password</h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your email address to receive reset instructions.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
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

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Submitting...' : 'Send Reset Instructions'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
