import { Outlet, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

export function AppShell({ title, subtitle, backTo }) {
  const { id: eventId } = useParams();
  const setActiveEventId = useUIStore((s) => s.setActiveEventId);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);

  useEffect(() => {
    setActiveEventId(eventId || null);
  }, [eventId, setActiveEventId]);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar?.();
  }, [eventId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FB]">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileSidebarOpen */}
      <div className={`
        fixed inset-y-0 left-0 z-40 lg:relative lg:flex lg:flex-shrink-0
        transition-transform duration-200
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} backTo={backTo} />

        {/* Page content — scrollable */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* Global notifications */}
      <ToastContainer />
    </div>
  );
}
