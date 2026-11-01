import { JoinInviteClient } from '@/components/join/JoinInviteClient';

type Props = { params: Promise<{ token: string }> };

export default async function JoinInvitePage({ params }: Props) {
  const { token } = await params;
  return <JoinInviteClient token={token} />;
}
