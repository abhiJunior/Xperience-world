import { cn } from '../../utils/cn';

/** Linear progress bar */
export function ProgressBar({ value = 0, max = 100, color = 'accent', showLabel = false, className }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const trackColor = {
    accent: 'bg-[#EEF2FF]',
    success: 'bg-[#F0FDF4]',
    warning: 'bg-[#FFFBEB]',
    danger: 'bg-[#FEF2F2]',
  }[color] || 'bg-[#EEF2FF]';

  const fillColor = {
    accent: 'bg-[#4F46E5]',
    success: 'bg-[#16A34A]',
    warning: 'bg-[#D97706]',
    danger: 'bg-[#DC2626]',
  }[color] || 'bg-[#4F46E5]';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', trackColor)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColor)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#94A3B8] tabular-nums w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

/** Circular progress ring */
export function ProgressRing({
  value = 0,
  max = 100,
  size = 56,
  strokeWidth = 5,
  color = 'accent',
  children,
  className,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  const strokeColors = {
    accent: '#4F46E5',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
  };

  const trackColors = {
    accent: '#EEF2FF',
    success: '#F0FDF4',
    warning: '#FFFBEB',
    danger: '#FEF2F2',
  };

  const stroke = strokeColors[color] || strokeColors.accent;
  const track = trackColors[color] || trackColors.accent;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
