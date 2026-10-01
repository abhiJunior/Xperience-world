import { cn } from '../../utils/cn';

// color → tinted pill style
const colorMap = {
  success: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  warning: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  danger: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  info: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
  accent: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]',
  slate: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
  purple: 'bg-[#FAF5FF] text-[#7C3AED] border-[#DDD6FE]',
};

const sizeMap = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

/**
 * Pill / Badge — tinted, never heavy.
 * @param {string} color - one of success | warning | danger | info | accent | slate | purple
 * @param {string} size  - xs | sm | md
 */
export function Pill({ children, color = 'slate', size = 'sm', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-full leading-none',
        colorMap[color] || colorMap.slate,
        sizeMap[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            {
              'bg-[#16A34A]': color === 'success',
              'bg-[#D97706]': color === 'warning',
              'bg-[#DC2626]': color === 'danger',
              'bg-[#0284C7]': color === 'info',
              'bg-[#4F46E5]': color === 'accent',
              'bg-[#64748B]': color === 'slate',
              'bg-[#7C3AED]': color === 'purple',
            },
          )}
        />
      )}
      {children}
    </span>
  );
}

// Alias
export const Badge = Pill;
