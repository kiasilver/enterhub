'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

export default function RecoveryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<{
    messages: { id: string; body: string; deletedAt: string | null; author: { name: string | null }; room: { name: string | null } }[];
    attachments: { id: string; fileName: string; deletedAt: string | null; card: { title: string } }[];
    media: { id: string; fileName: string; deletedAt: string | null; workspace: { name: string } }[];
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/superadmin/recovery');
    const json = await res.json();
    if (res.ok) setData(json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(kind: string, id: string) {
    await fetch('/api/superadmin/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id }),
    });
    await load();
  }

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Recovery (6 days)
          </h1>
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            Soft-deleted chats and files remain recoverable until purgeAfter. Users can also open Support tickets.
          </p>
        </div>
        {!data ? (
          <p>Loading…</p>
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="font-semibold" style={{ color: textPrimary(isDark) }}>
                Chat messages
              </h2>
              {data.messages.map((m) => (
                <div key={m.id} className="rounded-xl px-3 py-2 text-sm flex justify-between gap-2" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                  <span style={{ color: textSecondary(isDark) }}>
                    <strong style={{ color: textPrimary(isDark) }}>{m.room?.name || 'Room'}</strong> · {m.author?.name}
                    <span className="block text-xs line-clamp-2">{m.body}</span>
                  </span>
                  <button type="button" className="text-xs font-bold text-blue-500" onClick={() => void restore('message', m.id)}>
                    Restore
                  </button>
                </div>
              ))}
              {data.messages.length === 0 && <p className="text-sm" style={{ color: textMuted(isDark) }}>None</p>}
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold" style={{ color: textPrimary(isDark) }}>
                Files / media
              </h2>
              {[...data.attachments.map((a) => ({ id: a.id, kind: 'attachment' as const, label: `${a.fileName} · card ${a.card.title}` })), ...data.media.map((m) => ({ id: m.id, kind: 'media' as const, label: `${m.fileName} · ${m.workspace.name}` }))].map((f) => (
                <div key={`${f.kind}-${f.id}`} className="rounded-xl px-3 py-2 text-sm flex justify-between gap-2" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                  <span style={{ color: textSecondary(isDark) }}>{f.label}</span>
                  <button type="button" className="text-xs font-bold text-blue-500" onClick={() => void restore(f.kind, f.id)}>
                    Restore
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </SuperAdminShell>
  );
}
