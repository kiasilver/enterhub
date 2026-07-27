'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';
import { PLANS, type PlanCode } from '@/lib/plans-catalog';

export default function SaPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [catalog, setCatalog] = useState(() =>
    Object.fromEntries(
      (Object.keys(PLANS) as PlanCode[]).map((k) => [
        k,
        {
          priceMonthlyUsd: PLANS[k].priceMonthlyUsd,
          priceYearlyUsd: PLANS[k].priceYearlyUsd,
          priceMonthly: PLANS[k].priceMonthly,
          priceYearly: PLANS[k].priceYearly,
        },
      ]),
    ),
  );
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/superadmin/settings');
    const json = await res.json();
    if (res.ok && json.data?.settings?.plansCatalogJson) {
      setCatalog(json.data.settings.plansCatalogJson as typeof catalog);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    await fetch('/api/superadmin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plansCatalogJson: catalog }),
    });
    setMsg('Plan overrides saved (stored in PlatformSettings)');
  }

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          Plans editor
        </h1>
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          Edit list/sale prices. Tenant force-plan and +2/+3 bonus days live on each tenant detail.
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {(Object.keys(PLANS) as PlanCode[]).map((code) => (
            <div key={code} className="rounded-2xl p-4 space-y-2" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
              <h2 className="font-bold" style={{ color: textPrimary(isDark) }}>
                {PLANS[code].nameEn}
              </h2>
              {(
                [
                  ['priceMonthlyUsd', 'USD / mo'],
                  ['priceYearlyUsd', 'USD / yr'],
                  ['priceMonthly', 'Toman / mo'],
                  ['priceYearly', 'Toman / yr'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs" style={{ color: textSecondary(isDark) }}>
                  {label}
                  <input
                    type="number"
                    value={(catalog[code] as Record<string, number>)[key] ?? 0}
                    onChange={(e) =>
                      setCatalog((prev) => ({
                        ...prev,
                        [code]: {
                          ...prev[code],
                          [key]: Number(e.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg px-2 py-1.5 outline-none"
                    style={{ border: `1px solid ${borderSubtle(isDark)}`, background: 'transparent', color: textPrimary(isDark) }}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => void save()} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-blue-600">
          Save overrides
        </button>
        {msg && <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>}
      </div>
    </SuperAdminShell>
  );
}
