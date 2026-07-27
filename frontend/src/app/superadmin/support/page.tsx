'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
} from '@/components/SafeDashboard/theme';

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  updatedAt: string;
  user: { name: string | null; email: string };
  _count?: { messages: number };
};

export default function SuperAdminSupportPage() {
  const { theme, primaryColor } = useTheme();
  const isDark = theme === 'dark';
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/superadmin/tickets${q}`);
    const json = await res.json();
    if (res.ok) setTickets(json.data || []);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl">
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>
          Super Admin / Support
        </p>
        <h1 className="text-2xl font-bold" style={{ color: pri }}>
          Support inbox
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: filter === s ? `rgba(var(--primary-rgb),0.15)` : surfaceItem(isDark),
              color: filter === s ? primaryColor : mut,
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/superadmin/support/${t.id}`}
              className="block rounded-2xl p-4 transition-colors"
              style={{
                ...glassStyle(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: pri }}>
                    {t.subject}
                  </p>
                  <p className="text-xs mt-1" style={{ color: mut }}>
                    {t.user.name || t.user.email} · {t.category} ·{' '}
                    {t._count?.messages || 0} messages
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
                  style={{
                    background: `rgba(var(--primary-rgb),0.12)`,
                    color: primaryColor,
                  }}
                >
                  {t.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: mut }}>
            No tickets
          </p>
        )}
      </ul>
    </div>
  );
}
