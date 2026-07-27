import { Suspense } from 'react';
import { ProjectsDirectory } from '@/components/dashboards/ProjectsDirectory';

type Props = { params: Promise<{ id: string }> };

export default async function BoardsPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ProjectsDirectory workspaceId={id} />
    </Suspense>
  );
}
