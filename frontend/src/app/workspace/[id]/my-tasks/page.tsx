import { Suspense } from 'react';
import { MyTasksClient } from '@/components/dashboards/MyTasksClient';

type Props = { params: Promise<{ id: string }> };

export default async function MyTasksPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <MyTasksClient workspaceId={id} />
    </Suspense>
  );
}
