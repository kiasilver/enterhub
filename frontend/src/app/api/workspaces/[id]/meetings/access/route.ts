import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { canUseMeetings } from '@/lib/meeting-access';

type Params = { params: Promise<{ id: string }> };

/** GET — whether this workspace can start HD meetings */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const ok = await isWorkspaceMember(session.user.id, workspaceId);
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { planTier: true, name: true },
  });
  if (!ws) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const allowed = canUseMeetings(ws.planTier);
  return NextResponse.json({
    data: {
      allowed,
      planTier: ws.planTier,
      workspaceName: ws.name,
      features: allowed
        ? {
            audio: true,
            video: true,
            screenShare: true,
            screenShareQualities: ['720p', '1080p'],
            defaultVideoOff: true,
            maxParticipantsHint: ws.planTier === 'ENTERPRISE' ? 50 : 16,
          }
        : null,
      upgradeHint: allowed
        ? null
        : 'HD Meetings with screen share (720p / 1080p) are included on Base and Advanced plans.',
    },
  });
}
