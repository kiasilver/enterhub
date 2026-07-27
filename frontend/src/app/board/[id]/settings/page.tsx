'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { BoardShell } from '@/components/workspace/BoardShell';
import { AutomationBuilder } from '@/components/board/AutomationBuilder';
import { CustomFieldsEditor } from '@/components/board/CustomFieldsEditor';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

type Tab = 'general' | 'automation' | 'custom-fields';

export default function BoardSettingsPage() {
  const params = useParams();
  const boardId = String(params.id);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<Tab>('general');
  const [workspaceId, setWorkspaceId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLevel, setGuestLevel] = useState('READ_ONLY');
  const [guests, setGuests] = useState<
    Array<{ id: string; accessLevel: string; user: { email: string; name: string | null } }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/boards/${boardId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    setName(json.data.name);
    setDescription(json.data.description || '');
    setVisibility(json.data.visibility);
    setWorkspaceId(json.data.workspaceId);

    const gRes = await fetch(`/api/boards/${boardId}/guests`);
    if (gRes.ok) {
      const gJson = await gRes.json();
      setGuests(gJson.data || []);
    }
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    const res = await fetch(`/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, visibility }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Save failed');
      return;
    }
    setOk('Board updated');
  }

  async function inviteGuest(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/boards/${boardId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guestEmail, accessLevel: guestLevel }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Invite failed');
      return;
    }
    setGuestEmail('');
    setOk('Guest invited');
    await load();
  }

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'automation', label: 'Automation' },
    { id: 'custom-fields', label: 'Custom Fields' },
  ];

  if (!workspaceId && !error) {
    return (
      <p className="p-8" style={{ color: textMuted(isDark) }}>
        Loading…
      </p>
    );
  }

  return (
    <BoardShell
      workspaceId={workspaceId || 'x'}
      boardId={boardId}
      boardName={name || 'Settings'}
      canSettings={false}
    >
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold" style={{ color: textPrimary(isDark) }}>
            Board settings
          </h2>
          <p className="text-sm" style={{ color: textSecondary(isDark) }}>
            Visibility, guests, automations, and custom fields
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setOk(null);
                  setError(null);
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: active ? surfaceItem(isDark) : 'transparent',
                  color: active ? textPrimary(isDark) : textSecondary(isDark),
                  border: `1px solid ${active ? borderSubtle(isDark) : 'transparent'}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {ok && tab === 'general' && <p className="text-sm text-green-500">{ok}</p>}

        {tab === 'general' && (
          <div className="space-y-8">
            <form onSubmit={save} className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-transparent"
                style={field}
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-transparent"
                style={field}
                placeholder="Description"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-transparent"
                style={field}
              >
                <option value="PRIVATE" style={{ color: '#000' }}>
                  Private
                </option>
                <option value="WORKSPACE" style={{ color: '#000' }}>
                  Workspace
                </option>
                <option value="PUBLIC" style={{ color: '#000' }}>
                  Public
                </option>
              </select>
              <GlassButton type="submit" className="px-5 py-2.5 rounded-xl font-semibold">
                Save board
              </GlassButton>
            </form>

            <div
              className="space-y-3 pt-4"
              style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}
            >
              <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
                Guests / Observers
              </h3>
              <form onSubmit={inviteGuest} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@email.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-transparent"
                  style={field}
                />
                <select
                  value={guestLevel}
                  onChange={(e) => setGuestLevel(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-transparent"
                  style={field}
                >
                  <option value="READ_ONLY" style={{ color: '#000' }}>
                    Read only
                  </option>
                  <option value="COMMENT_ONLY" style={{ color: '#000' }}>
                    Comment only
                  </option>
                  <option value="ASSIGNED_ONLY" style={{ color: '#000' }}>
                    Assigned only
                  </option>
                </select>
                <GlassButton type="submit" className="px-4 py-2 rounded-xl">
                  Invite
                </GlassButton>
              </form>
              <ul className="space-y-2">
                {guests.map((g) => (
                  <li
                    key={g.id}
                    className="text-sm flex justify-between gap-2 px-3 py-2 rounded-lg"
                    style={{
                      border: `1px solid ${borderSubtle(isDark)}`,
                      color: textSecondary(isDark),
                    }}
                  >
                    <span>{g.user.email}</span>
                    <span style={{ color: textMuted(isDark) }}>{g.accessLevel}</span>
                  </li>
                ))}
                {guests.length === 0 && (
                  <li className="text-sm" style={{ color: textMuted(isDark) }}>
                    No guests yet
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {tab === 'automation' && <AutomationBuilder boardId={boardId} isDark={isDark} />}

        {tab === 'custom-fields' && <CustomFieldsEditor boardId={boardId} isDark={isDark} />}
      </div>
    </BoardShell>
  );
}
