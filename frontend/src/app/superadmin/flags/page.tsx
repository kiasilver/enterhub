'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
} from '@/components/SafeDashboard/theme';

type Flag = {
  id: string;
  key: string;
  description: string | null;
  isEnabledGlobally: boolean;
  canaryPercent: number;
};

export default function SuperAdminFlagsPage() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [flags, setFlags] = useState<Flag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user?.isSuperAdmin) return;
    const res = await fetch('/api/superadmin/feature-flags');
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load flags');
      return;
    }
    setError(null);
    setFlags(json.data || []);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(flag: Flag) {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/superadmin/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: flag.key,
        isEnabledGlobally: !flag.isEnabledGlobally,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Toggle failed');
      return;
    }
    await load();
  }

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/superadmin/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        create: {
          key: newKey.trim(),
          description: newDesc.trim() || undefined,
          isEnabledGlobally: false,
        },
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Create failed');
      return;
    }
    setNewKey('');
    setNewDesc('');
    await load();
  }

  const inputStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
    background: 'transparent',
  } as const;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Feature flags
          </h2>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            Global toggles and canary rollout
          </p>
        </div>

        <form onSubmit={createFlag} className="flex flex-wrap gap-3">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="flag.key"
            required
            className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl text-sm"
            style={inputStyle}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl text-sm"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
          >
            <Plus size={16} /> Create
          </button>
        </form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <ul className="space-y-2">
          {flags.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: textPrimary(isDark) }}>
                  {f.key}
                </p>
                <p className="text-xs truncate" style={{ color: textMuted(isDark) }}>
                  {f.description || 'No description'} · canary {f.canaryPercent}%
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                role="switch"
                aria-checked={f.isEnabledGlobally}
                onClick={() => void toggle(f)}
                className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
                style={{
                  background: f.isEnabledGlobally
                    ? isDark
                      ? '#fff'
                      : '#0a0a0a'
                    : isDark
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(0,0,0,0.15)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: f.isEnabledGlobally
                      ? isDark
                        ? '#000'
                        : '#fff'
                      : isDark
                        ? 'rgba(255,255,255,0.7)'
                        : '#fff',
                    transform: f.isEnabledGlobally ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </li>
          ))}
          {flags.length === 0 && (
            <li className="text-sm py-4" style={{ color: textMuted(isDark) }}>
              No feature flags yet
            </li>
          )}
        </ul>
      </div>
    </SuperAdminShell>
  );
}
