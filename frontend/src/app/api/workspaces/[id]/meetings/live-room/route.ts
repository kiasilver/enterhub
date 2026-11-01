import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/rbac';

type Ctx = { params: Promise<{ id: string }> };

const LIVE_IREG_URL = (
  process.env.LIVE_IREG_URL || 'https://live.ireg.fun'
).replace(/\/$/, '');

type CachedRoom = {
  roomId: string;
  hostToken: string;
  createdAt: number;
};

const roomCache = new Map<string, CachedRoom>();
const CACHE_MS = 12 * 60 * 60 * 1000;

function slugFor(workspaceId: string, chatRoomId?: string) {
  return `eh-${workspaceId.slice(-8)}-${(chatRoomId || 'meet').slice(-8)}`
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '');
}

function urls(
  roomId: string,
  hostName: string,
  hostToken: string | null,
  mode: 'meeting' | 'live',
) {
  const qs = new URLSearchParams();
  if (hostToken) {
    qs.set('host', '1');
    qs.set('hostToken', hostToken);
  }
  qs.set('name', hostName);
  qs.set('mode', mode);
  const path = `/r/${encodeURIComponent(roomId)}?${qs.toString()}`;
  return {
    url: `${LIVE_IREG_URL}${path}`,
    embedUrl: `${LIVE_IREG_URL}${path}`,
    guestUrl: `${LIVE_IREG_URL}/r/${encodeURIComponent(roomId)}?name=${encodeURIComponent(hostName)}&mode=${mode}`,
  };
}

/**
 * Create or reuse a live.ireg meeting / live-stream room for this chat.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    chatRoomId?: string;
    title?: string;
    hostName?: string;
    mode?: 'meeting' | 'live';
  };
  const hostName = (
    body.hostName ||
    session.user.name ||
    session.user.email ||
    'Host'
  ).slice(0, 40);
  const title = (body.title || 'Enterhub meeting').slice(0, 80);
  const mode = body.mode === 'live' ? 'live' : 'meeting';
  const slug = slugFor(workspaceId, body.chatRoomId);
  const cacheKey = `${workspaceId}:${body.chatRoomId || 'meet'}`;

  const cached = roomCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_MS) {
    return NextResponse.json({
      data: {
        provider: 'live.ireg',
        roomId: cached.roomId,
        hostToken: cached.hostToken,
        title,
        mode,
        ...urls(cached.roomId, hostName, cached.hostToken, mode),
      },
    });
  }

  try {
    const create = await fetch(`${LIVE_IREG_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: slug,
        hostName,
        isPrivate: false,
      }),
    });
    const json = (await create.json().catch(() => ({}))) as {
      error?: string;
      room?: { id: string; title: string };
      hostToken?: string;
    };

    if (create.ok && json.room?.id) {
      const hostToken = json.hostToken || '';
      roomCache.set(cacheKey, {
        roomId: json.room.id,
        hostToken,
        createdAt: Date.now(),
      });
      return NextResponse.json({
        data: {
          provider: 'live.ireg',
          roomId: json.room.id,
          hostToken,
          title,
          mode,
          ...urls(json.room.id, hostName, hostToken, mode),
        },
      });
    }

    // Room already exists on live.ireg — join as guest (or host if we still have cache).
    const existing = await fetch(
      `${LIVE_IREG_URL}/api/rooms/${encodeURIComponent(slug)}`,
    );
    if (existing.ok) {
      const ex = (await existing.json().catch(() => ({}))) as { id?: string };
      const roomId = ex.id || slug;
      return NextResponse.json({
        data: {
          provider: 'live.ireg',
          roomId,
          hostToken: '',
          title,
          mode,
          ...urls(roomId, hostName, null, mode),
        },
      });
    }

    return NextResponse.json(
      { error: json.error || 'Could not create live room' },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: 'live.ireg is unreachable' },
      { status: 502 },
    );
  }
}
