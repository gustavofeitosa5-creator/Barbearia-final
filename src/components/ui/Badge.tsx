import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'gold' | 'success' | 'error' | 'warning' | 'info' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    gold: 'bg-[#D4A853]/15 text-[#D4A853] border-[#D4A853]/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-white/5 text-[#9CA3AF] border-white/10',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pendente: { label: 'Pendente', variant: 'warning' },
    confirmado: { label: 'Confirmado', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'error' },
    concluido: { label: 'Concluído', variant: 'info' },
  };
  const config = map[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
