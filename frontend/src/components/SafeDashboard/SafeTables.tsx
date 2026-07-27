'use client';

import { useState, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { Search, ChevronUp, ChevronDown, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle, tableRowBg } from './theme';

interface Props {
  isDark: boolean;
}

type Status = 'active' | 'pending' | 'offline';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  status: Status;
  projects: number;
  avatar: string;
}

const MEMBERS: Member[] = [
  { id: 1, name: 'Ali Mohammadi', email: 'ali.mohammadi@enterhub.co', role: 'Safety Manager', status: 'active', projects: 42, avatar: '/profile.png' },
  { id: 2, name: 'Sarah Jenkins', email: 'sarah.jenkins@enterhub.co', role: 'Lead Inspector', status: 'active', projects: 128, avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 3, name: 'Mark Davis', email: 'mark.davis@enterhub.co', role: 'Field Officer', status: 'offline', projects: 85, avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { id: 4, name: 'Elena Rostova', email: 'elena.rostova@enterhub.co', role: 'Compliance Expert', status: 'active', projects: 210, avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 5, name: 'Michael Chang', email: 'michael.chang@enterhub.co', role: 'Safety Analyst', status: 'pending', projects: 34, avatar: 'https://randomuser.me/api/portraits/men/76.jpg' },
  { id: 6, name: 'Jessica Smith', email: 'jessica.smith@enterhub.co', role: 'Auditor', status: 'offline', projects: 92, avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
];

const STATUS_META: Record<Status, { color: string; label: string }> = {
  active: { color: 'var(--accent-emerald)', label: 'Active' },
  pending: { color: 'var(--accent-amber)', label: 'Pending' },
  offline: { color: 'var(--accent-slate)', label: 'Offline' },
};

const INVOICES: { id: string; client: string; amount: string; status: 'Paid' | 'Pending' | 'Overdue'; date: string }[] = [
  { id: 'INV-1042', client: 'Acme Corp', amount: '$2,400', status: 'Paid', date: 'Oct 24, 2024' },
  { id: 'INV-1041', client: 'Globex', amount: '$1,150', status: 'Pending', date: 'Oct 22, 2024' },
  { id: 'INV-1040', client: 'Initech', amount: '$3,800', status: 'Paid', date: 'Oct 19, 2024' },
  { id: 'INV-1039', client: 'Umbrella', amount: '$640', status: 'Overdue', date: 'Oct 15, 2024' },
];

const INVOICE_COLOR: Record<string, string> = {
  Paid: 'var(--accent-emerald)',
  Pending: 'var(--accent-amber)',
  Overdue: 'var(--accent-rose)',
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

type SortKey = 'name' | 'projects';

export default function SafeTables({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MEMBERS.filter((m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => {
      const cmp = sortKey === 'name' ? a.name.localeCompare(b.name) : a.projects - b.projects;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [query, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} style={{ opacity: 0.5 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const th = 'text-[11px] font-bold uppercase tracking-wider text-left py-3 px-4';

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-5 sm:py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Base UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Tables</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Structured data with search, sorting, and status indicators.</p>
      </motion.div>

      <div className="max-w-4xl">

        {/* Data table */}
        <motion.section variants={item} className="mb-8">
          <h3 className="text-sm font-semibold mb-0.5" style={{ color: pri }}>Data table</h3>
          <p className="text-xs mb-3.5" style={{ color: mut }}>Search the team and sort by name or project count.</p>

          <div className="rounded-2xl overflow-hidden" style={glassStyle(isDark)}>
            {/* Toolbar */}
            <div className="p-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full max-w-xs" style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}>
                <Search size={15} style={{ color: mut, flexShrink: 0 }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="bg-transparent outline-none border-none text-sm w-full" style={{ color: pri }} />
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: mut }}>{rows.length} of {MEMBERS.length}</span>
            </div>

            {/* Mobile: stacked cards so every field stays visible */}
            <div className="md:hidden divide-y" style={{ borderColor: border }}>
              {rows.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: mut }}>No members match your search.</div>
              ) : rows.map((m) => {
                const st = STATUS_META[m.status];
                return (
                  <div key={m.id} className="p-4 flex items-start gap-3">
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `1px solid ${border}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: pri }}>{m.name}</p>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${st.color}1f`, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} /> {st.label}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: mut }}>{m.email}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[13px]">
                        <span style={{ color: sec }}>{m.role}</span>
                        <span className="font-semibold" style={{ color: pri }}>{m.projects} <span className="text-xs font-normal" style={{ color: mut }}>projects</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[340px] sm:min-w-[560px] border-collapse">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className={th} style={{ color: mut }}>
                      <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1.5 uppercase" style={{ color: sortKey === 'name' ? pri : mut }}>Member <SortIcon k="name" /></button>
                    </th>
                    <th className={`${th} hidden sm:table-cell`} style={{ color: mut }}>Role</th>
                    <th className={th} style={{ color: mut }}>Status</th>
                    <th className={`${th} text-right`} style={{ color: mut }}>
                      <button onClick={() => toggleSort('projects')} className="inline-flex items-center gap-1.5 uppercase" style={{ color: sortKey === 'projects' ? pri : mut }}>Projects <SortIcon k="projects" /></button>
                    </th>
                    <th className={`${th} w-10`}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, i) => {
                    const st = STATUS_META[m.status];
                    const rowBg = tableRowBg(isDark, i);
                    return (
                      <tr
                        key={m.id}
                        className="transition-colors"
                        style={{ borderBottom: `1px solid ${border}`, background: rowBg }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ border: `1px solid ${border}` }} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold truncate" style={{ color: pri }}>{m.name}</p>
                              <p className="text-xs truncate" style={{ color: mut }}>{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-[13px]" style={{ color: sec }}>{m.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${st.color}1f`, color: st.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} /> {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[13px] font-semibold" style={{ color: pri }}>{m.projects}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button aria-label="Row actions" className="p-1 rounded-md transition-colors" style={{ color: mut }} onMouseEnter={(e) => { e.currentTarget.style.color = pri; }} onMouseLeave={(e) => { e.currentTarget.style.color = mut; }}>
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm" style={{ color: mut }}>No members match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Striped table */}
        <motion.section variants={item} className="mb-8">
          <h3 className="text-sm font-semibold mb-0.5" style={{ color: pri }}>Striped table</h3>
          <p className="text-xs mb-3.5" style={{ color: mut }}>A compact, zebra-striped layout for dense data.</p>

          <div className="rounded-2xl overflow-hidden" style={glassStyle(isDark)}>
            {/* Mobile: stacked cards */}
            <div className="md:hidden divide-y" style={{ borderColor: border }}>
              {INVOICES.map((inv) => {
                const c = INVOICE_COLOR[inv.status];
                return (
                  <div key={inv.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: pri }}>{inv.id}</p>
                      <p className="text-xs truncate" style={{ color: sec }}>{inv.client}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: mut }}>{inv.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: pri }}>{inv.amount}</p>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block mt-1" style={{ background: `${c}1f`, color: c }}>{inv.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[320px] sm:min-w-[480px] border-collapse">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className={th} style={{ color: mut }}>Invoice</th>
                    <th className={th} style={{ color: mut }}>Client</th>
                    <th className={`${th} hidden sm:table-cell`} style={{ color: mut }}>Date</th>
                    <th className={th} style={{ color: mut }}>Status</th>
                    <th className={`${th} text-right`} style={{ color: mut }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICES.map((inv, i) => {
                    const c = INVOICE_COLOR[inv.status];
                    return (
                      <tr key={inv.id} style={{ background: tableRowBg(isDark, i) }}>
                        <td className="py-3 px-4 text-[13px] font-semibold" style={{ color: pri }}>{inv.id}</td>
                        <td className="py-3 px-4 text-[13px]" style={{ color: sec }}>{inv.client}</td>
                        <td className="py-3 px-4 text-[13px] hidden sm:table-cell" style={{ color: mut }}>{inv.date}</td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${c}1f`, color: c }}>{inv.status}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-[13px] font-semibold" style={{ color: pri }}>{inv.amount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
}
