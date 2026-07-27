'use client';

import { useParams } from 'next/navigation';
import { EmployeeAnalyticsClient } from '@/components/dashboards/EmployeeAnalyticsClient';

export default function PersonAnalyticsPage() {
  const params = useParams();
  return (
    <EmployeeAnalyticsClient
      workspaceId={String(params.id)}
      userId={String(params.userId)}
    />
  );
}
