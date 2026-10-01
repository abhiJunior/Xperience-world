import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Calendar, MapPin, Users, ShieldAlert, Sparkles,
  ChevronRight, CalendarDays,
} from 'lucide-react';
import { eventsApi } from '../api/events';
import { chatApi } from '../api/chat';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { ProgressRing } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../store/uiStore';
import { formatDate } from '../utils/formatters';
import {
  EVENT_TYPE_LABELS, EVENT_STATUS_COLORS,
} from '../utils/constants';

// ── Hook ──────────────────────────────────────────────────────────────────────
function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list(),
  });
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event }) {
  const navigate = useNavigate();
  const statusColor = EVENT_STATUS_COLORS[event.status] || 'slate';

  return (
    <Card
      hover
      padding={false}
      className="overflow-hidden cursor-pointer"
      onClick={() => navigate(`/events/${event._id}/dashboard`)}
    >
      {/* Colored top strip */}
      <div className="h-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Pill color={statusColor} size="xs" dot>
                {event.status}
              </Pill>
              <Pill color="accent" size="xs">
                {EVENT_TYPE_LABELS[event.type] || event.type}
              </Pill>
            </div>
            <h2 className="text-sm font-semibold text-[#0F172A] truncate leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Readiness ring */}
          <ProgressRing
            value={event.readinessScore || 0}
            size={48}
            strokeWidth={4}
            color={
              (event.readinessScore || 0) >= 80
                ? 'success'
                : (event.readinessScore || 0) >= 50
                ? 'warning'
                : 'danger'
            }
          >
            <span className="text-[10px] font-bold text-[#0F172A]">
              {event.readinessScore || 0}%
            </span>
          </ProgressRing>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <Calendar size={11} />
            <span>
              {formatDate(event.startDate)} – {formatDate(event.endDate)}
            </span>
          </div>
          {event.city && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <MapPin size={11} />
              <span>{event.city}</span>
            </div>
          )}
          {event.expectedGuests > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <Users size={11} />
              <span>{event.expectedGuests} guests expected</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0F1F4]">
          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <ShieldAlert size={11} />
            <span>{event.openRisks ?? 0} open risks</span>
          </div>
          <ChevronRight size={14} className="text-[#94A3B8]" />
        </div>
      </div>
    </Card>
  );
}

// ── New Event Flow ────────────────────────────────────────────────────────────
function NewEventModal({ isOpen, onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'ai' | 'done'
  const [description, setDescription] = useState('');
  const [useAI, setUseAI] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const event = await eventsApi.create(formData);
      return event;
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    type: 'wedding',
    startDate: '',
    endDate: '',
    city: '',
    expectedGuests: '',
    budgetTotal: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) return;

    try {
      // Backend validator requires ISO 8601 datetime strings
      const toISO = (d) => d ? new Date(d).toISOString() : undefined;

      const payload = {
        title: formData.title,
        type: formData.type,
        startDate: toISO(formData.startDate),
        endDate: toISO(formData.endDate),
        city: formData.city || undefined,
        expectedGuests: formData.expectedGuests ? Number(formData.expectedGuests) : undefined,
        budget: formData.budgetTotal
          ? { total: Number(formData.budgetTotal), currency: 'INR' }
          : undefined,
      };

      if (useAI && description) {
        setStep('ai');
        const event = await eventsApi.create(payload);
        const eventId = event._id || event.id;
        await chatApi.sendMessage(eventId, {
          message: description || `Please create a comprehensive event plan.`,
        });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        toast.success('Event created!', 'AI has generated your initial plan.');
        navigate(`/events/${eventId}/dashboard`);
        onClose();
      } else {
        const event = await eventsApi.create(payload);
        const eventId = event._id || event.id;
        queryClient.invalidateQueries({ queryKey: ['events'] });
        toast.success('Event created!');
        navigate(`/events/${eventId}/dashboard`);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to create event', err.message);
      setStep('form');
    }
  };

  const reset = () => {
    setStep('form');
    setDescription('');
    setUseAI(false);
    setFormData({ title: '', type: 'wedding', startDate: '', endDate: '', city: '', expectedGuests: '', budgetTotal: '', description: '' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="New Event"
      size="md"
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.isPending || step === 'ai'}
              onClick={handleCreate}
              disabled={!formData.title || !formData.startDate || !formData.endDate}
            >
              {useAI ? 'Create & Generate Plan' : 'Create Event'}
            </Button>
          </>
        ) : null
      }
    >
      {step === 'ai' ? (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="w-14 h-14 bg-[#EEF2FF] rounded-full flex items-center justify-center">
            <Sparkles size={22} className="text-[#4F46E5] animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0F172A]">Generating your event plan...</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              The AI is creating tasks, identifying risks, and setting up your dashboard.
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-[#4F46E5]" />
            <span className="typing-dot w-2 h-2 rounded-full bg-[#4F46E5]" />
            <span className="typing-dot w-2 h-2 rounded-full bg-[#4F46E5]" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Event title"
            id="event-title"
            placeholder="e.g. Sharma-Gupta Wedding"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Select
            label="Event type"
            id="event-type"
            value={formData.type}
            onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="wedding">Wedding</option>
            <option value="corporate">Corporate</option>
            <option value="conference">Conference</option>
            <option value="other">Other</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date"
              id="start-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
            <Input
              label="End date"
              id="end-date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              id="city"
              placeholder="Mumbai"
              value={formData.city}
              onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Expected guests"
              id="expected-guests"
              type="number"
              min="0"
              placeholder="200"
              value={formData.expectedGuests}
              onChange={(e) => setFormData((f) => ({ ...f, expectedGuests: e.target.value }))}
            />
          </div>
          <Input
            label="Total budget (₹)"
            id="budget-total"
            type="number"
            min="0"
            placeholder="e.g. 6500000"
            value={formData.budgetTotal}
            onChange={(e) => setFormData((f) => ({ ...f, budgetTotal: e.target.value }))}
            hint="Leave blank if not yet decided"
          />

          {/* AI plan option */}
          <div className="border border-[#E8EAEE] rounded-xl p-4 bg-[#F8F9FB]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
                id="use-ai"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#4F46E5]" />
                  <span className="text-xs font-semibold text-[#0F172A]">Generate AI plan</span>
                  <Pill color="accent" size="xs">Recommended</Pill>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Let AI build a complete task list, vendor suggestions, and risk assessment.
                </p>
              </div>
            </label>

            {useAI && (
              <Textarea
                className="mt-3"
                placeholder="Describe your event in detail — theme, requirements, special requests..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: events, isLoading, isError } = useEvents();

  const eventList = Array.isArray(events) ? events : (events?.events || []);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
            <CalendarDays size={18} className="text-[#4F46E5]" />
            My Events
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {eventList.length} event{eventList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowModal(true)}
        >
          New Event
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[12px]" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={ShieldAlert}
          title="Failed to load events"
          description="Could not connect to the server. Check your connection and try again."
        />
      ) : eventList.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event and let AI help you plan it from scratch."
          action="Create Event"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventList.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      <NewEventModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
