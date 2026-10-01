import { cn } from '../../utils/cn';

/** Rectangular skeleton block */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Row of skeleton lines */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('bg-white border border-[#E8EAEE] rounded-[12px] p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStatCard() {
  return (
    <div className="bg-white border border-[#E8EAEE] rounded-[12px] p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  );
}

/** Table row skeleton */
export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b border-[#F0F1F4]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}
