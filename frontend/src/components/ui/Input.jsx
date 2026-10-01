import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  { label, error, hint, className, icon: Icon, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#475569]" htmlFor={props.id || props.name}>
          {label}
          {props.required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            <Icon size={14} />
          </div>
        )}
        <input
          ref={ref}
          id={props.id || props.name}
          className={cn(
            'w-full h-9 px-3 text-sm bg-white text-[#0F172A] placeholder:text-[#94A3B8]',
            'border rounded-lg outline-none transition-colors',
            'border-[#E8EAEE] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#FEF2F2]',
            Icon && 'pl-9',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F8F9FB]',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#475569]" htmlFor={props.id || props.name}>
          {label}
          {props.required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={props.id || props.name}
        className={cn(
          'w-full px-3 py-2 text-sm bg-white text-[#0F172A] placeholder:text-[#94A3B8]',
          'border rounded-lg outline-none transition-colors resize-none',
          'border-[#E8EAEE] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]',
          error && 'border-[#DC2626] focus:border-[#DC2626]',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, children, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#475569]" htmlFor={props.id || props.name}>
          {label}
          {props.required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={props.id || props.name}
        className={cn(
          'w-full h-9 px-3 text-sm bg-white text-[#0F172A]',
          'border rounded-lg outline-none transition-colors appearance-none cursor-pointer',
          'border-[#E8EAEE] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]',
          error && 'border-[#DC2626]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
});
