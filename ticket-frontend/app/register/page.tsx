'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { register as registerApi } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { SiteHeader } from '@/components/site-header';
import { PasswordInput } from '@/components/password-input';
import { inputClass, selectClass } from '@/lib/input-styles';
import { DEFAULT_PHONE_DIAL_CODE, FALLBACK_COUNTRIES } from '@/lib/phone-codes';
import { fetchCountries } from '@/lib/countries-api';

type CountryOption = { code: string; label: string };

const schema = z
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

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
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

  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      countryCode: DEFAULT_PHONE_DIAL_CODE,
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: FormData) {
    const phone = data.countryCode + data.phoneNumber.replace(/\D/g, '');
    try {
      const res = await registerApi(data.email, data.password, data.name, phone);
      setUser(res.user);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Registration failed' });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an account to discover events or create your own.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {errors.root && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.root.message}
              </p>
            )}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={inputClass}
                {...registerField('name')}
              />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Phone
              </label>
              <div className="flex gap-2">
                <select
                  id="countryCode"
                  className={`${selectClass} w-32`}
                  {...registerField('countryCode')}
                  disabled={countriesLoading}
                >
                  {countries.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel-national"
                  placeholder="e.g. 9876543210"
                  className={inputClass}
                  {...registerField('phoneNumber')}
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputClass}
                {...registerField('email')}
              />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                Password
              </label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                inputClassName={inputClass}
                {...registerField('password')}
              />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">
                Confirm password
              </label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                inputClassName={inputClass}
                {...registerField('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {isSubmitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
