'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Redirecting"
    >
      <div className="text-center">
        <div
          className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
