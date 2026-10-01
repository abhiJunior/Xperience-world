import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Users, MapPin, Hotel, Car,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { guestsApi } from '../api/guests';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../store/uiStore';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { formatNumber } from '../utils/formatters';

function useGuests(eventId) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: () => guestsApi.list(eventId),
    enabled: !!eventId,
  });
}

const guestSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200),
  count: z.coerce.number().min(1, 'At least 1 guest'),
  arrivalCity: z.string().optional(),
  needsAccommodation: z.boolean().optional(),
  needsTransport: z.boolean().optional(),
  arrivalInfo: z.string().optional(),
});

function GuestGroupModal({ isOpen, onClose, group, eventId }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const isEdit = !!group;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: group
      ? {
          label: group.label,
          count: group.count,
          arrivalCity: group.arrivalCity,
          needsAccommodation: group.needsAccommodation,
          needsTransport: group.needsTransport,
          arrivalInfo: group.arrivalInfo,
        }
      : {},
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? guestsApi.update(eventId, group._id, data) : guestsApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      toast.success(isEdit ? 'Group updated' : 'Group added');
      onClose();
      reset();
    },
    onError: (err) => toast.error('Failed to save group', err.message),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Guest Group' : 'Add Guest Group'}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>
            {isEdit ? 'Save' : 'Add Group'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Group label"
          id="g-label"
          placeholder='e.g. "Outstation guests"'
          required
          error={errors.label?.message}
          {...register('label')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Guest count"
            id="g-count"
            type="number"
            min="1"
            required
            error={errors.count?.message}
            {...register('count')}
          />
          <Input
            label="Arrival city"
            id="g-city"
            placeholder="e.g. Delhi"
            {...register('arrivalCity')}
          />
        </div>
        <Input
          label="Arrival details"
          id="g-arrival"
          placeholder="Flight/train details, dates..."
          {...register('arrivalInfo')}
        />
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="accent-[#4F46E5]" {...register('needsAccommodation')} />
            <div className="flex items-center gap-1.5 text-xs text-[#475569]">
              <Hotel size={13} className="text-[#4F46E5]" />
              Needs accommodation
            </div>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="accent-[#4F46E5]" {...register('needsTransport')} />
            <div className="flex items-center gap-1.5 text-xs text-[#475569]">
              <Car size={13} className="text-[#4F46E5]" />
              Needs transport
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
}

function GuestGroupCard({ group, eventId, onEdit }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const deleteMutation = useMutation({
    mutationFn: () => guestsApi.delete(eventId, group._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      toast.success('Group removed');
    },
  });

  return (
    <Card hover={false}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={15} className="text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">{group.label}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {formatNumber(group.count)} guests
              {group.arrivalCity && <> · from {group.arrivalCity}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(group)}
            className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Arrival info */}
      {group.arrivalInfo && (
        <p className="text-xs text-[#475569] bg-[#F8F9FB] rounded-lg px-3 py-2 mb-3">
          {group.arrivalInfo}
        </p>
      )}

      {/* Coverage bars */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#475569]">
              <Hotel size={11} className="text-[#4F46E5]" />
              Accommodation
            </div>
            {group.needsAccommodation ? (
              <Pill color="warning" size="xs" dot>Required</Pill>
            ) : (
              <Pill color="success" size="xs" dot>Not needed</Pill>
            )}
          </div>
          {group.needsAccommodation && (
            <ProgressBar value={0} max={group.count} color="warning" showLabel />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#475569]">
              <Car size={11} className="text-[#4F46E5]" />
              Transport
            </div>
            {group.needsTransport ? (
              <Pill color="warning" size="xs" dot>Required</Pill>
            ) : (
              <Pill color="success" size="xs" dot>Not needed</Pill>
            )}
          </div>
          {group.needsTransport && (
            <ProgressBar value={0} max={group.count} color="warning" showLabel />
          )}
        </div>
      </div>
    </Card>
  );
}

export default function GuestsPage() {
  const { id: eventId } = useParams();
  const [editGroup, setEditGroup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const assistantOpen = useUIStore((s) => s.assistantOpen);

  const { data, isLoading } = useGuests(eventId);
  const groups = Array.isArray(data) ? data : (data?.guestGroups || []);

  const totalGuests = groups.reduce((sum, g) => sum + (g.count || 0), 0);
  const needsAccomm = groups.filter((g) => g.needsAccommodation).reduce((s, g) => s + g.count, 0);
  const needsTransport = groups.filter((g) => g.needsTransport).reduce((s, g) => s + g.count, 0);

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">Guests</h1>
          <p className="text-xs text-[#94A3B8]">{groups.length} groups · {formatNumber(totalGuests)} total guests</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditGroup(null); setModalOpen(true); }}>
          Add Group
        </Button>
      </div>

      {/* Summary cards */}
      {!isLoading && groups.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-[#94A3B8] mb-1">Total guests</p>
            <p className="text-2xl font-bold text-[#0F172A]">{formatNumber(totalGuests)}</p>
          </Card>
          <Card>
            <p className="text-xs text-[#94A3B8] mb-1">Need accommodation</p>
            <p className="text-2xl font-bold text-[#D97706]">{formatNumber(needsAccomm)}</p>
          </Card>
          <Card>
            <p className="text-xs text-[#94A3B8] mb-1">Need transport</p>
            <p className="text-2xl font-bold text-[#4F46E5]">{formatNumber(needsTransport)}</p>
          </Card>
        </div>
      )}

      {/* Groups grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[12px]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guest groups yet"
          description="Organise guests into groups to track accommodation and transport needs."
          action="Add Group"
          onAction={() => { setEditGroup(null); setModalOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GuestGroupCard
              key={group._id}
              group={group}
              eventId={eventId}
              onEdit={(g) => { setEditGroup(g); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <GuestGroupModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditGroup(null); }}
        group={editGroup}
        eventId={eventId}
      />
      <AssistantPanel />
    </div>
  );
}
