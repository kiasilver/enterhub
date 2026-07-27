'use client';

import { useParams } from 'next/navigation';
import { WorkspaceEmailClient } from '@/components/workspace/WorkspaceEmailClient';

export default function WorkspaceEmailPage() {
  const params = useParams();
  return (
    <div className="h-full w-full min-h-0">
      <WorkspaceEmailClient workspaceId={String(params.id)} />
    </div>
  );
}
