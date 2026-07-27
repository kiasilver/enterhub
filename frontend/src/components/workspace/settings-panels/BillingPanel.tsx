'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
import {
  CLOUD_PACK_OPTIONS_MB,
  SEAT_OPTIONS,
  PLANS,
  yearlyPriceForSeats,
  extraCloudPriceToman,
  formatToman,
  formatMb,
  includedStorageForSeats,
  giftSeatsFor,
  guestSeatsFor,
  type PlanCode,
} from '@/lib/plans-catalog';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

const PLAN_COLORS: Record<PlanCode, string> = {
  FREE: '#22c55e',
  PRO: '#3b82f6',
  ENTERPRISE: '#8b5cf6',
};

export default function BillingPanel() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme, primaryColor } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const moneyLoc = lang === 'fa' ? 'fa' : 'en';

  const [plan, setPlan] = useState<PlanCode>('FREE');
  const [seats, setSeats] = useState(10);
  const [extraMb, setExtraMb] = useState(0);
  const [cloudOnly, setCloudOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState('');

  const [cards, setCards] = useState<
    { id: string; holderName: string; bankName: string; cardNumber: string; last4: string }[]
  >([]);
  const [pendingPurchaseId, setPendingPurchaseId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, uRes, cRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/plan/configure`),
      fetch(`/api/workspaces/${workspaceId}/usage`),
      fetch('/api/superadmin/payments/cards'),
    ]);
    const pJson = await pRes.json();
    const uJson = await uRes.json();
    const cJson = await cRes.json();
    if (pRes.ok && pJson.data?.current) {
      const c = pJson.data.current;
      setPlan(c.planTier);
      setSeats(c.seatLimit || 10);
      setExtraMb(c.extraStorageMb || 0);
    }
    if (uRes.ok) setUsageLabel(uJson.data?.labels?.storageLabel || '');
    if (cRes.ok) {
      const list = (cJson.data || []).filter((x: { isActive?: boolean }) => x.isActive !== false);
      setCards(list);
      if (list[0]) setSelectedCardId(list[0].id);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const estimate = useMemo(() => {
    if (cloudOnly) return { sale: extraCloudPriceToman(extraMb), list: 0 };
    const y = yearlyPriceForSeats(plan, seats);
    return { list: y.list, sale: y.sale + extraCloudPriceToman(extraMb) };
  }, [plan, seats, extraMb, cloudOnly]);

  const includedMb =
    plan === 'FREE' ? PLANS.FREE.includedStorageMb : includedStorageForSeats(plan, seats);

  async function apply() {
    setBusy(true);
    setError(null);
    setOk(null);

    // Free / cloud-only can apply immediately; paid plans go through C2C
    if (cloudOnly || plan === 'FREE') {
      const res = await fetch(`/api/workspaces/${workspaceId}/plan/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudOnly,
          planTier: cloudOnly ? undefined : plan,
          seats: cloudOnly ? undefined : seats,
          extraStorageMb: extraMb,
          activate: true,
        }),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(json.error || 'Failed');
        return;
      }
      setOk('Plan saved');
      await load();
      return;
    }

    const res = await fetch(`/api/workspaces/${workspaceId}/billing/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planTier: plan,
        seats,
        billingCycle: 'yearly',
        cloudPackMb: extraMb,
        currency: 'IRR',
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Failed to start purchase');
      return;
    }
    setPendingPurchaseId(json.data.id);
    setOk('Transfer to a card below, then upload your receipt for review.');
  }

  async function uploadReceipt() {
    if (!pendingPurchaseId || !receiptFile) {
      setError('Choose a receipt image');
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.append('receipt', receiptFile);
    if (selectedCardId) fd.append('bankCardId', selectedCardId);
    fd.append('amountClaimed', String(estimate.sale));
    const res = await fetch(
      `/api/workspaces/${workspaceId}/billing/purchases/${pendingPurchaseId}/receipt`,
      { method: 'POST', body: fd },
    );
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Upload failed');
      return;
    }
    setOk('Receipt submitted — waiting for Super Admin approval.');
    setPendingPurchaseId(null);
    setReceiptFile(null);
  }

  const field = {
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  if (loading) {
    return (
      <SettingsGlassCard accent="#06b6d4">
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          {t('common.loading')}
        </p>
      </SettingsGlassCard>
    );
  }

  return (
    <div className="w-full space-y-5">
      <SettingsGlassCard accent="#06b6d4">
        <SettingsSectionTitle
          title={t('billing.title')}
          subtitle={
            lang === 'fa'
              ? 'پلن، تعداد صندلی یا فضای ابری را انتخاب کنید. پلن‌های پولی با کارت‌به‌کارت بررسی می‌شوند.'
              : 'Pick a plan, seat count, or add cloud storage. Paid plans use card-to-card (C2C) review.'
          }
          badge={usageLabel ? `Used ${usageLabel}` : undefined}
          badgeColor="#06b6d4"
        />

        <div className="flex gap-2 flex-wrap mb-5">
          {[
            { on: !cloudOnly, label: 'Change plan / seats', color: '#3b82f6', fn: () => setCloudOnly(false) },
            { on: cloudOnly, label: 'Cloud add-on only', color: '#ec4899', fn: () => setCloudOnly(true) },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.fn}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-transform hover:scale-[1.02]"
              style={{
                background: b.on ? b.color : hexToRgba(b.color, isDark ? 0.15 : 0.1),
                color: b.on ? '#fff' : b.color,
                border: `1px solid ${hexToRgba(b.color, 0.4)}`,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {!cloudOnly && (
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            {(Object.keys(PLANS) as PlanCode[]).map((code) => {
              const p = PLANS[code];
              const color = PLAN_COLORS[code];
              const active = plan === code;
              const price = yearlyPriceForSeats(code, code === 'FREE' ? 5 : seats);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setPlan(code);
                    if (code === 'FREE') setSeats(5);
                    else if (seats < 10) setSeats(10);
                  }}
                  className="text-left rounded-2xl p-4 space-y-2 transition-transform hover:scale-[1.01]"
                  style={{
                    background: active ? hexToRgba(color, isDark ? 0.22 : 0.12) : surfaceItem(isDark),
                    border: `1px solid ${active ? hexToRgba(color, 0.6) : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    boxShadow: active ? `0 0 0 3px ${hexToRgba(color, 0.15)}` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <p className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>
                      {lang === 'fa' ? p.nameFa : p.nameEn}
                    </p>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: textSecondary(isDark) }}>
                    {lang === 'fa' ? p.taglineFa : p.taglineEn}
                  </p>
                  <p className="text-base font-bold" style={{ color }}>
                    {p.priceYearly === 0
                      ? lang === 'fa'
                        ? 'رایگان برای همیشه'
                        : 'Free forever'
                      : `${formatToman(price.sale, moneyLoc)} / ${lang === 'fa' ? 'سال' : 'yr'}`}
                  </p>
                  {p.listPriceYearly > p.priceYearly && (
                    <p className="text-[11px] line-through" style={{ color: textMuted(isDark) }}>
                      {formatToman(price.list, moneyLoc)}
                    </p>
                  )}
                  {p.priceMonthly > 0 && (
                    <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                      {formatToman(p.priceMonthly, moneyLoc)} /{' '}
                      {lang === 'fa' ? 'ماه' : 'mo'}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!cloudOnly && plan !== 'FREE' && (
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: textSecondary(isDark) }}>
              Seat count
            </p>
            <div className="flex flex-wrap gap-2">
              {SEAT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeats(n)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: seats === n ? PLAN_COLORS[plan] : surfaceItem(isDark),
                    color: seats === n ? '#fff' : textPrimary(isDark),
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-2" style={{ color: textMuted(isDark) }}>
              +{giftSeatsFor(plan, seats)} gift seats
              {guestSeatsFor(plan) > 0 ? ` · +${guestSeatsFor(plan)} guests` : ''}
              {' · '}
              Included cloud: {formatMb(includedMb, moneyLoc)}
            </p>
          </div>
        )}

        <div className="mb-5">
          <p className="text-xs font-semibold mb-2" style={{ color: textSecondary(isDark) }}>
            Extra cloud storage (optional — upgrade anytime)
          </p>
          <select
            value={extraMb}
            onChange={(e) => setExtraMb(Number(e.target.value))}
            className="w-full max-w-lg px-3 py-2.5 rounded-xl text-sm outline-none"
            style={field}
          >
            {CLOUD_PACK_OPTIONS_MB.map((mb) => (
              <option key={mb} value={mb} style={{ color: '#000' }}>
                {mb === 0
                  ? 'No extra storage'
                  : `${formatMb(mb, moneyLoc)} — ${formatToman(extraCloudPriceToman(mb), moneyLoc)} / ${lang === 'fa' ? 'سال' : 'year'}`}
              </option>
            ))}
          </select>
        </div>

        <div
          className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, isDark ? 0.25 : 0.12)}, ${hexToRgba('#8b5cf6', isDark ? 0.2 : 0.1)})`,
            border: `1px solid ${hexToRgba(primaryColor, 0.35)}`,
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
              Yearly estimate
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: textPrimary(isDark) }}>
              {estimate.sale === 0
                ? lang === 'fa'
                  ? 'رایگان'
                  : 'Free'
                : formatToman(estimate.sale, moneyLoc)}
            </p>
            {!cloudOnly && plan === 'FREE' && (
              <p className="text-[11px] mt-1" style={{ color: textSecondary(isDark) }}>
                5 users · 150 MB · forever
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void apply()}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #8b5cf6)` }}
          >
            {busy
              ? 'Saving…'
              : cloudOnly
                ? 'Buy cloud add-on'
                : plan === 'FREE'
                  ? 'Activate free plan'
                  : 'Pay via card-to-card'}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {ok && <p className="text-sm mt-3" style={{ color: '#22c55e' }}>{ok}</p>}
      </SettingsGlassCard>

      {(pendingPurchaseId || cards.length > 0) && plan !== 'FREE' && !cloudOnly && (
        <SettingsGlassCard accent="#f59e0b">
          <SettingsSectionTitle
            title={t('billing.payC2c')}
            subtitle={
              lang === 'fa'
                ? 'مبلغ را به یکی از کارت‌ها واریز کنید، سپس رسید را آپلود کنید. سوپرادمین تأیید یا رد را با دلیل در صندوق پیام شما می‌فرستد.'
                : 'Transfer the amount to one of these cards, then upload your receipt. Super Admin will approve or reject with a reason in your Inbox.'
            }
          />
          <div className="space-y-2 mb-4">
            {cards.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer"
                style={{ background: surfaceItem(isDark), border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}
              >
                <input
                  type="radio"
                  name="bankCard"
                  checked={selectedCardId === c.id}
                  onChange={() => setSelectedCardId(c.id)}
                />
                <span style={{ color: textPrimary(isDark) }}>
                  <strong>{c.bankName}</strong> · {c.holderName}
                  <span className="block text-xs font-mono" style={{ color: textMuted(isDark) }}>
                    {c.cardNumber}
                  </span>
                </span>
              </label>
            ))}
            {cards.length === 0 && (
              <p className="text-sm" style={{ color: textMuted(isDark) }}>
                No bank cards configured yet. Contact support.
              </p>
            )}
          </div>
          {pendingPurchaseId && (
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="text-xs"
                style={{ color: textSecondary(isDark) }}
              />
              <button
                type="button"
                disabled={busy || !receiptFile}
                onClick={() => void uploadReceipt()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#f59e0b' }}
              >
                {t('billing.uploadReceipt')}
              </button>
            </div>
          )}
        </SettingsGlassCard>
      )}

      {!cloudOnly && plan !== 'FREE' && (
        <SettingsGlassCard accent={PLAN_COLORS[plan]}>
          <SettingsSectionTitle
            title={`${lang === 'fa' ? PLANS[plan].nameFa : PLANS[plan].nameEn} — ${lang === 'fa' ? 'قابلیت‌ها' : 'features'}`}
            subtitle={lang === 'fa' ? PLANS[plan].taglineFa : PLANS[plan].taglineEn}
          />
          <ul className="grid sm:grid-cols-2 gap-2">
            {(lang === 'fa' ? PLANS[plan].featuresFa : PLANS[plan].featuresEn).map((f) => (
              <li
                key={f}
                className="text-xs flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PLAN_COLORS[plan] }} />
                {f}
              </li>
            ))}
          </ul>
        </SettingsGlassCard>
      )}
    </div>
  );
}
