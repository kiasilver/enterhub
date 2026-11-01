'use client';

import { useRef, useState } from 'react';
import { MdPhotoCamera } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { hexToRgba } from '@/components/SafeDashboard/theme';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Props = {
  isDark: boolean;
  avatarUrl?: string | null;
  initials: string;
  presenceColor: string;
  onChanged: (url: string | null) => void;
};

export function AccountAvatar({
  isDark,
  avatarUrl,
  initials,
  presenceColor,
  onChanged,
}: Props) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  const showPhoto = Boolean(avatarUrl) && !broken;

  async function upload(file: File) {
    if (busy) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError(t('account.photoInvalid'));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError(t('account.photoTooLarge'));
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/account/avatar', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.error === 'Image must be under 4 MB'
            ? t('account.photoTooLarge')
            : json.error === 'Use a JPG, PNG, WEBP, or GIF'
              ? t('account.photoInvalid')
              : json.error || t('common.failed'),
        );
      }
      setBroken(false);
      const nextUrl = json.data?.avatarUrl || null;
      onChanged(nextUrl);
      window.dispatchEvent(
        new CustomEvent('enterhub:avatar', { detail: { url: nextUrl } }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 flex-shrink-0">
      <button
        type="button"
        disabled={busy}
        aria-label={t('account.changePhoto')}
        title={t('account.changePhoto')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className="group relative w-[88px] h-[88px] rounded-full flex-shrink-0 outline-none disabled:cursor-wait"
        style={{
          boxShadow: dragOver
            ? `0 0 0 4px ${hexToRgba(primaryColor, 0.55)}, 0 12px 28px ${hexToRgba(primaryColor, 0.28)}`
            : `0 0 0 3px ${hexToRgba(primaryColor, 0.28)}, 0 10px 28px ${
                isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.12)'
              }`,
          transform: dragOver ? 'scale(1.03)' : undefined,
          transition: 'box-shadow 180ms ease, transform 180ms ease',
        }}
      >
        <span className="absolute inset-0 rounded-full overflow-hidden">
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl!}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span
              className="w-full h-full flex items-center justify-center text-[22px] font-bold text-white"
              style={{
                background: `linear-gradient(145deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.72)})`,
              }}
            >
              {initials || '?'}
            </span>
          )}
        </span>

        <span
          className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.72) 100%)',
            pointerEvents: 'none',
          }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <MdPhotoCamera size={18} />
          </span>
          <span className="text-[10px] font-bold tracking-wide text-white px-2 text-center leading-tight">
            {busy ? t('account.changingPhoto') : t('account.changePhoto')}
          </span>
        </span>

        {busy && (
          <span
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(15,23,42,0.45)' }}
          >
            <span
              className="w-7 h-7 rounded-full animate-spin"
              style={{
                border: '2px solid rgba(255,255,255,0.25)',
                borderTopColor: '#fff',
              }}
            />
          </span>
        )}

        <span
          className="absolute w-3.5 h-3.5 rounded-full border-2 pointer-events-none"
          style={{
            bottom: 4,
            insetInlineStart: 4,
            background: presenceColor,
            borderColor: isDark ? 'var(--background)' : '#fff',
          }}
        />

        <span
          className="absolute w-7 h-7 rounded-full flex items-center justify-center pointer-events-none text-white"
          style={{
            bottom: -2,
            insetInlineEnd: -2,
            background: primaryColor,
            border: `2px solid ${isDark ? 'var(--background)' : '#fff'}`,
            boxShadow: `0 6px 14px ${hexToRgba(primaryColor, 0.4)}`,
          }}
        >
          <MdPhotoCamera size={14} />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void upload(file);
        }}
      />

      {error && (
        <p className="text-[11px] font-medium max-w-[11rem] leading-snug text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
