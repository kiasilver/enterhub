'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceCalendarClient } from '@/components/calendar/WorkspaceCalendarClient';

export default function WorkspaceCalendarPage() {
  const params = useParams();
  return (
    <Suspense fallback={null}>
      <WorkspaceCalendarClient workspaceId={String(params.id)} />
    </Suspense>
  );
}
