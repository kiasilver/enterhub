import { Suspense } from 'react';
import DepartmentPageClient from '@/components/departments/DepartmentPageClient';

type Props = { params: Promise<{ id: string; deptId: string }> };

export default async function DepartmentPage({ params }: Props) {
  const { id, deptId } = await params;
  return (
    <Suspense fallback={null}>
      <DepartmentPageClient workspaceId={id} deptId={deptId} />
    </Suspense>
  );
}
