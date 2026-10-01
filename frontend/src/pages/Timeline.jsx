import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { subEventsApi } from '../api/subEvents';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { useUIStore } from '../store/uiStore';
import { formatDate } from '../utils/formatters';
import { SUBEVENT_STATUS_COLORS } from '../utils/constants';

function useSubEvents(eventId) {
  return useQuery({
    queryKey: ['subevents', eventId],
    queryFn: () => subEventsApi.list(eventId),
    enabled: !!eventId,
  });
}

function SubEventCard({ subEvent, isFirst, isLast }) {
  const statusColor = SUBEVENT_STATUS_COLORS[subEvent.status] || 'slate';

  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center w-6 flex-shrink-0">
        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-4 ${
          subEvent.status === 'live' ? 'bg-[#D97706]'
          : subEvent.status === 'confirmed' ? 'bg-[#16A34A]'
          : subEvent.status === 'completed' ? 'bg-[#64748B]'
          : subEvent.status === 'cancelled' ? 'bg-[#DC2626]'
          : 'bg-[#4F46E5]'
        }`} />
        {!isLast && <div className="w-0.5 flex-1 bg-[#E8EAEE] mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <Card hover={false}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">{subEvent.name}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                  <Calendar size={11} />
                  {formatDate(subEvent.date)}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                  <Clock size={11} />
                  {subEvent.startTime} – {subEvent.endTime}
                </div>
              </div>
            </div>
            <Pill color={statusColor} size="sm" dot>{subEvent.status}</Pill>
          </div>

          {(subEvent.expectedGuests > 0 || subEvent.notes) && (
            <div className="flex items-center gap-4 pt-3 border-t border-[#F0F1F4]">
              {subEvent.expectedGuests > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                  <Users size={11} />
                  {subEvent.expectedGuests} guests expected
                </div>
              )}
              {subEvent.notes && (
                <p className="text-xs text-[#94A3B8] truncate">{subEvent.notes}</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const { id: eventId } = useParams();
  const assistantOpen = useUIStore((s) => s.assistantOpen);

  const { data, isLoading } = useSubEvents(eventId);
  const subEvents = Array.isArray(data) ? data : (data?.subEvents || []);

  // Sort by date
  const sorted = [...subEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      <div>
        <h1 className="text-base font-semibold text-[#0F172A]">Event Timeline</h1>
        <p className="text-xs text-[#94A3B8]">
          {sorted.length} sub-event{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center w-6">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="w-0.5 flex-1 mt-1" style={{ minHeight: 60 }} />
              </div>
              <Skeleton className="flex-1 h-24 rounded-[12px]" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sub-events yet"
          description="Sub-events will appear here once added to this event."
        />
      ) : (
        <div className="max-w-2xl">
          {sorted.map((se, i) => (
            <SubEventCard
              key={se._id}
              subEvent={se}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>
      )}

      <AssistantPanel />
    </div>
  );
}
