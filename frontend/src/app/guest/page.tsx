'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GuestShell } from '@/components/guest/GuestShell';
import { GuestDashboardClient } from '@/components/guest/GuestDashboardClient';

export default function GuestPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
  }, [status, router]);

  if (status === 'loading') {
    return <p className="p-8">Loading…</p>;
  }

  return (
    <GuestShell>
      <GuestDashboardClient />
    </GuestShell>
  );
}
