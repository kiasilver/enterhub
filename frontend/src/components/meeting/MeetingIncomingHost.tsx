'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import { MdCall, MdCallEnd } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { glassStyle, hexToRgba, textMuted, textPrimary } from '@/components/SafeDashboard/theme';

type Invite = {
  meetingId: string;
  from: { id: string; name: string; avatarUrl: string | null };
};

export function MeetingIncomingHost({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useSession();
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const router = useRouter();
  const isDark = theme === 'dark';
  const myId = session?.user?.id || '';
  const socketRef = useRef<Socket | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    if (!myId) return;
    const s = io({ path: '/socket.io' });
    socketRef.current = s;
    s.emit('workspace:join', { workspaceId });
    s.on(
      'meeting:invite',
      (p: { meetingId?: string; toUserId?: string; from?: Invite['from'] }) => {
        if (!p.meetingId || p.toUserId !== myId || !p.from?.id) return;
        if (p.from.id === myId) return;
        setInvite({ meetingId: p.meetingId, from: p.from });
      },
    );
    s.on('meeting:invite-cancel', (p: { meetingId?: string }) => {
      setInvite((cur) => (cur && cur.meetingId === p.meetingId ? null : cur));
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, myId]);

  if (!invite) return null;

  function decline() {
    socketRef.current?.emit('meeting:invite-decline', {
      workspaceId,
      meetingId: invite!.meetingId,
      fromUserId: myId,
    });
    setInvite(null);
  }

  function accept() {
    const fromId = invite!.from.id;
    setInvite(null);
    router.push(`/workspace/${workspaceId}/meetings?with=${fromId}&join=1`);
  }

  return (
    <div className="fixed z-[90] bottom-5 start-5 end-5 sm:end-auto sm:w-[360px]">
      <div className="rounded-3xl p-4 shadow-2xl" style={glassStyle(isDark)}>
        <p className="text-[11px] font-bold tracking-wider mb-2" style={{ color: primaryColor }}>
          {t('meetingPage.incoming')}
        </p>
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
            style={{ background: hexToRgba(primaryColor, 0.85) }}
          >
            {invite.from.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invite.from.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              invite.from.name.slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: textPrimary(isDark) }}>
              {invite.from.name}
            </p>
            <p className="text-xs" style={{ color: textMuted(isDark) }}>
              {t('meetingPage.incomingFrom')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={decline}
            className="flex-1 min-h-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white"
            style={{ background: '#DC2626' }}
          >
            <MdCallEnd size={18} />
            {t('meetingPage.decline')}
          </button>
          <button
            type="button"
            onClick={accept}
            className="flex-1 min-h-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white"
            style={{ background: primaryColor }}
          >
            <MdCall size={18} />
            {t('meetingPage.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
