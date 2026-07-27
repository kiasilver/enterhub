'use client';

import { WorkspaceAccountClient } from '@/components/account/WorkspaceAccountClient';

export default function WorkspaceAccountPage() {
  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <WorkspaceAccountClient />
    </div>
  );
}
