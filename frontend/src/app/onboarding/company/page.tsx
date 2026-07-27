'use client';

import { canvasBg, panelFill } from '@/components/SafeDashboard/theme';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import { readJson } from '@/lib/safe-json';
import {
  DEPARTMENTS,
  EMPLOYEE_BANDS,
  POSITION_TEMPLATES,
  companyInitial,
  letterAvatarColor,
  positionsForDepartments,
  type DepartmentKey,
} from '@/lib/enterprise-positions';

type Step = 1 | 2 | 3 | 4;

export default function CompanyOnboardingPage() {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ownerTitle, setOwnerTitle] = useState('Founder');
  const [band, setBand] = useState<(typeof EMPLOYEE_BANDS)[number]['key']>('SMALL');
  const [departments, setDepartments] = useState<DepartmentKey[]>(
    DEPARTMENTS.filter((d) => d.defaultChecked).map((d) => d.key)
  );
  const [positionKeys, setPositionKeys] = useState<string[]>(() =>
    POSITION_TEMPLATES.filter((p) => p.defaultChecked).map((p) => p.key)
  );
  const [customName, setCustomName] = useState('');
  const [customPositions, setCustomPositions] = useState<{ name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logoColor = useMemo(() => letterAvatarColor(name || 'Company'), [name]);
  const initial = companyInitial(name || 'E');

  const availablePositions = useMemo(
    () => positionsForDepartments(departments, true),
    [departments]
  );

  function toggleDept(key: DepartmentKey) {
    setDepartments((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Sync default positions for newly added depts
      const defaults = positionsForDepartments(next, true)
        .filter((p) => p.defaultChecked)
        .map((p) => p.key);
      setPositionKeys((pk) => {
        const keep = pk.filter((k) => {
          const t = POSITION_TEMPLATES.find((p) => p.key === k);
          if (!t) return true;
          if (t.department === 'leadership') return true;
          return next.includes(t.department as DepartmentKey);
        });
        return Array.from(new Set([...keep, ...defaults]));
      });
      return next;
    });
  }

  function togglePosition(key: string) {
    setPositionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function onLogoFile(file: File | null) {
    if (!file) {
      setLogoUrl(null);
      return;
    }
    if (file.size > 400_000) {
      setError('Logo must be under 400KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function addCustom() {
    const n = customName.trim();
    if (n.length < 2) return;
    setCustomPositions((p) => [...p, { name: n }]);
    setCustomName('');
  }

  async function finish() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logoUrl,
          employeeBand: band,
          departments,
          positionKeys,
          customPositions,
          ownerTitle,
          seedBoards: true,
        }),
      });
      const { ok, data, error: apiError } = await readJson<{
        data?: { workspace?: { id: string } };
        error?: string;
      }>(res);
      if (!ok) throw new Error(apiError || t('auth.errors.generic'));
      const id = data?.data?.workspace?.id;
      router.push(id ? `/workspace/${id}` : '/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  const card = {
    backgroundColor: panelFill(isDark),
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
  } as const;
  const inputStyle = {
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
    color: isDark ? 'white' : 'black',
  } as const;
  const muted = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const text = isDark ? 'white' : 'black';

  return (
    <main
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: canvasBg(isDark) }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex items-center justify-center px-3 xs:px-4 sm:px-6 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <div className="w-full max-w-xl p-5 sm:p-8 md:p-10 rounded-[28px] backdrop-blur-2xl" style={card}>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher size="sm" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: muted }}>
            {t('onboarding.companyTitle')} · {step}/4
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ color: text }}>
            {step === 1 ? t('onboarding.companyTitle') : step === 2 ? 'Company size' : step === 3 ? 'Departments' : 'Positions & your title'}
          </h1>
          <p className="text-sm mb-6" style={{ color: muted }}>
            {step === 1
              ? t('onboarding.companySubtitle')
              : step === 2
                ? 'Helps us set seat defaults and templates.'
                : step === 3
                  ? 'We seed roles and starter boards from what you check.'
                  : 'Pick default enterprise positions — you can add more later in Roles.'}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <input
                required
                placeholder={t('onboarding.companyName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
                style={inputStyle}
              />
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 text-xl font-black"
                  style={{
                    background: logoUrl ? 'transparent' : logoColor,
                    color: '#fff',
                  }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1" style={{ color: text }}>
                    Logo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
                    className="text-xs w-full"
                    style={{ color: muted }}
                  />
                  <p className="text-[11px] mt-1" style={{ color: muted }}>
                    No logo? We use the letter “{initial}” like Google / Trello.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMPLOYEE_BANDS.map((b) => {
                const active = band === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setBand(b.key)}
                    className="text-left px-4 py-3 rounded-2xl transition-colors"
                    style={{
                      border: `1px solid ${active ? (isDark ? '#fff' : '#000') : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                      background: active ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
                      color: text,
                    }}
                  >
                    <span className="font-semibold block">{b.label}</span>
                    <span className="text-xs" style={{ color: muted }}>
                      ~{b.seatHint} seats
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {DEPARTMENTS.map((d) => {
                const checked = departments.includes(d.key);
                return (
                  <label
                    key={d.key}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl cursor-pointer"
                    style={{
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                      background: checked ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDept(d.key)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold block" style={{ color: text }}>
                        {d.label}
                      </span>
                      <span className="text-xs" style={{ color: muted }}>
                        {d.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: text }}>
                  Your title in this company
                </label>
                <select
                  value={ownerTitle}
                  onChange={(e) => setOwnerTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
                  style={inputStyle}
                >
                  <option value="Founder">Founder</option>
                  <option value="CEO">CEO</option>
                  <option value="Founder & CEO">Founder & CEO</option>
                  <option value="Managing Director">Managing Director</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: muted }}>
                  You remain Workspace Owner with full permissions. Title is for display & invites.
                </p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availablePositions.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-start gap-3 px-3 py-2 rounded-xl cursor-pointer"
                    style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
                  >
                    <input
                      type="checkbox"
                      checked={positionKeys.includes(p.key)}
                      onChange={() => togglePosition(p.key)}
                      className="mt-1"
                    />
                    <span>
                      <span className="text-sm font-medium" style={{ color: text }}>
                        {p.name}
                      </span>
                      <span className="block text-[11px]" style={{ color: muted }}>
                        {p.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  placeholder="Add custom position…"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
                >
                  Add
                </button>
              </div>
              {customPositions.length > 0 && (
                <ul className="text-xs space-y-1" style={{ color: muted }}>
                  {customPositions.map((c) => (
                    <li key={c.name}>+ {c.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="px-5 py-3 rounded-2xl font-semibold"
                style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, color: text }}
              >
                {t('common.back')}
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                disabled={step === 1 && name.trim().length < 2}
                onClick={() => {
                  if (step === 3 && departments.length === 0) {
                    setError(t('auth.errors.required'));
                    return;
                  }
                  setError(null);
                  setStep((s) => (s + 1) as Step);
                }}
                className="flex-1 py-3 rounded-2xl font-bold disabled:opacity-50"
                style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
              >
                {t('auth.continue')}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || positionKeys.length === 0}
                onClick={() => void finish()}
                className="flex-1 py-3 rounded-2xl font-bold disabled:opacity-50"
                style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
              >
                {loading ? t('common.loading') : t('onboarding.create')}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
