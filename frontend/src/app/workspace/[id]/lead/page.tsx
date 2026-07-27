import { LeadDashboardClient } from '@/components/dashboards/LeadDashboardClient';

type Props = { params: Promise<{ id: string }> };

export default async function LeadPage({ params }: Props) {
  const { id } = await params;
  return <LeadDashboardClient workspaceId={id} />;
}
