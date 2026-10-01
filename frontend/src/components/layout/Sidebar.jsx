import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Building2, Users, ShieldAlert,
  Calendar, Activity, ChevronLeft, ChevronRight, Sparkles, LogOut,
  CalendarDays,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { authApi } from '../../api/auth';

const EVENT_NAV = [
  { label: 'Dashboard', path: 'dashboard', Icon: LayoutDashboard },
  { label: 'Tasks', path: 'tasks', Icon: CheckSquare },
  { label: 'Vendors', path: 'vendors', Icon: Building2 },
  { label: 'Guests', path: 'guests', Icon: Users },
  { label: 'Risks', path: 'risks', Icon: ShieldAlert },
  { label: 'Timeline', path: 'timeline', Icon: Calendar },
  { label: 'Activity', path: 'activity', Icon: Activity },
];

export function Sidebar() {
  const { id: eventId } = useParams();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#1E1B4B] transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white text-sm font-semibold leading-none">Xperience</span>
            <span className="text-white/40 text-[10px] block mt-0.5">AI Event Planner</span>
          </div>
        )}
      </div>

      {/* Events link */}
      <div className="px-2 pt-3 flex-shrink-0">
        {!collapsed && (
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5">
            My Events
          </p>
        )}
        <NavLink
          to="/events"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/7 hover:text-white',
              collapsed && 'justify-center',
            )
          }
        >
          <CalendarDays size={16} className="flex-shrink-0" />
          {!collapsed && 'All Events'}
        </NavLink>
      </div>

      {/* Event-level nav */}
      {eventId && (
        <nav className="flex-1 px-2 pt-4 overflow-y-auto">
          {!collapsed && (
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5">
              This Event
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {EVENT_NAV.map(({ label, path, Icon }) => (
              <li key={path}>
                <NavLink
                  to={`/events/${eventId}/${path}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-[rgba(99,102,241,0.25)] text-white'
                        : 'text-white/60 hover:bg-white/7 hover:text-white',
                      collapsed && 'justify-center',
                    )
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {!eventId && <div className="flex-1" />}

      {/* Bottom actions */}
      <div className="px-2 pb-4 flex-shrink-0 border-t border-white/10 pt-3 flex flex-col gap-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/7 transition-colors w-full',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white/30 hover:text-white/60 transition-colors w-full',
            collapsed && 'justify-center',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : <><ChevronLeft size={15} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
