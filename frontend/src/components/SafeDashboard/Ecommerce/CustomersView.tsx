'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from '../theme';

interface Customer {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  joinDate: string;
  complianceRating: 'Excellent' | 'Good' | 'Fair';
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'CUST-301', name: 'Ali Mohammadi', email: 'ali@enterhub.com', ordersCount: 14, totalSpent: 2840.00, joinDate: 'Jan 12, 2026', complianceRating: 'Excellent' },
  { id: 'CUST-302', name: 'Sarah Jenkins', email: 's.jenkins@safetydrill.co', ordersCount: 8, totalSpent: 1950.00, joinDate: 'Feb 15, 2026', complianceRating: 'Excellent' },
  { id: 'CUST-303', name: 'Mark Davis', email: 'm.davis@compliance.org', ordersCount: 3, totalSpent: 590.00, joinDate: 'Mar 01, 2026', complianceRating: 'Good' },
  { id: 'CUST-304', name: 'David Smith', email: 'dsmith@safetyfirst.net', ordersCount: 1, totalSpent: 120.00, joinDate: 'Jun 05, 2026', complianceRating: 'Fair' },
];

interface CustomersViewProps {
  isDark: boolean;
}

export default function CustomersView({ isDark }: CustomersViewProps) {
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Customers</h2>
        <p className="text-xs" style={{ color: sec }}>Manage corporate safety clients and purchase metrics</p>
      </div>

      {/* Mobile: stacked cards (one per client) */}
      <div className="md:hidden space-y-3">
        {customers.map(c => {
          const ratingStyle = {
            background: c.complianceRating === 'Excellent' ? 'rgba(16,185,129,0.12)' : c.complianceRating === 'Good' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
            color: c.complianceRating === 'Excellent' ? '#10b981' : c.complianceRating === 'Good' ? '#f59e0b' : '#ef4444',
            borderColor: c.complianceRating === 'Excellent' ? 'rgba(16,185,129,0.2)' : c.complianceRating === 'Good' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
          };
          return (
            <div key={c.id} className="rounded-2xl border p-4 space-y-3" style={{ borderColor: border, background: bg }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: pri }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: sec }}>{c.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0" style={ratingStyle}>{c.complianceRating}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                <div>
                  <p className="text-[10px] uppercase font-bold" style={{ color: mut }}>Orders</p>
                  <p className="text-sm font-bold" style={{ color: pri }}>{c.ordersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold" style={{ color: mut }}>Spent</p>
                  <p className="text-sm font-bold text-primary" style={{ color: 'var(--primary)' }}>${c.totalSpent.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold" style={{ color: mut }}>Joined</p>
                  <p className="text-xs font-semibold" style={{ color: sec }}>{c.joinDate}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet / desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border" style={{ borderColor: border, background: bg }}>
        <table className="w-full min-w-[640px] text-left text-xs whitespace-nowrap">
          <thead>
            <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <th className="p-4 font-bold">Client Name</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Orders</th>
              <th className="p-4 font-bold">LTV / Total Spent</th>
              <th className="p-4 font-bold">Join Date</th>
              <th className="p-4 font-bold">Compliance Rating</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} className="hover:bg-primary/5 transition-colors">
                <td className="p-4 font-bold" style={{ color: pri }}>{c.name}</td>
                <td className="p-4" style={{ color: sec }}>{c.email}</td>
                <td className="p-4" style={{ color: pri }}>{c.ordersCount}</td>
                <td className="p-4 font-semibold text-primary" style={{ color: 'var(--primary)' }}>${c.totalSpent.toFixed(2)}</td>
                <td className="p-4" style={{ color: mut }}>{c.joinDate}</td>
                <td className="p-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{
                    background: c.complianceRating === 'Excellent' ? 'rgba(16,185,129,0.12)' : c.complianceRating === 'Good' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                    color: c.complianceRating === 'Excellent' ? '#10b981' : c.complianceRating === 'Good' ? '#f59e0b' : '#ef4444',
                    borderColor: c.complianceRating === 'Excellent' ? 'rgba(16,185,129,0.2)' : c.complianceRating === 'Good' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                  }}>
                    {c.complianceRating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
