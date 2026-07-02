'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestPasswordReset } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { inputClass } from '@/lib/input-styles';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: FormData) {
    try {
      await requestPasswordReset(data.email);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Something went wrong' });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Forgot password</h1>
          {isSubmitSuccessful && !errors.root ? (
            <>
              <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                If an account exists for that email, we&apos;ve sent password reset instructions. Please
                check your inbox.
              </p>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Back to log in
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {errors.root && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.root.message}
                  </p>
                )}
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
