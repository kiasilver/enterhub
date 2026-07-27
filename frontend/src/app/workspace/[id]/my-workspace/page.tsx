import { MyWorkspaceClient } from '@/components/dashboards/MyWorkspaceClient';

type Props = { params: Promise<{ id: string }> };

export default async function MyWorkspacePage({ params }: Props) {
  const { id } = await params;
  return <MyWorkspaceClient workspaceId={id} />;
}
