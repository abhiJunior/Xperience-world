import { cn } from '../../utils/cn';
import { Button } from './Button';

/**
 * EmptyState — shown when a list is empty.
 * @param {React.ReactNode} icon - Lucide icon component
 * @param {string} title
 * @param {string} description
 * @param {string} [action] - CTA label
 * @param {() => void} [onAction]
 */
export function EmptyState({ icon: Icon, title, description, action, onAction, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      )}
    >
      {Icon && (
        <div className="w-14 h-14 bg-[#F8F9FB] border border-[#E8EAEE] rounded-[14px] flex items-center justify-center mb-4">
          <Icon size={22} className="text-[#94A3B8]" />
        </div>
      )}
      <p className="text-sm font-semibold text-[#0F172A] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[#94A3B8] max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}
