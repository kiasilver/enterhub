'use client';

import { WorkspaceSettingsNav } from '@/components/workspace/WorkspaceSettingsNav';
import { useParams } from 'next/navigation';

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceId = String(params.id);

  return (
    <div className="w-full max-w-5xl 3xl:max-w-6xl 4xl:max-w-7xl mx-auto space-y-5 min-w-0">
      <WorkspaceSettingsNav workspaceId={workspaceId} />
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}
