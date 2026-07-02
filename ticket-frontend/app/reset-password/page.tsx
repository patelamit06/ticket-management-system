'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { PasswordInput } from '@/components/password-input';
import { inputClass } from '@/lib/input-styles';

const schema = z
  .object({
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(data: FormData) {
    try {
      await resetPassword(token, data.password);
      setTimeout(() => router.push('/login'), 1500);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Reset failed' });
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Reset password</h1>
      {!token ? (
        <>
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This reset link is missing its token. Please request a new one.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Request a new link
            </Link>
          </p>
        </>
      ) : isSubmitSuccessful && !errors.root ? (
        <>
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
            Your password has been reset. Redirecting you to log in…
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in now
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {errors.root && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.root.message}
              </p>
            )}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                New password
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
                Confirm new password
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
              {isSubmitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
