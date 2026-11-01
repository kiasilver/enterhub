'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { MdCloudUpload, MdCollections, MdClose } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { letterAvatarColor } from '@/lib/enterprise-positions';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import { WorkspaceLogo } from '@/components/workspace/WorkspaceLogo';
import { GalleryPickerModal } from '@/components/workspace/GalleryPickerModal';
import {
  borderSubtle,
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
import { planLabelEn, planLabelFa } from '@/lib/plans-catalog';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Ws = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  logoColor: string | null;
  showCompanyName?: boolean;
  ownerTitle: string | null;
  planTier: string;
  owner: { id: string; name: string | null; email: string };
};

const MAX_LOGO_BYTES = 900_000;

async function fileToDataUrl(
  file: File,
  messages: { chooseImage: string; imageTooLarge: string },
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(messages.chooseImage);
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error(messages.imageTooLarge);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function LogoSlotCard({
  title,
  hint,
  slotBg,
  previewIsDark,
  displayName,
  logoUrl,
  logoUrlDark,
  logoColor,
  onUpload,
  onPickGallery,
  onClear,
  hasImage,
  uploadLabel,
  galleryLabel,
  removeLabel,
  clickUpload,
}: {
  title: string;
  hint: string;
  slotBg: string;
  previewIsDark: boolean;
  displayName: string;
  logoUrl: string;
  logoUrlDark: string;
  logoColor: string;
  onUpload: (file: File) => void;
  onPickGallery: () => void;
  onClear: () => void;
  hasImage: boolean;
  uploadLabel: string;
  galleryLabel: string;
  removeLabel: string;
  clickUpload: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelColor = previewIsDark ? '#fff' : '#0a0a0a';
  const muted = previewIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const chipBorder = previewIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)';
  const chipBg = previewIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: slotBg,
        border: `1px solid ${previewIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div>
        <p className="text-xs font-bold" style={{ color: labelColor }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: muted }}>
          {hint}
        </p>
      </div>

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title={clickUpload}
          className="relative shrink-0 w-auto h-auto rounded-2xl transition-all duration-200 hover:ring-2 hover:ring-blue-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          style={{
            background: 'transparent',
            boxShadow: previewIsDark
              ? '0 0 0 1px rgba(255,255,255,0.12)'
              : '0 0 0 1px rgba(0,0,0,0.08)',
          }}
        >
          <WorkspaceLogo
            name={displayName}
            logoUrl={logoUrl || null}
            logoUrlDark={previewIsDark ? logoUrlDark || null : null}
            logoColor={logoColor}
            isDark={previewIsDark}
            size={88}
            rounded="rounded-2xl"
          />
          {!hasImage && (
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl flex items-center justify-center"
              style={{ background: 'transparent' }}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{
                  background: previewIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  color: muted,
                }}
              >
                <MdCloudUpload size={20} />
              </span>
            </span>
          )}
        </button>

        <div className="flex flex-col gap-2 min-w-0 flex-1 pt-0.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors w-full sm:w-auto justify-center sm:justify-start"
            style={{
              background: chipBg,
              border: `1px solid ${chipBorder}`,
              color: labelColor,
            }}
          >
            <MdCloudUpload size={16} />
            {uploadLabel}
          </button>
          <button
            type="button"
            onClick={onPickGallery}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors w-full sm:w-auto justify-center sm:justify-start"
            style={{
              background: chipBg,
              border: `1px solid ${chipBorder}`,
              color: labelColor,
            }}
          >
            <MdCollections size={16} />
            {galleryLabel}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg self-start"
              style={{ color: previewIsDark ? '#f87171' : '#dc2626' }}
            >
              <MdClose size={14} />
              {removeLabel}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function WorkspaceSettingsGeneralPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';

  const [ws, setWs] = useState<Ws | null>(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUrlDark, setLogoUrlDark] = useState('');
  const [logoColor, setLogoColor] = useState('#3B82F6');
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [ownerTitle, setOwnerTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [pickerFor, setPickerFor] = useState<'light' | 'dark' | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/settings`);
    const json = await res.json();
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) {
      setError(json.error || t('common.loadFailed'));
      return;
    }
    const caps = json.data.capabilities;
    if (!caps.canUpdate) {
      if (caps.canMembers) {
        window.location.replace(`/workspace/${workspaceId}/settings/members`);
        return;
      }
      setForbidden(true);
      return;
    }
    const w = json.data.workspace as Ws;
    setWs(w);
    setName(w.name);
    setLogoUrl(w.logoUrl || '');
    setLogoUrlDark(w.logoUrlDark || '');
    setLogoColor(w.logoColor || letterAvatarColor(w.name));
    setShowCompanyName(w.showCompanyName !== false);
    setOwnerTitle(w.ownerTitle || '');
  }, [workspaceId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUploadLight(file: File) {
    try {
      setError(null);
      setLogoUrl(
        await fileToDataUrl(file, {
          chooseImage: t('settingsUi.chooseImage'),
          imageTooLarge: t('settingsUi.imageTooLarge'),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settingsUi.uploadFailed'));
    }
  }

  async function onUploadDark(file: File) {
    try {
      setError(null);
      setLogoUrlDark(
        await fileToDataUrl(file, {
          chooseImage: t('settingsUi.chooseImage'),
          imageTooLarge: t('settingsUi.imageTooLarge'),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settingsUi.uploadFailed'));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const hasLogo = Boolean(logoUrl.trim() || logoUrlDark.trim());
    const res = await fetch(`/api/workspaces/${workspaceId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        logoUrl: logoUrl.trim() || null,
        logoUrlDark: logoUrlDark.trim() || null,
        logoColor: logoColor || null,
        ownerTitle: ownerTitle.trim() || null,
        showCompanyName: hasLogo ? showCompanyName : true,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || t('common.saveFailed'));
      return;
    }
    const saved = json.data as Ws;
    window.dispatchEvent(
      new CustomEvent('enterhub:branding', {
        detail: {
          id: saved.id,
          name: saved.name,
          logoUrl: saved.logoUrl,
          logoUrlDark: saved.logoUrlDark,
          logoColor: saved.logoColor,
          showCompanyName: saved.showCompanyName !== false,
        },
      }),
    );
    setOk(t('common.save'));
    await load();
  }

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  if (forbidden) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        {t('settingsUi.forbidden')}
      </p>
    );
  }

  if (!ws) {
    return <p className="text-sm" style={{ color: textMuted(isDark) }}>{t('common.loading')}</p>;
  }

  const displayName = name || ws.name;
  const hasLogo = Boolean(logoUrl || logoUrlDark);

  return (
    <>
      <form onSubmit={(e) => void save(e)} className="w-full space-y-5">
        <SettingsGlassCard accent="#3b82f6">
          <SettingsSectionTitle
            title={t('settingsUi.branding')}
            subtitle={t('settingsUi.brandingHint')}
            badge={lang === 'fa' ? planLabelFa(ws.planTier) : planLabelEn(ws.planTier)}
            badgeColor="#3b82f6"
          />

          <div className="flex items-center gap-4 mb-5">
            <WorkspaceLogo
              name={displayName}
              logoUrl={logoUrl || null}
              logoUrlDark={logoUrlDark || null}
              logoColor={logoColor}
              isDark={isDark}
              size={40}
              rounded="rounded-xl"
            />
            {showCompanyName && (
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                  {displayName}
                </p>
                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {t('settingsUi.livePreview')} · {isDark ? t('settingsUi.themeDark') : t('settingsUi.themeLight')}
                  {isDark && logoUrl && !logoUrlDark ? ` · ${t('settingsUi.autoInverted')}` : ''}
                </p>
              </div>
            )}
            {!showCompanyName && (
              <p className="text-xs" style={{ color: textMuted(isDark) }}>
                {t('settingsUi.livePreview')} · {t('settingsUi.nameHidden')}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <LogoSlotCard
              title={t('settingsUi.lightLogo')}
              hint={t('settingsUi.lightLogoHint')}
              slotBg={isDark ? 'rgba(255,255,255,0.94)' : hexToRgba('#f8fafc', 1)}
              previewIsDark={false}
              displayName={displayName}
              logoUrl={logoUrl}
              logoUrlDark={logoUrlDark}
              logoColor={logoColor}
              hasImage={Boolean(logoUrl)}
              onUpload={(f) => void onUploadLight(f)}
              onPickGallery={() => setPickerFor('light')}
              onClear={() => setLogoUrl('')}
              uploadLabel={t('settingsUi.uploadFile')}
              galleryLabel={t('settingsUi.fromGallery')}
              removeLabel={t('settingsUi.remove')}
              clickUpload={t('settingsUi.clickUpload')}
            />
            <LogoSlotCard
              title={t('settingsUi.darkLogo')}
              hint={t('settingsUi.darkLogoHint')}
              slotBg="#0a0a0a"
              previewIsDark
              displayName={displayName}
              logoUrl={logoUrl}
              logoUrlDark={logoUrlDark}
              logoColor={logoColor}
              hasImage={Boolean(logoUrlDark)}
              onUpload={(f) => void onUploadDark(f)}
              onPickGallery={() => setPickerFor('dark')}
              onClear={() => setLogoUrlDark('')}
              uploadLabel={t('settingsUi.uploadFile')}
              galleryLabel={t('settingsUi.fromGallery')}
              removeLabel={t('settingsUi.remove')}
              clickUpload={t('settingsUi.clickUpload')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                {t('settingsUi.companyName')}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={field}
              />
              <label
                className="flex items-start gap-2.5 pt-2 cursor-pointer select-none"
                style={{ opacity: hasLogo ? 1 : 0.5 }}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={showCompanyName}
                  disabled={!hasLogo}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                />
                <span>
                  <span className="block text-xs font-medium" style={{ color: textPrimary(isDark) }}>
                    {t('settingsUi.showCompanyName')}
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: textMuted(isDark) }}>
                    {t('settingsUi.showCompanyNameHint')}
                  </span>
                </span>
              </label>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                {t('settingsUi.avatarColor')}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={logoColor}
                  onChange={(e) => setLogoColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  value={logoColor}
                  onChange={(e) => setLogoColor(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                  style={field}
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                {t('settingsUi.yourTitle')}
              </span>
              <input
                value={ownerTitle}
                onChange={(e) => setOwnerTitle(e.target.value)}
                placeholder={t('settingsUi.titlePlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={field}
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          {ok && (
            <p className="text-sm mt-4" style={{ color: '#22c55e' }}>
              {ok}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            {busy ? t('common.saving') : t('common.save')}
          </button>
        </SettingsGlassCard>
      </form>

      <GalleryPickerModal
        workspaceId={workspaceId}
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onPick={(item) => {
          if (pickerFor === 'dark') setLogoUrlDark(item.fileUrl);
          else setLogoUrl(item.fileUrl);
          setPickerFor(null);
        }}
      />
    </>
  );
}
