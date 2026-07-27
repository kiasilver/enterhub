'use client';

import { useParams } from 'next/navigation';
import { TeamDirectoryClient } from '@/components/workspace/TeamDirectoryClient';

export default function TeamPage() {
  const params = useParams();
  return <TeamDirectoryClient workspaceId={String(params.id)} />;
}
