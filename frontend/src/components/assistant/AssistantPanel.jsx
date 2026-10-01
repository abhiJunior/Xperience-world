import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Send, Sparkles, CheckCircle2, XCircle, Zap, ChevronRight,
  RefreshCw, AlertCircle, Lightbulb,
} from 'lucide-react';
import { chatApi } from '../../api/chat';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { formatRelative } from '../../utils/formatters';
import { SUGGESTION_CHIPS } from '../../utils/constants';
import { cn } from '../../utils/cn';

// ── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
        <Sparkles size={11} className="text-[#4F46E5]" />
      </div>
      <div className="bg-white border border-[#E8EAEE] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, eventId }) {
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const isUser = msg.role === 'user';

  const confirmMutation = useMutation({
    mutationFn: ({ actionId }) => chatApi.confirmAction(eventId, actionId, {}),
    onSuccess: () => {
      // Invalidate everything after action applied
      ['dashboard', 'tasks', 'vendors', 'risks', 'suggestions', 'guests', 'subEvents', 'events'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key, eventId] });
      });
      queryClient.invalidateQueries({ queryKey: ['chat', eventId] });
      toast.success('Action applied');
    },
    onError: (err) => toast.error('Failed to apply action', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ actionId }) => chatApi.rejectAction(eventId, actionId, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', eventId] });
      toast.info('Action dismissed');
    },
  });

  return (
    <div className={cn('flex items-end gap-2 animate-slide-in-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
        isUser ? 'bg-[#4F46E5] text-white' : 'bg-[#EEF2FF] text-[#4F46E5]',
      )}>
        {isUser ? 'Y' : <Sparkles size={10} />}
      </div>

      <div className="max-w-[85%] flex flex-col gap-2">
        {/* Text bubble */}
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
          isUser
            ? 'bg-[#4F46E5] text-white rounded-br-sm'
            : 'bg-white border border-[#E8EAEE] text-[#0F172A] rounded-bl-sm',
        )}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Timestamp */}
        {(msg.createdAt || msg.timestamp) && (
          <p className={cn('text-[10px] text-[#94A3B8]', isUser && 'text-right')}>
            {formatRelative(msg.createdAt || msg.timestamp)}
          </p>
        )}

        {/* Applied actions */}
        {msg.appliedActions?.map((action, idx) => {
          const actId = action.actionId || action.id || action._id || `applied-${idx}`;
          return (
            <div
              key={actId}
              className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-3 py-2.5 flex items-start gap-2"
            >
              <CheckCircle2 size={13} className="text-[#16A34A] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#16A34A]">Applied: {action.type}</p>
                {action.description && (
                  <p className="text-[10px] text-[#475569] mt-0.5">{action.description}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Pending actions */}
        {msg.pendingActions?.map((action, idx) => {
          const actId = action.actionId || action.id || action._id || `pending-${idx}`;
          const isConfirming = confirmMutation.isPending && confirmMutation.variables?.actionId === actId;
          const isRejecting = rejectMutation.isPending && rejectMutation.variables?.actionId === actId;
          return (
            <div
              key={actId}
              className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3 py-2.5"
            >
              <div className="flex items-start gap-2 mb-2">
                <Zap size={13} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#D97706]">Pending: {action.type}</p>
                  {action.description && (
                    <p className="text-[10px] text-[#475569] mt-0.5">{action.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="success"
                  loading={isConfirming}
                  disabled={isConfirming || isRejecting}
                  onClick={() => confirmMutation.mutate({ actionId: actId })}
                >
                  Confirm
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  loading={isRejecting}
                  disabled={isConfirming || isRejecting}
                  onClick={() => rejectMutation.mutate({ actionId: actId })}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat Input ──────────────────────────────────────────────────────────────
function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const send = () => {
    const msg = value.trim();
    if (!msg || loading) return;
    onSend(msg);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="border-t border-[#E8EAEE] p-3 bg-white">
      <div className="flex items-end gap-2 bg-[#F8F9FB] border border-[#E8EAEE] rounded-xl px-3 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI anything about your event…"
          rows={1}
          className="flex-1 bg-transparent text-xs text-[#0F172A] placeholder:text-[#94A3B8] resize-none outline-none leading-relaxed min-h-[20px]"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!value.trim() || loading}
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            value.trim() && !loading
              ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
              : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed',
          )}
          aria-label="Send message"
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send size={13} />
          }
        </button>
      </div>
    </div>
  );
}

// ── Suggestion Chips ────────────────────────────────────────────────────────
function SuggestionChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {SUGGESTION_CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="flex items-center gap-1 text-[10px] font-medium text-[#475569] bg-white border border-[#E8EAEE] rounded-full px-2.5 py-1 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
        >
          <Lightbulb size={9} />
          {chip}
        </button>
      ))}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export function AssistantPanel() {
  const { id: eventId } = useParams();
  const assistantOpen = useUIStore((s) => s.assistantOpen);
  const closeAssistant = useUIStore((s) => s.closeAssistant);
  const toast = useUIStore((s) => s.toast);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chat', eventId],
    queryFn: () => chatApi.getHistory(eventId, { limit: 50 }),
    enabled: !!eventId && assistantOpen,
  });

  const messages = historyData?.messages || historyData || [];

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages, isTyping]);

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: (message) => chatApi.sendMessage(eventId, { message }),
    onSuccess: () => {
      setOptimisticMessages([]);
      setIsTyping(false);
      // Invalidate dashboard & related queries
      ['dashboard', 'tasks', 'vendors', 'risks', 'suggestions', 'guests', 'subEvents', 'events'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key, eventId] });
      });
      queryClient.invalidateQueries({ queryKey: ['chat', eventId] });
    },
    onError: (err) => {
      setOptimisticMessages([]);
      setIsTyping(false);
      toast.error('Message failed', err.message);
    },
  });

  const handleSend = (message) => {
    // Optimistic user message
    setOptimisticMessages([{
      _id: `opt-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }]);
    setIsTyping(true);
    sendMutation.mutate(message);
  };

  if (!assistantOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={closeAssistant} aria-hidden="true" />

      <div
        role="dialog"
        aria-label="AI Assistant"
        aria-modal="true"
        className="fixed z-40 flex flex-col bg-[#F8F9FB] border-l border-[#E8EAEE] shadow-[-4px_0_24px_0_rgba(0,0,0,0.08)] animate-slide-in-right
          inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[360px]"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#E8EAEE] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
            <Sparkles size={13} className="text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#0F172A]">AI Assistant</p>
            <p className="text-[10px] text-[#94A3B8]">Powered by Xperience AI</p>
          </div>
        </div>
        <button
          onClick={closeAssistant}
          className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded-md transition-colors"
          aria-label="Close assistant"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw size={18} className="text-[#94A3B8] animate-spin" />
          </div>
        ) : messages.length === 0 && optimisticMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4 py-10">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-[#4F46E5]" />
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">Start a conversation</p>
            <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
              Ask anything about your event. I can help you plan, track, and optimize.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg._id} msg={msg} eventId={eventId} />
            ))}
            {optimisticMessages.map((msg) => (
              <MessageBubble key={msg._id} msg={msg} eventId={eventId} />
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {!isTyping && <SuggestionChips onSelect={handleSend} />}

      {/* Input */}
      <ChatInput onSend={handleSend} loading={sendMutation.isPending || isTyping} />
      </div>
    </>
  );
}
