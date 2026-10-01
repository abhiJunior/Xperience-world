import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, CheckSquare, AlertTriangle, Building2, Users,
  DollarSign, Calendar, ShieldAlert, Lightbulb, ChevronRight,
  Clock, ArrowRight,
} from 'lucide-react';
import { eventsApi } from '../api/events';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { ProgressBar, ProgressRing } from '../components/ui/ProgressBar';
import { Skeleton, SkeletonStatCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { formatDate, formatCurrency, formatPercent } from '../utils/formatters';
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS,
  RISK_SEVERITY_COLORS, SUBEVENT_STATUS_COLORS,
  VENDOR_STATUS_COLORS,
} from '../utils/constants';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { useUIStore } from '../store/uiStore';

function useDashboard(eventId) {
  return useQuery({
    queryKey: ['dashboard', eventId],
    queryFn: () => eventsApi.dashboard(eventId),
    enabled: !!eventId,
    refetchInterval: 60_000,
  });
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = 'accent', trend }) {
  const colors = {
    accent: 'bg-[#EEF2FF] text-[#4F46E5]',
    success: 'bg-[#F0FDF4] text-[#16A34A]',
    warning: 'bg-[#FFFBEB] text-[#D97706]',
    danger: 'bg-[#FEF2F2] text-[#DC2626]',
    info: 'bg-[#F0F9FF] text-[#0284C7]',
  };

  return (
    <Card padding>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#94A3B8] mb-2">{label}</p>
          <p className="text-2xl font-bold text-[#0F172A] leading-none">{value}</p>
          {sub && <p className="text-xs text-[#94A3B8] mt-1.5">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${trend >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              <TrendingUp size={11} />
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Attention List ────────────────────────────────────────────────────────────
function AttentionList({ risks }) {
  if (!risks?.length) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No open risks"
        description="Your event looks good! Run a risk scan to stay up to date."
        className="py-8"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {risks.map((risk) => {
        const sev = RISK_SEVERITY_COLORS[risk.severity] || 'slate';
        return (
          <li
            key={risk._id}
            className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FB] border border-[#F0F1F4] hover:border-[#E8EAEE] transition-colors"
          >
            <ShieldAlert size={14} className={`flex-shrink-0 mt-0.5 ${
              risk.severity === 'critical' ? 'text-[#DC2626]'
              : risk.severity === 'high' ? 'text-[#D97706]'
              : risk.severity === 'medium' ? 'text-[#0284C7]'
              : 'text-[#16A34A]'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-medium text-[#0F172A] truncate">{risk.title}</p>
                <Pill color={sev} size="xs">{risk.severity}</Pill>
              </div>
              {risk.explanation && (
                <p className="text-[11px] text-[#94A3B8] line-clamp-1">{risk.explanation}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Sub-event Timeline ────────────────────────────────────────────────────────
function SubEventTimeline({ subEvents }) {
  if (!subEvents?.length) {
    return (
      <EmptyState
        icon={Calendar}
        title="No sub-events"
        description="Sub-events will appear here once added."
        className="py-6"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {subEvents.map((se, i) => {
        const statusColor = SUBEVENT_STATUS_COLORS[se.status] || 'slate';
        return (
          <div key={se._id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                se.status === 'confirmed' ? 'bg-[#16A34A]'
                : se.status === 'live' ? 'bg-[#D97706]'
                : se.status === 'completed' ? 'bg-[#64748B]'
                : 'bg-[#4F46E5]'
              }`} />
              {i < subEvents.length - 1 && (
                <div className="w-px flex-1 bg-[#E8EAEE] min-h-[20px] mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#0F172A]">{se.name}</p>
                <Pill color={statusColor} size="xs">{se.status}</Pill>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mt-0.5">
                <Calendar size={10} />
                <span>{formatDate(se.date)} · {se.startTime}–{se.endTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pending Tasks ─────────────────────────────────────────────────────────────
function DeadlineList({ tasks }) {
  if (!tasks?.length) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No pending tasks"
        description="All tasks are done or not yet created."
        className="py-6"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.slice(0, 6).map((task) => {
        const statusColor = TASK_STATUS_COLORS[task.status] || 'slate';
        return (
          <li
            key={task._id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FB] transition-colors"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              task.status === 'blocked' ? 'bg-[#DC2626]'
              : task.status === 'in_progress' ? 'bg-[#0284C7]'
              : 'bg-[#94A3B8]'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0F172A] truncate">{task.title}</p>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mt-0.5">
                  <Clock size={9} />
                  <span>Due {formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>
            <Pill color={statusColor} size="xs">
              {TASK_STATUS_LABELS[task.status]}
            </Pill>
          </li>
        );
      })}
    </ul>
  );
}

// ── Vendor Board ─────────────────────────────────────────────────────────────
function VendorBoard({ vendorSummary }) {
  if (!vendorSummary) return null;

  const total = vendorSummary.total || 1;
  const items = [
    { label: 'Confirmed', count: vendorSummary.confirmed, color: 'success' },
    { label: 'Negotiating', count: vendorSummary.negotiating, color: 'warning' },
    { label: 'Shortlisted', count: vendorSummary.shortlisted, color: 'info' },
    { label: 'Unavailable', count: vendorSummary.unavailable, color: 'danger' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ label, count, color }) => (
        <div key={label} className="flex items-center gap-3">
          <p className="text-xs text-[#475569] w-24 flex-shrink-0">{label}</p>
          <ProgressBar value={count} max={total} color={color} className="flex-1" />
          <span className="text-xs font-medium text-[#0F172A] w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Budget Bar ────────────────────────────────────────────────────────────────
function BudgetBar({ budget }) {
  if (!budget || budget.total === 0) {
    return (
      <p className="text-xs text-[#94A3B8] py-4 text-center">No budget set for this event.</p>
    );
  }

  const pct = formatPercent(budget.spent, budget.total);
  const color = pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-[#94A3B8]">Spent</p>
          <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(budget.spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#94A3B8]">Budget</p>
          <p className="text-sm font-semibold text-[#475569]">{formatCurrency(budget.total)}</p>
        </div>
      </div>
      <ProgressBar value={budget.spent} max={budget.total} color={color} showLabel />
      <p className="text-xs text-[#94A3B8]">{100 - pct}% remaining</p>
    </div>
  );
}

// ── Guest Summary ─────────────────────────────────────────────────────────────
function GuestSummary({ event }) {
  if (!event) return null;
  const { expectedGuests, confirmedGuests } = event;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl font-bold text-[#0F172A]">{confirmedGuests || 0}</p>
          <p className="text-[11px] text-[#94A3B8]">Confirmed</p>
        </div>
        <div className="h-10 w-px bg-[#E8EAEE]" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl font-bold text-[#0F172A]">{expectedGuests || 0}</p>
          <p className="text-[11px] text-[#94A3B8]">Expected</p>
        </div>
        <div className="h-10 w-px bg-[#E8EAEE]" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl font-bold text-[#0F172A]">
            {formatPercent(confirmedGuests || 0, expectedGuests || 1)}%
          </p>
          <p className="text-[11px] text-[#94A3B8]">Confirmed rate</p>
        </div>
      </div>
      <ProgressBar
        value={confirmedGuests || 0}
        max={expectedGuests || 1}
        color="accent"
        showLabel
      />
    </div>
  );
}

// ── Suggestions ───────────────────────────────────────────────────────────────
function SuggestionsList({ suggestions }) {
  if (!suggestions?.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {suggestions.slice(0, 3).map((s) => (
        <div
          key={s._id}
          className="flex items-start gap-3 p-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]"
        >
          <Lightbulb size={13} className="text-[#4F46E5] flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#0F172A]">{s.title}</p>
            {s.reason && (
              <p className="text-[11px] text-[#475569] mt-0.5 line-clamp-2">{s.reason}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { id: eventId } = useParams();
  const { data, isLoading, isError, refetch } = useDashboard(eventId);
  const assistantOpen = useUIStore((s) => s.assistantOpen);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[12px]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ShieldAlert}
          title="Failed to load dashboard"
          description="Something went wrong. Please try again."
          action="Retry"
          onAction={refetch}
        />
      </div>
    );
  }

  const {
    event, readiness, subEvents, pendingTasks,
    topRisks, vendorSummary, pendingSuggestions,
  } = data || {};

  const doneTasks = pendingTasks?.filter((t) => t.status === 'done').length || 0;
  const totalTasks = pendingTasks?.length || 0;

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all duration-200 ${assistantOpen ? 'pr-[380px]' : ''}`}>
      {/* Event title + status */}
      {event && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8]">{event.type} · {event.city}</p>
            <h1 className="text-lg font-bold text-[#0F172A]">{event.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Pill color="info" size="sm" dot>{event.status}</Pill>
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Calendar size={12} />
              <span>{formatDate(event.startDate)} – {formatDate(event.endDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness"
          value={`${readiness?.score || 0}%`}
          sub={`${readiness?.completedChecks || 0} of ${readiness?.totalChecks || 0} checks`}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          label="Pending tasks"
          value={totalTasks - doneTasks}
          sub={`${doneTasks} done`}
          icon={CheckSquare}
          color="info"
        />
        <StatCard
          label="Open risks"
          value={topRisks?.length || 0}
          sub="Needs attention"
          icon={AlertTriangle}
          color={topRisks?.length > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Vendors"
          value={vendorSummary?.total || 0}
          sub={`${vendorSummary?.confirmed || 0} confirmed`}
          icon={Building2}
          color="success"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Needs attention */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            {topRisks?.length > 0 && (
              <Pill color="danger" size="xs">{topRisks.length} open</Pill>
            )}
          </CardHeader>
          <AttentionList risks={topRisks} />
        </Card>

        {/* Sub-event timeline */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sub-event Timeline</CardTitle>
            <Calendar size={14} className="text-[#94A3B8]" />
          </CardHeader>
          <SubEventTimeline subEvents={subEvents} />
        </Card>

        {/* Upcoming tasks */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CheckSquare size={14} className="text-[#94A3B8]" />
          </CardHeader>
          <DeadlineList tasks={pendingTasks} />
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vendor board */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <Building2 size={14} className="text-[#94A3B8]" />
          </CardHeader>
          <VendorBoard vendorSummary={vendorSummary} />
        </Card>

        {/* Guest summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Guests</CardTitle>
            <Users size={14} className="text-[#94A3B8]" />
          </CardHeader>
          <GuestSummary event={event} />
        </Card>

        {/* Budget */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <DollarSign size={14} className="text-[#94A3B8]" />
          </CardHeader>
          <BudgetBar budget={event?.budget} />
        </Card>
      </div>

      {/* AI Suggestions */}
      {pendingSuggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-[#4F46E5]" />
              <CardTitle>AI Suggestions</CardTitle>
            </div>
            <Pill color="accent" size="xs">{pendingSuggestions.length} pending</Pill>
          </CardHeader>
          <SuggestionsList suggestions={pendingSuggestions} />
        </Card>
      )}

      {/* Floating assistant panel */}
      <AssistantPanel />
    </div>
  );
}
