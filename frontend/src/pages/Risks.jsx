import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, RefreshCw, CheckCircle2, Eye, XCircle,
  Lightbulb, ChevronDown, ChevronUp, Search, Zap,
  AlertTriangle,
} from 'lucide-react';
import { risksApi } from '../api/risks';
import { suggestionsApi } from '../api/suggestions';
import { chatApi } from '../api/chat';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Tabs } from '../components/ui/Tabs';
import { Input, Textarea } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../store/uiStore';
import { AssistantPanel } from '../components/assistant/AssistantPanel';
import { RISK_SEVERITY_COLORS, RISK_STATUS_LABELS } from '../utils/constants';
import { formatRelative } from '../utils/formatters';

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useRisks(eventId) {
  return useQuery({
    queryKey: ['risks', eventId],
    queryFn: () => risksApi.list(eventId),
    enabled: !!eventId,
  });
}

function useSuggestions(eventId) {
  return useQuery({
    queryKey: ['suggestions', eventId],
    queryFn: () => suggestionsApi.list(eventId),
    enabled: !!eventId,
  });
}

// ── Risk Card ─────────────────────────────────────────────────────────────────
function RiskCard({ risk, eventId }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const [expanded, setExpanded] = useState(false);

  const severity = risk.severity;
  const sevColor = RISK_SEVERITY_COLORS[severity] || 'slate';

  const statusMutation = useMutation({
    mutationFn: ({ status }) => risksApi.updateStatus(eventId, risk._id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['risks', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', eventId] });
      toast.success(`Risk ${RISK_STATUS_LABELS[status].toLowerCase()}`);
    },
    onError: (err) => toast.error('Failed to update risk', err.message),
  });

  return (
    <div className="bg-white border border-[#E8EAEE] rounded-xl p-4 hover:border-[#D1D5DB] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            severity === 'critical' ? 'bg-[#FEF2F2]'
            : severity === 'high' ? 'bg-[#FFFBEB]'
            : severity === 'medium' ? 'bg-[#F0F9FF]'
            : 'bg-[#F0FDF4]'
          }`}>
            <ShieldAlert size={14} className={
              severity === 'critical' ? 'text-[#DC2626]'
              : severity === 'high' ? 'text-[#D97706]'
              : severity === 'medium' ? 'text-[#0284C7]'
              : 'text-[#16A34A]'
            } />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-xs font-semibold text-[#0F172A]">{risk.title}</p>
              <Pill color={sevColor} size="xs">{severity}</Pill>
              <Pill color={risk.status === 'open' ? 'danger' : 'slate'} size="xs" dot>
                {RISK_STATUS_LABELS[risk.status]}
              </Pill>
            </div>
            {risk.explanation && !expanded && (
              <p className="text-[11px] text-[#94A3B8] line-clamp-2">{risk.explanation}</p>
            )}
            {expanded && (
              <>
                {risk.explanation && (
                  <p className="text-[11px] text-[#475569] leading-relaxed mb-2">{risk.explanation}</p>
                )}
                {risk.suggestedActions?.length > 0 && (
                  <div className="bg-[#F8F9FB] rounded-lg px-3 py-2 mt-2">
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">Suggested actions</p>
                    <ul className="flex flex-col gap-1">
                      {risk.suggestedActions.map((a, i) => (
                        <li key={i} className="text-[11px] text-[#475569] flex items-start gap-1.5">
                          <span className="text-[#4F46E5] font-bold">{i + 1}.</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 text-[#94A3B8] hover:text-[#475569] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Actions */}
      {risk.status === 'open' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F0F1F4]">
          <Button
            size="xs"
            variant="secondary"
            icon={Eye}
            loading={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ status: 'acknowledged' })}
          >
            Acknowledge
          </Button>
          <Button
            size="xs"
            variant="success"
            icon={CheckCircle2}
            loading={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ status: 'resolved' })}
          >
            Resolve
          </Button>
          <Button
            size="xs"
            variant="ghost"
            icon={XCircle}
            loading={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ status: 'dismissed' })}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Suggestion Card ───────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, eventId }) {
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const acceptMutation = useMutation({
    mutationFn: () => suggestionsApi.accept(eventId, suggestion._id),
    onSuccess: () => {
      ['suggestions', 'tasks', 'vendors', 'dashboard'].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k, eventId] }),
      );
      toast.success('Suggestion accepted');
    },
    onError: (err) => toast.error('Failed to accept', err.message),
  });

  const dismissMutation = useMutation({
    mutationFn: () => suggestionsApi.dismiss(eventId, suggestion._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', eventId] });
      toast.info('Suggestion dismissed');
    },
  });

  return (
    <div className="bg-white border border-[#E8EAEE] rounded-xl p-4 hover:border-[#C7D2FE] transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb size={14} className="text-[#4F46E5]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#0F172A] mb-0.5">{suggestion.title}</p>
          {suggestion.reason && (
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">{suggestion.reason}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="primary"
          loading={acceptMutation.isPending}
          onClick={() => acceptMutation.mutate()}
        >
          Accept
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => dismissMutation.mutate()}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ── What-If Input ─────────────────────────────────────────────────────────────
function WhatIfInput({ eventId }) {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState(null);

  const whatIfMutation = useMutation({
    mutationFn: (scenario) => chatApi.whatIf(eventId, { scenario }),
    onSuccess: (data) => setResult(data),
    onError: (err) => {
      const { toast } = useUIStore.getState();
      toast.error('What-if failed', err.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#D97706]" />
          <CardTitle>What-if Scenario</CardTitle>
        </div>
        <Pill color="warning" size="xs">Simulation only</Pill>
      </CardHeader>

      <div className="flex flex-col gap-3">
        <Textarea
          id="whatif-scenario"
          placeholder='e.g. "What if the venue cancels 2 weeks before the event?"'
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          rows={3}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={Zap}
          loading={whatIfMutation.isPending}
          disabled={scenario.trim().length < 5}
          onClick={() => whatIfMutation.mutate(scenario)}
        >
          Analyze Impact
        </Button>

        {result && (
          <div className="mt-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 animate-slide-in-up">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-[#D97706]">Projected Impact (not saved)</p>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">
              {typeof result === 'string' ? result : result?.analysis || JSON.stringify(result, null, 2)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RisksPage() {
  const { id: eventId } = useParams();
  const [tab, setTab] = useState('risks');
  const [filterSev, setFilterSev] = useState('');
  const assistantOpen = useUIStore((s) => s.assistantOpen);
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const { data: riskData, isLoading: risksLoading } = useRisks(eventId);
  const { data: suggData, isLoading: suggsLoading } = useSuggestions(eventId);

  const risks = Array.isArray(riskData) ? riskData : (riskData?.risks || []);
  const suggestions = Array.isArray(suggData) ? suggData : (suggData?.suggestions || []);

  const scanMutation = useMutation({
    mutationFn: () => risksApi.scan(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', eventId] });
      toast.success('Risk scan complete');
    },
    onError: (err) => toast.error('Scan failed', err.message),
  });

  const openRisks = risks.filter((r) => r.status === 'open');
  const filteredRisks = filterSev ? risks.filter((r) => r.severity === filterSev) : risks;
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

  const tabs = [
    { label: 'Risks', value: 'risks', count: openRisks.length },
    { label: 'Suggestions', value: 'suggestions', count: pendingSuggestions.length },
    { label: 'What-if', value: 'whatif' },
  ];

  // Group risks by severity
  const bySeverity = ['critical', 'high', 'medium', 'low'].map((sev) => ({
    sev,
    items: filteredRisks.filter((r) => r.severity === sev),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={`p-6 flex flex-col gap-5 transition-all ${assistantOpen ? 'pr-[380px]' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">Risks & Suggestions</h1>
          <p className="text-xs text-[#94A3B8]">
            {openRisks.length} open risks · {pendingSuggestions.length} pending suggestions
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={scanMutation.isPending}
          onClick={() => scanMutation.mutate()}
        >
          Run Scan
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === 'risks' && (
        <>
          {/* Severity filter */}
          <div className="flex items-center gap-2">
            {['', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSev(sev)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterSev === sev
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-white border border-[#E8EAEE] text-[#475569] hover:border-[#4F46E5]'
                }`}
              >
                {sev || 'All'}
              </button>
            ))}
          </div>

          {risksLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filteredRisks.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No risks detected"
              description="Great news! Run a scan to check for potential issues."
              action="Run Scan"
              onAction={() => scanMutation.mutate()}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {bySeverity.map(({ sev, items }) => (
                <div key={sev}>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill color={RISK_SEVERITY_COLORS[sev]} size="xs" dot>{sev}</Pill>
                    <span className="text-xs text-[#94A3B8]">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((risk) => (
                      <RiskCard key={risk._id} risk={risk} eventId={eventId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'suggestions' && (
        <>
          {suggsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No pending suggestions"
              description="AI suggestions will appear here after events are analysed."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pendingSuggestions.map((s) => (
                <SuggestionCard key={s._id} suggestion={s} eventId={eventId} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'whatif' && <WhatIfInput eventId={eventId} />}

      <AssistantPanel />
    </div>
  );
}
