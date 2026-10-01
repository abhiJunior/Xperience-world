import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Activity, User, Sparkles, Settings, Clock } from 'lucide-react';
import { activityApi } from '../api/activity';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Pill } from '../components/ui/Pill';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { useUIStore } from '../store/uiStore';
import { formatDateTime, formatRelative, formatActionLabel } from '../utils/formatters';
import { ACTOR_LABELS, ACTOR_COLORS } from '../utils/constants';

function useActivity(eventId) {
  return useQuery({
    queryKey: ['activity', eventId],
    queryFn: () => activityApi.list(eventId, { limit: 50 }),
    enabled: !!eventId,
  });
}

const ACTOR_ICONS = {
  user: User,
  ai: Sparkles,
  system: Settings,
  cron: Clock,
};

function ActivityItem({ log, isLast }) {
  const actor = log.actor;
  const Icon = ACTOR_ICONS[actor] || Activity;
  const color = ACTOR_COLORS[actor] || 'slate';

  const iconBg = {
    user: 'bg-[#4F46E5]',
    ai: 'bg-[#0284C7]',
    system: 'bg-[#64748B]',
    cron: 'bg-[#D97706]',
  }[actor] || 'bg-[#64748B]';

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center w-8 flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={13} className="text-white" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-[#E8EAEE] mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill color={color} size="xs">{ACTOR_LABELS[actor] || actor}</Pill>
            <p className="text-xs font-medium text-[#0F172A]">{log.summary || formatActionLabel(log.action)}</p>
          </div>
          <p className="text-[10px] text-[#94A3B8] whitespace-nowrap flex-shrink-0">
            {formatRelative(log.createdAt)}
          </p>
        </div>

        {/* Before / After */}
        {(log.before || log.after) && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {log.before && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-2.5 py-2">
                <p className="text-[9px] font-semibold text-[#DC2626] uppercase tracking-wide mb-1">Before</p>
                <pre className="text-[10px] text-[#475569] overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(log.before, null, 2).slice(0, 200)}
                </pre>
              </div>
            )}
            {log.after && (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-2.5 py-2">
                <p className="text-[9px] font-semibold text-[#16A34A] uppercase tracking-wide mb-1">After</p>
                <pre className="text-[10px] text-[#475569] overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(log.after, null, 2).slice(0, 200)}
                </pre>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-[#94A3B8] mt-1">{formatDateTime(log.createdAt)}</p>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { id: eventId } = useParams();
  const assistantOpen = useUIStore((s) => s.assistantOpen);

  const { data, isLoading } = useActivity(eventId);
  const logs = Array.isArray(data) ? data : (data?.logs || data?.activities || []);

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      <div>
        <h1 className="text-base font-semibold text-[#0F172A]">Activity Log</h1>
        <p className="text-xs text-[#94A3B8]">Immutable audit trail of all changes</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="All changes to this event will be logged here in real time."
        />
      ) : (
        <div className="max-w-2xl">
          {logs.map((log, i) => (
            <ActivityItem key={log._id} log={log} isLast={i === logs.length - 1} />
          ))}
        </div>
      )}

      <AssistantPanel />
    </div>
  );
}
