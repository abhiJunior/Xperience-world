import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Building2, Phone, Mail, Search,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vendorsApi } from '../api/vendors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Skeleton, SkeletonRow } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../store/uiStore';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { formatCurrency } from '../utils/formatters';
import {
  VENDOR_CATEGORIES, VENDOR_STATUSES,
  VENDOR_STATUS_COLORS, VENDOR_STATUS_LABELS,
} from '../utils/constants';

function useVendors(eventId) {
  return useQuery({
    queryKey: ['vendors', eventId],
    queryFn: () => vendorsApi.list(eventId),
    enabled: !!eventId,
  });
}

const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  status: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  'contact.name': z.string().optional(),
  'contact.email': z.string().email().optional().or(z.literal('')),
  'contact.phone': z.string().optional(),
});

function VendorModal({ isOpen, onClose, vendor, eventId }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const isEdit = !!vendor;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor
      ? {
          name: vendor.name,
          category: vendor.category,
          status: vendor.status,
          cost: vendor.cost,
          capacity: vendor.capacity,
          notes: vendor.notes,
          'contact.name': vendor.contact?.name,
          'contact.email': vendor.contact?.email,
          'contact.phone': vendor.contact?.phone,
        }
      : { status: 'shortlisted', category: 'venue' },
  });

  const mutation = useMutation({
    mutationFn: (raw) => {
      const data = {
        name: raw.name,
        category: raw.category,
        status: raw.status,
        cost: raw.cost,
        capacity: raw.capacity,
        notes: raw.notes,
        contact: {
          name: raw['contact.name'],
          email: raw['contact.email'],
          phone: raw['contact.phone'],
        },
      };
      return isEdit ? vendorsApi.update(eventId, vendor._id, data) : vendorsApi.create(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', eventId] });
      toast.success(isEdit ? 'Vendor updated' : 'Vendor added');
      onClose();
      reset();
    },
    onError: (err) => toast.error('Failed to save vendor', err.message),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>
            {isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Vendor name" id="v-name" required error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" id="v-cat" required {...register('category')}>
            {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Status" id="v-status" {...register('status')}>
            {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{VENDOR_STATUS_LABELS[s]}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Cost (₹)" id="v-cost" type="number" min="0" {...register('cost')} />
          <Input label="Capacity" id="v-capacity" type="number" min="0" placeholder="0 = unlimited" {...register('capacity')} />
        </div>
        <div className="border-t border-[#E8EAEE] pt-3">
          <p className="text-xs font-medium text-[#475569] mb-3">Contact details</p>
          <div className="flex flex-col gap-3">
            <Input label="Contact name" id="v-cname" {...register('contact.name')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" id="v-cemail" type="email" error={errors['contact.email']?.message} {...register('contact.email')} />
              <Input label="Phone" id="v-cphone" {...register('contact.phone')} />
            </div>
          </div>
        </div>
        <Input label="Notes" id="v-notes" placeholder="Any additional notes..." {...register('notes')} />
      </div>
    </Modal>
  );
}

export default function VendorsPage() {
  const { id: eventId } = useParams();
  const [editVendor, setEditVendor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const assistantOpen = useUIStore((s) => s.assistantOpen);
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const { data, isLoading } = useVendors(eventId);
  const vendors = Array.isArray(data) ? data : (data?.vendors || []);

  const filtered = vendors.filter((v) => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vendorsApi.delete(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', eventId] });
      toast.success('Vendor removed');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => vendorsApi.updateStatus(eventId, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors', eventId] }),
    onError: (err) => toast.error('Failed to update status', err.message),
  });

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">Vendors</h1>
          <p className="text-xs text-[#94A3B8]">{vendors.length} vendors</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditVendor(null); setModalOpen(true); }}>
          Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Input
          id="v-search"
          className="h-8 text-xs w-48"
          placeholder="Search vendors..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          id="v-filter-status"
          className="h-8 text-xs w-36"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{VENDOR_STATUS_LABELS[s]}</option>)}
        </Select>
      </div>

      {/* Table */}
      <Card padding={false}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8EAEE] bg-[#F8F9FB]">
              {['Vendor', 'Category', 'Status', 'Cost', 'Contact', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#94A3B8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Building2}
                    title="No vendors found"
                    description="Add vendors to track contacts, costs and status."
                    action="Add Vendor"
                    onAction={() => { setEditVendor(null); setModalOpen(true); }}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((vendor) => (
                <tr key={vendor._id} className="border-b border-[#F0F1F4] hover:bg-[#F8F9FB] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#F8F9FB] border border-[#E8EAEE] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={12} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#0F172A]">{vendor.name}</p>
                        {vendor.notes && <p className="text-[10px] text-[#94A3B8] truncate max-w-[160px]">{vendor.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill color="slate" size="xs">{vendor.category}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Pill color={VENDOR_STATUS_COLORS[vendor.status] || 'slate'} size="xs" dot>
                        {VENDOR_STATUS_LABELS[vendor.status]}
                      </Pill>
                      {vendor.status === 'unavailable' && (
                        <button
                          onClick={() => toast.info('Find backup', 'Ask the AI assistant to find a backup vendor.')}
                          className="text-[10px] text-[#4F46E5] hover:underline font-medium"
                        >
                          Find backup
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475569]">
                    {vendor.cost > 0 ? formatCurrency(vendor.cost) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {vendor.contact?.name || vendor.contact?.email ? (
                      <div className="flex flex-col gap-0.5">
                        {vendor.contact.name && (
                          <p className="text-xs text-[#475569]">{vendor.contact.name}</p>
                        )}
                        {vendor.contact.email && (
                          <a href={`mailto:${vendor.contact.email}`} className="text-[10px] text-[#4F46E5] hover:underline flex items-center gap-1">
                            <Mail size={9} />{vendor.contact.email}
                          </a>
                        )}
                        {vendor.contact.phone && (
                          <p className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                            <Phone size={9} />{vendor.contact.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditVendor(vendor); setModalOpen(true); }} className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(vendor._id)} className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <VendorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditVendor(null); }}
        vendor={editVendor}
        eventId={eventId}
      />
      <AssistantPanel />
    </div>
  );
}
