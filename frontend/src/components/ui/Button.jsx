import { cn } from '../../utils/cn';

const sizeMap = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

const variantMap = {
  primary: `
    bg-[#4F46E5] text-white border border-[#4F46E5]
    hover:bg-[#4338CA] hover:border-[#4338CA]
    active:bg-[#3730A3]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-white text-[#0F172A] border border-[#E8EAEE]
    hover:bg-[#F8F9FB] hover:border-[#D1D5DB]
    active:bg-[#F1F5F9]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-[#475569] border border-transparent
    hover:bg-[#F8F9FB] hover:text-[#0F172A]
    active:bg-[#F1F5F9]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-[#DC2626] text-white border border-[#DC2626]
    hover:bg-[#B91C1C] hover:border-[#B91C1C]
    active:bg-[#991B1B]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  'danger-ghost': `
    bg-transparent text-[#DC2626] border border-transparent
    hover:bg-[#FEF2F2]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  success: `
    bg-[#16A34A] text-white border border-[#16A34A]
    hover:bg-[#15803D]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 focus-visible:outline-none',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 13 : 15} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={size === 'xs' ? 12 : size === 'sm' ? 13 : 15} />}
    </button>
  );
}
