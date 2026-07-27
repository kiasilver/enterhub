'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceChatClient } from '@/components/workspace/WorkspaceChatClient';

export default function WorkspaceChatPage() {
  const params = useParams();
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full overflow-hidden">
      <Suspense fallback={null}>
        <WorkspaceChatClient workspaceId={String(params.id)} />
      </Suspense>
    </div>
  );
}
