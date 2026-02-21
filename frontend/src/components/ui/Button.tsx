import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'secondary' | 'danger' | 'outline';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = ({ className, variant = 'default', ...props }: Props) => {
  const variants: Record<Variant, string> = {
    default: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
  };

  return (
    <button
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
