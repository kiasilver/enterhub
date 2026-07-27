import { Suspense } from 'react';
import { DepartmentsHubClient } from '@/components/departments/DepartmentsHubClient';

type Props = { params: Promise<{ id: string }> };

export default async function DepartmentsPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <DepartmentsHubClient workspaceId={id} />
    </Suspense>
  );
}
