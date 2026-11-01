import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessBoard } from '@/lib/board-access';
import { hasPermission } from '@/lib/rbac';
import { BoardShell } from '@/components/workspace/BoardShell';
import { BoardKanban } from '@/components/workspace/BoardKanban';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function BoardPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const { id } = await params;
  const { from } = await searchParams;
  const access = await canAccessBoard(session.user.id, id);
  if (!access.ok) notFound();

  const board = await prisma.board.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      visibility: true,
      department: { select: { id: true, key: true, name: true } },
    },
  });
  if (!board) notFound();

  if (access.via !== 'guest') {
    redirect(`/workspace/${board.workspaceId}/boards?view=list&mode=kanban`);
  }

  const canSettings = await hasPermission(
    session.user.id,
    board.workspaceId,
    'board:settings',
  );

  return (
    <BoardShell
      workspaceId={board.workspaceId}
      boardId={board.id}
      boardName={board.name}
      departmentKey={board.department?.key ?? 'general'}
      departmentName={board.department?.name ?? null}
      canSettings={canSettings && access.via === 'member'}
      guestMode
    >
      <BoardKanban
        boardId={board.id}
        workspaceId={board.workspaceId}
        boardName={board.name}
        visibility={board.visibility}
        department={board.department}
        from={from}
        readOnly={Boolean(session.user.impersonating)}
        guestLevel={access.guestLevel}
      />
    </BoardShell>
  );
}
