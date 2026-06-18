import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl',
        hover && 'hover:border-[var(--color-text)]/15 hover:bg-[var(--color-surface-strong)] transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5 border-b border-[var(--color-border)]', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-[#1C1C1E] border border-white/8 rounded-2xl p-5 space-y-3">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={cn('skeleton h-3 rounded-lg', i === lines - 2 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  );
}
