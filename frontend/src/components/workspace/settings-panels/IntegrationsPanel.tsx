'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  MdCheckCircle,
  MdCloudUpload,
  MdDownload,
  MdLinkOff,
  MdOpenInNew,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
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

type SyncLink = {
  id: string;
  boardId: string;
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  sheetName: string;
  syncMode: string;
  lastSyncedAt: string | null;
  board: { id: string; name: string };
};

type Connection = {
  id: string;
  googleEmail: string;
  isActive: boolean;
  lastExportAt: string | null;
  lastImportAt: string | null;
  lastError: string | null;
  createdAt: string;
  syncLinks: SyncLink[];
};

type StatusPayload = {
  configured: boolean;
  connected: boolean;
  connection: Connection | null;
};

type BoardOption = { id: string; name: string };

export default function IntegrationsPanel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [boardId, setBoardId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Tasks');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  };

  const loadStatus = useCallback(async () => {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/integrations/google/status`,
    );
    const json = await res.json();
    if (res.ok) setStatus(json.data);
  }, [workspaceId]);

  const loadBoards = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/boards`);
    const json = await res.json();
    if (res.ok) {
      const list: BoardOption[] = (json.data || []).map(
        (b: { id: string; name: string }) => ({
          id: b.id,
          name: b.name,
        }),
      );
      setBoards(list);
      if (list[0] && !boardId) setBoardId(list[0].id);
    }
  }, [workspaceId, boardId]);

  useEffect(() => {
    void loadStatus();
    void loadBoards();
  }, [loadStatus, loadBoards]);

  useEffect(() => {
    const flag = searchParams.get('google_sheets');
    if (flag === 'connected') setMsg('Google Sheets connected successfully.');
    if (flag === 'error') setError('Google connection failed. Try again.');
    if (flag === 'not_configured') {
      setError('Server is missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.');
    }
  }, [searchParams]);

  async function disconnect() {
    if (!confirm('Disconnect Google Sheets for your account in this workspace?')) {
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/google/disconnect`,
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Disconnect failed');
      setMsg('Disconnected.');
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function exportBoard() {
    if (!boardId) {
      setError('Select a board first');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/google/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'board', boardId }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Export failed');
      setMsg(
        `Exported ${json.data.rowCount} tasks. Opening spreadsheet…`,
      );
      if (json.data.spreadsheetUrl) {
        window.open(json.data.spreadsheetUrl, '_blank', 'noopener,noreferrer');
      }
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function exportMyTasks() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/google/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'my-tasks' }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Export failed');
      setMsg(`Exported ${json.data.rowCount} of your tasks.`);
      if (json.data.spreadsheetUrl) {
        window.open(json.data.spreadsheetUrl, '_blank', 'noopener,noreferrer');
      }
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function importSheet() {
    if (!boardId || !spreadsheetId.trim()) {
      setError('Board and Spreadsheet ID are required');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/google/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boardId,
            spreadsheetId: spreadsheetId.trim(),
            sheetName: sheetName.trim() || 'Tasks',
            skipExisting: true,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      setMsg(
        `Imported ${json.data.created} tasks (${json.data.skipped} skipped).`,
      );
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const connected = status?.connected;
  const conn = status?.connection;

  return (
    <div className="space-y-6">
      <SettingsGlassCard accent="#22c55e">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="min-w-0 flex-1">
            <SettingsSectionTitle
              title={t('settingsUi.sheetsTitle')}
              subtitle={t('settingsUi.sheetsSubtitle')}
              badge="OAuth"
              badgeColor="#22c55e"
            />
          </div>
          {!status?.configured ? (
            <p className="text-xs" style={{ color: textMuted(isDark) }}>
              Admin: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
            </p>
          ) : connected ? (
            <GlassButton
              variant="default"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              <MdLinkOff size={18} />
              Disconnect
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              disabled={busy || !status?.configured}
              onClick={() => {
                window.location.href = `/api/workspaces/${workspaceId}/integrations/google/connect`;
              }}
            >
              <MdCheckCircle size={18} />
              Connect Google
            </GlassButton>
          )}
        </div>

        {msg && (
          <p className="mt-4 text-sm text-green-500" role="status">
            {msg}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {connected && conn && (
          <div
            className="mt-5 rounded-xl p-4 space-y-2"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
          >
            <p className="text-sm font-medium" style={{ color: textPrimary(isDark) }}>
              Connected as {conn.googleEmail}
            </p>
            <p className="text-xs" style={{ color: textMuted(isDark) }}>
              Last export:{' '}
              {conn.lastExportAt
                ? new Date(conn.lastExportAt).toLocaleString()
                : '—'}{' '}
              · Last import:{' '}
              {conn.lastImportAt
                ? new Date(conn.lastImportAt).toLocaleString()
                : '—'}
            </p>
            {conn.lastError && (
              <p className="text-xs text-red-400">Last error: {conn.lastError}</p>
            )}
          </div>
        )}
      </SettingsGlassCard>

      {connected && (
        <>
          <SettingsGlassCard accent="#22c55e">
            <SettingsSectionTitle
              title={t('settingsUi.liveExport')}
              subtitle={t('settingsUi.liveExportHint')}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <label className="flex-1 text-xs space-y-1.5" style={{ color: textMuted(isDark) }}>
                Board
                <CustomSelect
                  value={boardId}
                  onChange={setBoardId}
                  isDark={isDark}
                  options={boards.map((b) => ({ value: b.id, label: b.name }))}
                />
              </label>
              <GlassButton
                variant="primary"
                disabled={busy || !boardId}
                onClick={() => void exportBoard()}
              >
                <MdCloudUpload size={18} />
                Export board
              </GlassButton>
              <GlassButton
                variant="default"
                disabled={busy}
                onClick={() => void exportMyTasks()}
              >
                <MdDownload size={18} />
                Export my tasks
              </GlassButton>
            </div>
          </SettingsGlassCard>

          <SettingsGlassCard accent="#3b82f6">
            <SettingsSectionTitle
              title={t('settingsUi.bulkImport')}
              subtitle={t('settingsUi.bulkImportHint')}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs space-y-1.5" style={{ color: textMuted(isDark) }}>
                Target board
                <CustomSelect
                  value={boardId}
                  onChange={setBoardId}
                  isDark={isDark}
                  options={boards.map((b) => ({ value: b.id, label: b.name }))}
                />
              </label>
              <label className="text-xs space-y-1.5" style={{ color: textMuted(isDark) }}>
                Sheet tab name
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Tasks"
                />
              </label>
              <label
                className="text-xs space-y-1.5 sm:col-span-2"
                style={{ color: textMuted(isDark) }}
              >
                Spreadsheet ID
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
                  style={inputStyle}
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
              </label>
            </div>
            <div className="mt-4">
              <GlassButton
                variant="primary"
                disabled={busy || !boardId || !spreadsheetId.trim()}
                onClick={() => void importSheet()}
              >
                <MdDownload size={18} />
                Import into board
              </GlassButton>
            </div>
          </SettingsGlassCard>

          {conn && conn.syncLinks.length > 0 && (
            <SettingsGlassCard>
              <SettingsSectionTitle
                title={t('settingsUi.recentSync')}
                subtitle={t('settingsUi.recentSyncHint')}
              />
              <ul className="space-y-2">
                {conn.syncLinks.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                    style={{
                      background: surfaceItem(isDark),
                      border: `1px solid ${borderSubtle(isDark)}`,
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: textPrimary(isDark) }}
                      >
                        {link.board.name}
                      </p>
                      <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                        {link.syncMode}
                        {link.lastSyncedAt
                          ? ` · ${new Date(link.lastSyncedAt).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                    {link.spreadsheetUrl && (
                      <a
                        href={link.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: '#22c55e' }}
                      >
                        Open <MdOpenInNew size={14} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </SettingsGlassCard>
          )}
        </>
      )}
    </div>
  );
}
