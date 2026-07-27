import { WorkTrendsClient } from '@/components/dashboards/WorkTrendsClient';

type Props = { params: Promise<{ id: string }> };

export default async function WorkTrendsPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <WorkTrendsClient workspaceId={id} />
    </div>
  );
}
