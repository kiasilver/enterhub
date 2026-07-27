import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessBoard } from '@/lib/board-access';
import { hasPermission } from '@/lib/rbac';
import { BoardShell } from '@/components/workspace/BoardShell';
import { BoardKanban } from '@/components/workspace/BoardKanban';

type Props = { params: Promise<{ id: string }> };

export default async function BoardPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const { id } = await params;
  const access = await canAccessBoard(session.user.id, id);
  if (!access.ok) notFound();

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, name: true, workspaceId: true },
  });
  if (!board) notFound();

  const canSettings = await hasPermission(
    session.user.id,
    board.workspaceId,
    'board:settings'
  );

  return (
    <BoardShell
      workspaceId={board.workspaceId}
      boardId={board.id}
      boardName={board.name}
      canSettings={canSettings && access.via === 'member'}
      guestMode={access.via === 'guest'}
    >
      <BoardKanban
        boardId={board.id}
        workspaceId={board.workspaceId}
        readOnly={access.via === 'guest' || Boolean(session.user.impersonating)}
        guestLevel={access.via === 'guest' ? access.guestLevel : undefined}
      />
    </BoardShell>
  );
}
