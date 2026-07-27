import { Suspense } from 'react';
import { AnalyticsClient } from '@/components/dashboards/AnalyticsClient';

type Props = { params: Promise<{ id: string }> };

export default async function AnalyticsPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <Suspense
        fallback={
          <div className="p-8 text-sm text-muted-foreground">Loading analytics…</div>
        }
      >
        <AnalyticsClient workspaceId={id} />
      </Suspense>
    </div>
  );
}
