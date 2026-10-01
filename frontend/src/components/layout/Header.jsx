import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, ChevronLeft, Menu, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

// ── Derive a readable page title from the current URL path ───────────────────
function usePageTitle() {
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);
  // /events → "My Events"
  // /events/:id/dashboard → "Dashboard"
  // /events/:id/tasks → "Tasks"  etc.
  if (segments.length === 1 && segments[0] === 'events') return 'My Events';
  if (segments.length === 3) {
    const section = segments[2];
    const map = {
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      vendors: 'Vendors',
      guests: 'Guests',
      risks: 'Risks & Suggestions',
      timeline: 'Timeline',
      activity: 'Activity Log',
    };
    return map[section] || section;
  }
  return 'Xperience';
}

export function Header({ title, subtitle, backTo }) {
  const { id: eventId } = useParams();
  const user = useAuthStore((s) => s.user);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);
  const assistantOpen = useUIStore((s) => s.assistantOpen);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const navigate = useNavigate();
  const pageTitle = usePageTitle();

  const displayTitle = title || pageTitle;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase();

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#E8EAEE] flex-shrink-0 h-14"
      role="banner"
    >
      {/* Left: hamburger (mobile) + back + title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger — hidden on lg+ */}
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded-md transition-colors lg:hidden flex-shrink-0"
          aria-label="Open navigation menu"
          aria-expanded={false}
        >
          <Menu size={18} />
        </button>

        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] rounded-md transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="min-w-0">
          {displayTitle && (
            <h1 className="text-sm font-semibold text-[#0F172A] truncate leading-tight">
              {displayTitle}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-[#94A3B8] truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* AI Assistant toggle — only on event pages */}
        {eventId && (
          <button
            onClick={toggleAssistant}
            aria-pressed={assistantOpen}
            aria-label={assistantOpen ? 'Close AI assistant' : 'Open AI assistant'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              assistantOpen
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#475569] hover:bg-[#F8F9FB] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full bg-[#4F46E5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 cursor-default select-none"
          title={user?.name ? `${user.name} (${user.email})` : user?.email}
          role="img"
          aria-label={`User: ${user?.name || user?.email || 'Unknown'}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
