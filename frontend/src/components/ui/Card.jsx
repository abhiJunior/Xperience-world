import { cn } from '../../utils/cn';

export function Card({ children, className, hover = false, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E8EAEE] rounded-[12px]',
        'shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.04)]',
        hover && 'transition-shadow duration-150 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.10)] hover:border-[#D1D5DB] cursor-pointer',
        padding && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#0F172A]', className)}>
      {children}
    </h3>
  );
}
