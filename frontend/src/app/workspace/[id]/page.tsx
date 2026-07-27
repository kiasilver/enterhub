import { WorkspaceHomeClient } from '@/components/workspace/WorkspaceHomeClient';

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceHome({ params }: Props) {
  const { id } = await params;
  return <WorkspaceHomeClient workspaceId={id} />;
}
