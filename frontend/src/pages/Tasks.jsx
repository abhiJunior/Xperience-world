import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Filter, List, LayoutGrid, CheckSquare,
  GripVertical, MoreHorizontal, Edit2, Trash2, Sparkles, Clock,
  ChevronDown,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tasksApi } from '../api/tasks';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../store/uiStore';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { formatDate } from '../utils/formatters';
import {
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS, TASK_CATEGORIES,
  TASK_STATUSES, TASK_PRIORITIES,
} from '../utils/constants';

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useTasks(eventId, filters) {
  return useQuery({
    queryKey: ['tasks', eventId, filters],
    queryFn: () => tasksApi.list(eventId, filters),
    enabled: !!eventId,
  });
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(250),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
});

// ── Task Modal ─────────────────────────────────────────────────────────────────
function TaskModal({ isOpen, onClose, task, eventId }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const isEdit = !!task;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          category: task.category,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assignee: task.assignee,
        }
      : { status: 'todo', priority: 'medium', category: 'other' },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? tasksApi.update(eventId, task._id, data)
        : tasksApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', eventId] });
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onClose();
      reset();
    },
    onError: (err) => toast.error('Failed to save task', err.message),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'New Task'}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            loading={mutation.isPending}
            onClick={handleSubmit((d) => mutation.mutate(d))}
          >
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" id="task-title" error={errors.title?.message} required {...register('title')} />
        <Textarea label="Description" id="task-desc" rows={3} {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" id="task-cat" error={errors.category?.message} required {...register('category')}>
            {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Priority" id="task-priority" {...register('priority')}>
            {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" id="task-status" {...register('status')}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
          </Select>
          <Input label="Due date" id="task-due" type="date" {...register('dueDate')} />
        </div>
        <Input label="Assignee" id="task-assignee" placeholder="Name or email" {...register('assignee')} />
      </div>
    </Modal>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, eventId, onEdit }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(eventId, task._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] });
      toast.success('Task deleted');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => tasksApi.update(eventId, task._id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
  });

  const statusColor = TASK_STATUS_COLORS[task.status] || 'slate';
  const priorityColor = TASK_PRIORITY_COLORS[task.priority] || 'slate';

  return (
    <div className="group bg-white border border-[#E8EAEE] rounded-xl p-3.5 hover:border-[#D1D5DB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-[#0F172A] leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-1 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-[11px] text-[#94A3B8] line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <Pill color={priorityColor} size="xs">{task.priority}</Pill>
        <Pill color="slate" size="xs">{task.category}</Pill>
        {task.source === 'chat' || task.source === 'ai_suggestion' ? (
          <Pill color="accent" size="xs"><Sparkles size={9} /> AI</Pill>
        ) : null}
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mt-2">
          <Clock size={9} />
          <span>Due {formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, eventId, onEdit, onCreateNew }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const statusColor = TASK_STATUS_COLORS[status];

  const handleDrop = useMutation({
    mutationFn: ({ taskId, newStatus }) => tasksApi.update(eventId, taskId, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
    onError: (err) => toast.error('Failed to update status', err.message),
  });

  return (
    <div
      className="flex-1 min-w-[240px] max-w-[280px] flex flex-col gap-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) handleDrop.mutate({ taskId, newStatus: status });
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill color={statusColor} size="xs" dot>{TASK_STATUS_LABELS[status]}</Pill>
          <span className="text-xs text-[#94A3B8]">{tasks.length}</span>
        </div>
        <button
          onClick={() => onCreateNew(status)}
          className="p-1 text-[#94A3B8] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition-colors"
          aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[100px]">
        {tasks.map((task) => (
          <div
            key={task._id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('taskId', task._id)}
            className="cursor-grab active:cursor-grabbing"
          >
            <TaskCard task={task} eventId={eventId} onEdit={onEdit} />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-[#E8EAEE] rounded-xl h-20 flex items-center justify-center">
            <p className="text-[11px] text-[#94A3B8]">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────
function TaskTableRow({ task, eventId, onEdit }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(eventId, task._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] });
      toast.success('Task deleted');
    },
  });

  const statusColor = TASK_STATUS_COLORS[task.status] || 'slate';
  const priorityColor = TASK_PRIORITY_COLORS[task.priority] || 'slate';

  return (
    <tr className="border-b border-[#F0F1F4] hover:bg-[#F8F9FB] transition-colors">
      <td className="px-4 py-3 max-w-[240px]">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-[#0F172A] truncate">{task.title}</p>
          {(task.source === 'chat' || task.source === 'ai_suggestion') && (
            <Pill color="accent" size="xs"><Sparkles size={9} /></Pill>
          )}
        </div>
        {task.description && <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">{task.description}</p>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Pill color={statusColor} size="xs" dot>{TASK_STATUS_LABELS[task.status]}</Pill>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Pill color={priorityColor} size="xs">{task.priority}</Pill>
      </td>
      <td className="px-4 py-3 text-xs text-[#94A3B8] whitespace-nowrap">
        {task.dueDate ? formatDate(task.dueDate) : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-[#94A3B8]">
        {task.assignee || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task)} className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded transition-colors">
            <Edit2 size={12} />
          </button>
          <button onClick={() => deleteMutation.mutate()} className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { id: eventId } = useParams();
  const [view, setView] = useState('kanban');
  const [filters, setFilters] = useState({});
  const [editTask, setEditTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const assistantOpen = useUIStore((s) => s.assistantOpen);

  const { data, isLoading } = useTasks(eventId, filters);
  const tasks = Array.isArray(data) ? data : (data?.tasks || []);

  const grouped = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const openCreateModal = (status = 'todo') => {
    setEditTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const viewTabs = [
    { label: 'Kanban', value: 'kanban', icon: LayoutGrid },
    { label: 'List', value: 'list', icon: List },
  ];

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">Tasks</h1>
          <p className="text-xs text-[#94A3B8]">{tasks.length} tasks total</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs tabs={viewTabs} activeTab={view} onChange={setView} />
          <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreateModal()}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select
          id="filter-status"
          className="h-8 text-xs w-36"
          value={filters.status || ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
        </Select>
        <Select
          id="filter-category"
          className="h-8 text-xs w-36"
          value={filters.category || ''}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
        >
          <option value="">All categories</option>
          {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-4">
          {TASK_STATUSES.map((s) => (
            <div key={s} className="flex-1 min-w-[240px] flex flex-col gap-3">
              <Skeleton className="h-6 w-24" />
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Create tasks manually or ask the AI assistant to generate a plan."
          action="Add Task"
          onAction={() => openCreateModal()}
        />
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              eventId={eventId}
              onEdit={openEditModal}
              onCreateNew={openCreateModal}
            />
          ))}
        </div>
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8EAEE] bg-[#F8F9FB]">
                {['Task', 'Status', 'Priority', 'Due date', 'Assignee', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#94A3B8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskTableRow key={task._id} task={task} eventId={eventId} onEdit={openEditModal} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
        eventId={eventId}
      />
      <AssistantPanel />
    </div>
  );
}
