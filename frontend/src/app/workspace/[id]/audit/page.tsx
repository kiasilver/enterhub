import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function AuditRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/workspace/${id}/settings/audit`);
}
