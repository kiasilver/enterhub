'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  glassStyle,
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

export type GalleryPickItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number;
  uploader?: { name: string | null; email: string };
};

/** Modal to pick an image from workspace gallery (for logo, etc.) */
export function GalleryPickerModal({
  workspaceId,
  open,
  onClose,
  onPick,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onPick: (item: GalleryPickItem) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [q, setQ] = useState('');
  const [items, setItems] = useState<GalleryPickItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ imagesOnly: '1' });
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/workspaces/${workspaceId}/media?${params}`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) setItems(json.data?.items || []);
  }, [workspaceId, q]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          ...glassStyle(isDark),
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>
              Choose from gallery
            </p>
            <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
              Images uploaded in this workspace
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ color: textSecondary(isDark), background: surfaceItem(isDark) }}
          >
            Close
          </button>
        </div>
        <div className="px-5 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by file name or sender…"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: textPrimary(isDark),
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
              No images in gallery yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onPick(item);
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden text-left group"
                  style={{
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    background: surfaceItem(isDark),
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="w-full aspect-square object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="p-2">
                    <p className="text-[10px] truncate font-medium" style={{ color: textPrimary(isDark) }}>
                      {item.fileName}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: textMuted(isDark) }}>
                      {item.uploader?.name || item.uploader?.email || '—'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          className="px-5 py-3 text-[11px]"
          style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            color: textMuted(isDark),
            background: hexToRgba('#ec4899', isDark ? 0.08 : 0.05),
          }}
        >
          Tip: upload chat photos in Gallery first, then pick them here for your logo.
        </div>
      </div>
    </div>
  );
}
