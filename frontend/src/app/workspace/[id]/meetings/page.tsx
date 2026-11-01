'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function MeetingsRedirect() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const workspaceId = String(params.id);
  const withId = search.get('with') || search.get('meet');

  useEffect(() => {
    const q = withId ? `?meet=${encodeURIComponent(withId)}` : '';
    router.replace(`/workspace/${workspaceId}/chat${q}`);
  }, [router, workspaceId, withId]);

  return null;
}

export default function WorkspaceMeetingsPage() {
  return (
    <Suspense fallback={null}>
      <MeetingsRedirect />
    </Suspense>
  );
}
