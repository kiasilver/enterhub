import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserPermissions, isWorkspaceMember } from '@/lib/rbac';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function WorkspaceLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/signin');
  }

  const { id } = await params;
  const ok = await isWorkspaceMember(session.user.id, id);
  if (!ok) {
    redirect('/signin');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!workspace) {
    redirect('/signin');
  }

  const permissions = await getUserPermissions(session.user.id, id);

  return (
    <Suspense fallback={null}>
      <WorkspaceShell
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        permissions={permissions}
        isSuperAdmin={Boolean(session.user.isSuperAdmin)}
        impersonating={Boolean(session.user.impersonating)}
      >
        {children}
      </WorkspaceShell>
    </Suspense>
  );
}
