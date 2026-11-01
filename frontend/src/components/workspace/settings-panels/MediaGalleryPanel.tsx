'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  GALLERY_CATEGORIES,
  formatBytes,
  type FileCategory,
} from '@/lib/file-category';
import {
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

type Item = {
  id: string;
  kind: 'media' | 'attachment';
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number;
  source: string;
  category: FileCategory;
  createdAt: string;
  uploader: { id: string; name: string | null; email: string };
  boardName?: string;
  cardTitle?: string;
  canDelete: boolean;
};

type Counts = Record<string, number>;

export default function MediaGalleryPanel() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const fileRef = useRef<HTMLInputElement>(null);

  const [scope, setScope] = useState<'workspace' | 'mine'>('mine');
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [category, setCategory] = useState<string>('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<{
    label: string;
    usedMb: number;
    limitMb: number;
    remainingMb: number;
    percentUsed: number;
    isFull: boolean;
    extraMb: number;
    plan: string;
  } | null>(null);
  const [preview, setPreview] = useState<Item | null>(null);

  const usageFull = Boolean(usage?.isFull);

  const load = useCallback(async () => {
    setError(null);
    const paramsQs = new URLSearchParams();
    if (category !== 'all') paramsQs.set('category', category);
    if (q.trim()) paramsQs.set('q', q.trim());
    const [mRes, uRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/media?${paramsQs}`),
      fetch(`/api/workspaces/${workspaceId}/usage`),
    ]);
    const mJson = await mRes.json();
    const uJson = await uRes.json();
    if (!mRes.ok) {
      setError(mJson.error || 'Failed');
      return;
    }
    setScope(mJson.data.scope);
    setItems(mJson.data.items || []);
    setCounts(mJson.data.counts || {});
    if (uRes.ok && uJson.data?.storage) {
      const s = uJson.data.storage;
      setUsage({
        label: uJson.data.labels?.storageLabel || `${s.usedMb} / ${s.limitMb} MB`,
        usedMb: s.usedMb,
        limitMb: s.limitMb,
        remainingMb: s.remainingMb,
        percentUsed: s.percentUsed,
        isFull: Boolean(s.isFull),
        extraMb: s.extraMb ?? 0,
        plan: uJson.data.labels?.plan || '',
      });
    }
  }, [workspaceId, category, q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 180);
    return () => clearTimeout(t);
  }, [load]);

  const categoryTabs = useMemo(
    () =>
      GALLERY_CATEGORIES.map((c) => ({
        ...c,
        count: c.id === 'all' ? counts.all ?? 0 : counts[c.id] ?? 0,
      })),
    [counts]
  );

  async function remove(item: Item) {
    if (!item.canDelete) return;
    if (!confirm(`Delete “${item.fileName}”? Cloud space will be freed.`)) return;
    setBusy(true);
    const res = await fetch(
      `/api/workspaces/${workspaceId}/media/${item.id}?kind=${item.kind}`,
      { method: 'DELETE' }
    );
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || 'Delete failed');
      return;
    }
    if (preview?.id === item.id) setPreview(null);
    await load();
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    if (usageFull) {
      setError('Cloud is full — delete files or buy more storage.');
      return;
    }
    setBusy(true);
    setError(null);
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch(`/api/workspaces/${workspaceId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileUrl: dataUrl,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        source: 'UPLOAD',
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Upload failed');
      return;
    }
    await load();
  }

  function thumb(item: Item) {
    if (item.category === 'image') {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.fileUrl} alt="" className="w-full h-full object-cover" />
      );
    }
    const label =
      item.category === 'pdf'
        ? 'PDF'
        : item.category === 'video'
          ? 'VIDEO'
          : item.category === 'audio'
            ? 'AUDIO'
            : item.category === 'document'
              ? 'DOC'
              : 'FILE';
    const color =
      GALLERY_CATEGORIES.find((c) => c.id === item.category)?.color || '#64748b';
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-1"
        style={{ background: hexToRgba(color, isDark ? 0.2 : 0.12) }}
      >
        <span className="text-xs font-black tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="text-[9px] px-2 truncate max-w-full" style={{ color: textMuted(isDark) }}>
          {item.fileName.split('.').pop()?.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <SettingsGlassCard accent="#ec4899">
        <SettingsSectionTitle
          title={t('settingsUi.galleryTitle')}
          subtitle={
            scope === 'workspace'
              ? t('settingsUi.galleryFull')
              : t('settingsUi.galleryMine')
          }
          badge={scope === 'workspace' ? t('settingsUi.galleryFullBadge') : t('settingsUi.galleryMineBadge')}
          badgeColor="#ec4899"
        />

        {usage && (
          <div
            className="mb-4 rounded-2xl p-4 space-y-2.5"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${
                usage.isFull
                  ? hexToRgba('#ef4444', 0.45)
                  : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.08)'
              }`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
                  Cloud usage
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: textPrimary(isDark) }}>
                  {usage.label}
                  {usage.plan ? (
                    <span className="font-normal ml-2" style={{ color: textSecondary(isDark) }}>
                      · {usage.plan}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{
                    color:
                      usage.percentUsed >= 90
                        ? '#ef4444'
                        : usage.percentUsed >= 70
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                >
                  {Math.min(100, Math.round(usage.percentUsed))}%
                </p>
                <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                  {usage.isFull
                    ? 'Storage full'
                    : usage.extraMb > 0
                      ? `+${Math.round(usage.extraMb / 1024)} GB add-on · ${usage.remainingMb} MB free`
                      : `${usage.remainingMb} MB free`}
                </p>
              </div>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, usage.percentUsed))}%`,
                  background:
                    usage.percentUsed >= 90
                      ? 'linear-gradient(90deg,#ef4444,#f97316)'
                      : usage.percentUsed >= 70
                        ? 'linear-gradient(90deg,#f59e0b,#eab308)'
                        : 'linear-gradient(90deg,#06b6d4,#22c55e)',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files, senders, boards…"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: textPrimary(isDark),
            }}
          />
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              disabled={busy || usageFull}
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold px-4 py-2.5 rounded-xl text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}
            >
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                void onUpload(e.target.files?.[0] || null);
                e.target.value = '';
              }}
            />
            <Link
              href={`/workspace/${workspaceId}/settings/billing`}
              className="text-xs font-bold px-4 py-2.5 rounded-xl"
              style={{
                background: hexToRgba('#06b6d4', isDark ? 0.18 : 0.12),
                color: '#06b6d4',
                border: `1px solid ${hexToRgba('#06b6d4', 0.35)}`,
              }}
            >
              Buy cloud
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
          {categoryTabs.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: active ? hexToRgba(c.color, isDark ? 0.25 : 0.15) : surfaceItem(isDark),
                  color: active ? c.color : textSecondary(isDark),
                  border: `1px solid ${active ? hexToRgba(c.color, 0.5) : 'transparent'}`,
                  boxShadow: active ? `0 0 0 3px ${hexToRgba(c.color, 0.12)}` : 'none',
                }}
              >
                {c.label}
                <span className="ml-1.5 opacity-70">{c.count}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {usageFull && (
          <p className="text-sm mb-3 font-medium" style={{ color: '#ef4444' }}>
            Cloud storage is full. Delete files or upgrade cloud in Billing.
          </p>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: surfaceItem(isDark) }}>
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              No files in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {items.map((item) => {
              const catColor =
                GALLERY_CATEGORIES.find((c) => c.id === item.category)?.color || '#64748b';
              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="rounded-2xl overflow-hidden group relative"
                  style={{
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    background: surfaceItem(isDark),
                  }}
                >
                  <button
                    type="button"
                    className="w-full aspect-square block"
                    onClick={() => setPreview(item)}
                  >
                    {thumb(item)}
                  </button>
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                    style={{ background: catColor }}
                  >
                    {item.category.toUpperCase()}
                  </span>
                  <div className="p-2.5">
                    <p className="text-[11px] truncate font-semibold" style={{ color: textPrimary(isDark) }}>
                      {item.fileName}
                    </p>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: textMuted(isDark) }}>
                      {item.uploader.name || item.uploader.email}
                      {' · '}
                      {item.source}
                      {item.boardName ? ` · ${item.boardName}` : ''}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: textMuted(isDark) }}>
                      {formatBytes(item.sizeBytes)} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {item.canDelete && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(item)}
                      className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SettingsGlassCard>

      {preview && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div
            className="relative w-full max-w-lg rounded-2xl p-5 space-y-3"
            style={{ background: isDark ? 'var(--background)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
          >
            <p className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>
              {preview.fileName}
            </p>
            <p className="text-xs" style={{ color: textSecondary(isDark) }}>
              Sent by {preview.uploader.name || preview.uploader.email}
              {' · '}
              {preview.source}
              {preview.boardName ? ` · ${preview.boardName}` : ''}
              {preview.cardTitle ? ` · ${preview.cardTitle}` : ''}
            </p>
            {preview.category === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.fileUrl} alt="" className="w-full max-h-[50vh] object-contain rounded-xl" />
            ) : (
              <a
                href={preview.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-semibold text-center py-8 rounded-xl"
                style={{ background: surfaceItem(isDark), color: '#3b82f6' }}
              >
                Open / download file
              </a>
            )}
            <div className="flex gap-2 justify-end">
              {preview.canDelete && (
                <button
                  type="button"
                  className="text-xs font-bold px-3 py-2 rounded-xl text-white"
                  style={{ background: '#ef4444' }}
                  onClick={() => void remove(preview)}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: surfaceItem(isDark), color: textPrimary(isDark) }}
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
