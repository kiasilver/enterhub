'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MdDelete, MdLink, MdRefresh, MdSend } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  textPrimary,
  textMuted,
  textSecondary,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import CustomSelect from '@/components/SafeDashboard/CustomSelect';

type Status = {
  smtpConfigured: boolean;
  localhost: boolean;
  skipVerification: boolean;
  host: string | null;
  from: string | null;
  hint: string;
};

type Account = {
  id: string;
  scope: 'PERSONAL' | 'ORG';
  label: string | null;
  emailAddress: string;
  imapHost: string;
  imapPort: number;
  lastSyncAt: string | null;
  lastError: string | null;
  isActive: boolean;
};

const emptyForm = {
  scope: 'PERSONAL' as 'PERSONAL' | 'ORG',
  label: '',
  emailAddress: '',
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  smtpHost: '',
  smtpPort: 587,
  username: '',
  password: '',
};

export default function WorkspaceEmailSettingsPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [status, setStatus] = useState<Status | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [canManageOrg, setCanManageOrg] = useState(false);
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const inputStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  };

  const loadSmtp = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/email/test`);
    const json = await res.json();
    if (res.ok) setStatus(json.data);
  }, [workspaceId]);

  const loadAccounts = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/email/accounts`);
    const json = await res.json();
    if (res.ok) {
      setAccounts(json.data || []);
      setCanManageOrg(!!json.meta?.canManageOrg);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadSmtp();
    void loadAccounts();
  }, [loadSmtp, loadAccounts]);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Send failed');
      setMsg(
        json.data.devCode
          ? `${json.data.message} — localhost code: ${json.data.devCode}`
          : json.data.message,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function connectMailbox(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/email/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          label: form.label || undefined,
          smtpHost: form.smtpHost || null,
          imapPort: Number(form.imapPort),
          smtpPort: Number(form.smtpPort),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Connect failed');
      setMsg(`Connected ${json.data.emailAddress}`);
      setForm(emptyForm);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function syncAccount(id: string) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/email/accounts/${id}`,
        { method: 'POST' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setMsg(`Imported ${json.data.imported} message(s)`);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount(id: string) {
    if (!confirm('Disconnect this mailbox?')) return;
    setBusy(true);
    try {
      await fetch(`/api/workspaces/${workspaceId}/email/accounts/${id}`, {
        method: 'DELETE',
      });
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsGlassCard accent="#06b6d4" className="w-full max-w-3xl">
      <SettingsSectionTitle
        title="Email"
        subtitle="Connect personal or org IMAP mailboxes for Inbox, plus platform SMTP for invites/OTP."
        badge="Mail"
        badgeColor="#06b6d4"
      />

      <div className="space-y-5">
        <WidgetFrame title="Connected mailboxes" isDark={isDark}>
          <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
            Synced messages appear under Apps → Email alongside internal Nexus mail.
          </p>

          <ul className="space-y-2 mb-5">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: surfaceItem(isDark) }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {a.label || a.emailAddress}{' '}
                    <span className="text-[10px] font-bold uppercase" style={{ color: textMuted(isDark) }}>
                      {a.scope}
                    </span>
                  </p>
                  <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                    {a.imapHost}:{a.imapPort}
                    {a.lastSyncAt
                      ? ` · synced ${new Date(a.lastSyncAt).toLocaleString()}`
                      : ' · never synced'}
                  </p>
                  {a.lastError && (
                    <p className="text-[11px] text-red-500 mt-0.5">{a.lastError}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <GlassButton
                    type="button"
                    disabled={busy}
                    onClick={() => void syncAccount(a.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-1"
                  >
                    <MdRefresh size={14} /> Sync
                  </GlassButton>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-red-500"
                    onClick={() => void removeAccount(a.id)}
                    aria-label="Disconnect"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </li>
            ))}
            {accounts.length === 0 && (
              <p className="text-sm" style={{ color: textMuted(isDark) }}>
                No mailboxes connected yet
              </p>
            )}
          </ul>

          <form onSubmit={(e) => void connectMailbox(e)} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <CustomSelect
                value={form.scope}
                onChange={(v) => setForm((f) => ({ ...f, scope: v as 'PERSONAL' | 'ORG' }))}
                options={[
                  { value: 'PERSONAL', label: 'Personal mailbox' },
                  ...(canManageOrg
                    ? [{ value: 'ORG', label: 'Organization mailbox' }]
                    : []),
                ]}
                isDark={isDark}
                className="w-full"
              />
              <input
                placeholder="Label (optional)"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.emailAddress}
              onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="IMAP host"
                value={form.imapHost}
                onChange={(e) => setForm((f) => ({ ...f, imapHost: e.target.value }))}
                className="sm:col-span-2 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Port"
                value={form.imapPort}
                onChange={(e) => setForm((f) => ({ ...f, imapPort: Number(e.target.value) }))}
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
              <input
                required
                type="password"
                placeholder="Password / app password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <input
              placeholder="SMTP host (optional, for later send)"
              value={form.smtpHost}
              onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
            <GlassButton
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold"
            >
              <MdLink size={16} /> {busy ? 'Saving…' : 'Connect mailbox'}
            </GlassButton>
          </form>
        </WidgetFrame>

        <WidgetFrame title="Platform SMTP status" isDark={isDark}>
          {!status ? (
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              Loading…
            </p>
          ) : (
            <ul className="text-sm space-y-2">
              <li style={{ color: textPrimary(isDark) }}>
                Mode:{' '}
                <strong>
                  {status.localhost ? 'Localhost (OTP logged, not emailed)' : 'Production'}
                </strong>
              </li>
              <li style={{ color: textPrimary(isDark) }}>
                SMTP configured: <strong>{status.smtpConfigured ? 'Yes' : 'No'}</strong>
              </li>
              <li style={{ color: textMuted(isDark) }}>Host: {status.host || '—'}</li>
              <li style={{ color: textMuted(isDark) }}>From: {status.from || '—'}</li>
              <li className="text-xs pt-2" style={{ color: textMuted(isDark) }}>
                {status.hint}
              </li>
            </ul>
          )}
        </WidgetFrame>

        <WidgetFrame title="Send test (platform SMTP)" isDark={isDark}>
          <form onSubmit={sendTest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="you@company.com (optional)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl outline-none"
              style={inputStyle}
            />
            <GlassButton
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold"
            >
              <MdSend size={14} /> {busy ? 'Sending…' : 'Send test'}
            </GlassButton>
          </form>
          {msg && (
            <p className="text-sm mt-3" style={{ color: textSecondary(isDark) }}>
              {msg}
            </p>
          )}
          {error && <p className="text-sm mt-3 text-red-500">{error}</p>}
        </WidgetFrame>
      </div>
    </SettingsGlassCard>
  );
}
