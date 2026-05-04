import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return 'text-emerald-500';
    if (v >= 50) return 'text-sky-500';
    if (v >= 20) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn('transition-all duration-500 ease-out', getColor(clamped))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(clamped)}%</span>
        </div>
      </div>
      {label && <p className="text-sm text-muted-foreground font-medium">{label}</p>}
    </div>
  );
}
