'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { MdMailOutline } from 'react-icons/md';
import SafeEmail, { type Email } from '@/components/SafeDashboard/SafeEmail';
import { EmailConnectGuide } from '@/components/email/EmailConnectGuide';
import { hexToRgba, textMuted } from '@/components/SafeDashboard/theme';

type Mailbox = {
  id: string;
  isActive: boolean;
  lastError: string | null;
};

type MemberOpt = { id: string; label: string; email: string };

export function WorkspaceEmailClient({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [emails, setEmails] = useState<Email[]>([]);
  const [members, setMembers] = useState<MemberOpt[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[] | null>(null);
  const [showConnect, setShowConnect] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/mail?folder=all`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load mail');
      setLoading(false);
      return;
    }
    setEmails(
      (json.data || []).map(
        (e: Email & { category: string; priority: string }) => ({
          ...e,
          category: (e.category || 'general') as Email['category'],
          priority: (e.priority || 'medium') as Email['priority'],
        }),
      ),
    );
    setError(null);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/email/accounts`);
      const json = await res.json();
      if (!res.ok) {
        setMailboxes([]);
        return;
      }
      setMailboxes(json.data || []);
    })();
  }, [workspaceId]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const json = await res.json();
      if (!res.ok) return;
      setMembers(
        (json.data || [])
          .filter((m: { status: string }) => m.status === 'ACTIVE')
          .map(
            (m: {
              userId?: string;
              user: { id: string; name: string | null; email: string };
            }) => ({
              id: m.userId || m.user.id,
              label: m.user.name || m.user.email,
              email: m.user.email,
            }),
          ),
      );
    })();
  }, [workspaceId]);

  const onSelect = async (id: string) => {
    await fetch(`/api/workspaces/${workspaceId}/mail/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
  };

  const onToggleStar = async (id: string, starred: boolean) => {
    await fetch(`/api/workspaces/${workspaceId}/mail/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred }),
    });
  };

  const onSend = async (payload: {
    toUserId: string;
    subject: string;
    body: string;
    category: string;
    priority: string;
  }) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/mail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) await load();
    return res.ok;
  };

  if (loading && emails.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm" style={{ color: textMuted(isDark) }}>
        {t('common.loading')}
      </div>
    );
  }

  if (error && emails.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  const connected = (mailboxes || []).some((m) => m.isActive && !m.lastError);
  const mailboxError = (mailboxes || []).find((m) => m.lastError)?.lastError || null;

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden flex flex-col">
      <SafeEmail
        isDark={isDark}
        live={{
          emails,
          onEmailsChange: setEmails,
          members,
          onSend,
          onSelect,
          onToggleStar,
        }}
      />
      {mailboxes !== null && !connected && showConnect && (
        <EmailConnectGuide
          workspaceId={workspaceId}
          isDark={isDark}
          asModal
          onClose={() => setShowConnect(false)}
          error={mailboxError ? t('emailPage.mailboxError') : null}
        />
      )}
      {mailboxes !== null && !connected && !showConnect && (
        <button
          type="button"
          onClick={() => setShowConnect(true)}
          className="absolute bottom-5 start-5 z-20 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: hexToRgba(primaryColor, 0.14),
            color: primaryColor,
            border: `1px solid ${hexToRgba(primaryColor, 0.28)}`,
          }}
        >
          <MdMailOutline size={18} />
          {t('emailPage.reconnect')}
        </button>
      )}
    </div>
  );
}
