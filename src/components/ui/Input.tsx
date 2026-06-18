import { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightIcon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]/50',
            'transition-all duration-200 text-sm',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error && 'border-red-500/50 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--color-text)]">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]/50',
          'transition-all duration-200 text-sm resize-none',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
