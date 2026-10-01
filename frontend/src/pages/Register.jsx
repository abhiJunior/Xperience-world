import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUIStore } from '../store/uiStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth({ user: res.user, accessToken: res.accessToken });
      toast.success('Account created!', 'Welcome to Xperience.');
      navigate('/events', { replace: true });
    } catch (err) {
      setError('root', { message: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4F46E5]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#4F46E5]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[#0F172A]">Xperience</span>
        </div>

        <div className="bg-white border border-[#E8EAEE] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
          <h1 className="text-xl font-semibold text-[#0F172A] mb-1">Create your account</h1>
          <p className="text-sm text-[#94A3B8] mb-6">
            Start planning smarter with AI-powered event management.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full name"
              type="text"
              id="name"
              placeholder="Alex Johnson"
              icon={User}
              error={errors.name?.message}
              autoComplete="name"
              {...register('name')}
            />
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
            <Input
              label="Password"
              type="password"
              id="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              icon={Lock}
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />

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
              Create account
            </Button>
          </form>

          <p className="text-xs text-center text-[#94A3B8] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4F46E5] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
