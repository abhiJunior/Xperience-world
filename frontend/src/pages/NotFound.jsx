import { Link } from 'react-router-dom';
import { Home, CalendarDays } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-8xl font-black text-[#E8EAEE] mb-2 select-none">404</p>
        <h1 className="text-lg font-semibold text-[#0F172A] mb-2">Page not found</h1>
        <p className="text-sm text-[#94A3B8] mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="secondary" size="sm" icon={Home}>Go home</Button>
          </Link>
          <Link to="/events">
            <Button variant="primary" size="sm" icon={CalendarDays}>My Events</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
