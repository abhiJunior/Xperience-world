import { cn } from '../../utils/cn';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 bg-[#F8F9FB] border border-[#E8EAEE] rounded-lg p-0.5',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
            activeTab === tab.value
              ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'text-[#94A3B8] hover:text-[#475569]',
          )}
        >
          {tab.icon && <tab.icon size={13} />}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                activeTab === tab.value
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'bg-[#E2E8F0] text-[#64748B]',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
