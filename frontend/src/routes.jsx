import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/Skeleton';

// ── Page lazy imports ────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const EventsPage = lazy(() => import('./pages/Events'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const TasksPage = lazy(() => import('./pages/Tasks'));
const VendorsPage = lazy(() => import('./pages/Vendors'));
const GuestsPage = lazy(() => import('./pages/Guests'));
const RisksPage = lazy(() => import('./pages/Risks'));
const TimelinePage = lazy(() => import('./pages/Timeline'));
const ActivityPage = lazy(() => import('./pages/Activity'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — top-level shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />

          {/* Event-level pages */}
          <Route path="/events/:id/dashboard" element={<DashboardPage />} />
          <Route path="/events/:id/tasks" element={<TasksPage />} />
          <Route path="/events/:id/vendors" element={<VendorsPage />} />
          <Route path="/events/:id/guests" element={<GuestsPage />} />
          <Route path="/events/:id/risks" element={<RisksPage />} />
          <Route path="/events/:id/timeline" element={<TimelinePage />} />
          <Route path="/events/:id/activity" element={<ActivityPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
