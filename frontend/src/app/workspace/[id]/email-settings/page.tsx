import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function EmailSettingsRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/workspace/${id}/settings/email`);
}
