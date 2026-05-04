import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  default: 'bg-muted text-foreground',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

const iconColorMap = {
  default: 'text-muted-foreground',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  info: 'text-sky-600',
};

export function StatCard({ label, value, icon: Icon, color = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex items-center gap-4 transition-shadow hover:shadow-sm',
        color !== 'default' && colorMap[color],
        color === 'default' && 'bg-card border-border'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          color === 'default' ? 'bg-muted' : 'bg-white/60'
        )}
      >
        <Icon className={cn('w-5 h-5', iconColorMap[color])} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
