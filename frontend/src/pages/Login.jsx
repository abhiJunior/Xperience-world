import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUIStore } from '../store/uiStore';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/events';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth({ user: res.user, accessToken: res.accessToken });
      toast.success('Welcome back!', `Logged in as ${res.user.name || res.user.email}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError('root', { message: err.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4F46E5]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#4F46E5]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[#0F172A]">Xperience</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E8EAEE] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
          <h1 className="text-xl font-semibold text-[#0F172A] mb-1">Sign in</h1>
          <p className="text-sm text-[#94A3B8] mb-6">Welcome back to your AI event planner.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              id="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="mt-1.5 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors flex items-center gap-1"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPwd ? 'Hide' : 'Show'} password
              </button>
            </div>

            {errors.root && (
              <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Sign in
            </Button>
          </form>

          <p className="text-xs text-center text-[#94A3B8] mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-[#4F46E5] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
