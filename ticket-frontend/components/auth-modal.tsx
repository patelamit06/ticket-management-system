'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, register as registerApi } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { PasswordInput } from '@/components/password-input';
import { inputClass, selectClass } from '@/lib/input-styles';
import { DEFAULT_PHONE_DIAL_CODE, FALLBACK_COUNTRIES } from '@/lib/phone-codes';
import { fetchCountries } from '@/lib/countries-api';
import { useEffect, useRef, useState } from 'react';

type CountryOption = { code: string; label: string };

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    countryCode: z.string().min(1, 'Country code is required'),
    phoneNumber: z.string().min(6, 'Phone number is required (digits only)').regex(/^[\d\s-]+$/, 'Use only digits, spaces, or hyphens'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export function AuthModal() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { isOpen, mode, close, openLogin, openSignup } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<CountryOption[]>(FALLBACK_COUNTRIES);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    fetchCountries()
      .then((list) => {
        if (list.length > 0) setCountries(list);
      })
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      countryCode: DEFAULT_PHONE_DIAL_CODE,
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) close();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  async function onLoginSubmit(data: LoginFormData) {
    try {
      const res = await login(data.email, data.password);
      setUser(res.user);
      close();
      router.push('/');
      router.refresh();
    } catch (e) {
      loginForm.setError('root', { message: e instanceof Error ? e.message : 'Login failed' });
    }
  }

  async function onSignupSubmit(data: SignupFormData) {
    const phone = data.countryCode + data.phoneNumber.replace(/\D/g, '');
    try {
      const res = await registerApi(data.email, data.password, data.name, phone);
      setUser(res.user);
      close();
      router.push('/');
      router.refresh();
    } catch (e) {
      signupForm.setError('root', { message: e instanceof Error ? e.message : 'Registration failed' });
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'login' ? (
          <>
            <h2 id="auth-modal-title" className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
              Log in
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and password to continue.</p>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-6 space-y-4">
              {loginForm.formState.errors.root && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {loginForm.formState.errors.root.message}
                </p>
              )}
              <div>
                <label htmlFor="auth-modal-email" className="mb-1 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="auth-modal-email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="auth-modal-password" className="mb-1 block text-sm font-medium text-foreground">
                  Password
                </label>
                <PasswordInput
                  id="auth-modal-password"
                  autoComplete="current-password"
                  inputClassName={inputClass}
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="h-9 w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={openSignup} className="font-medium text-primary hover:underline">
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 id="auth-modal-title" className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
              Create an account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Create an account to discover events or create your own.</p>
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="mt-6 space-y-4">
              {signupForm.formState.errors.root && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {signupForm.formState.errors.root.message}
                </p>
              )}
              <div>
                <label htmlFor="auth-modal-name" className="mb-1 block text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="auth-modal-name"
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  {...signupForm.register('name')}
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-destructive">{signupForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Phone
                </label>
                <div className="flex gap-2">
                  <select
                    id="auth-modal-country-code"
                    className={`${selectClass} w-32`}
                    {...signupForm.register('countryCode')}
                    disabled={countriesLoading}
                  >
                    {countries.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="auth-modal-phone"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="e.g. 9876543210"
                    className={inputClass}
                    {...signupForm.register('phoneNumber')}
                  />
                </div>
                {signupForm.formState.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-destructive">{signupForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="auth-modal-signup-email" className="mb-1 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="auth-modal-signup-email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  {...signupForm.register('email')}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="auth-modal-signup-password" className="mb-1 block text-sm font-medium text-foreground">
                  Password
                </label>
                <PasswordInput
                  id="auth-modal-signup-password"
                  autoComplete="new-password"
                  inputClassName={inputClass}
                  {...signupForm.register('password')}
                />
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="auth-modal-confirm-password"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Confirm password
                </label>
                <PasswordInput
                  id="auth-modal-confirm-password"
                  autoComplete="new-password"
                  inputClassName={inputClass}
                  {...signupForm.register('confirmPassword')}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={signupForm.formState.isSubmitting}
                className="h-9 w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {signupForm.formState.isSubmitting ? 'Creating account…' : 'Sign up'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button type="button" onClick={openLogin} className="font-medium text-primary hover:underline">
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
