import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-400 transition focus:ring-2',
        className
      )}
      {...props}
    />
  );
};
