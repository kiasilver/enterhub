'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, glassDropdown, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  leadScore: 'Hot' | 'Warm' | 'Cold';
  lastContact: string;
  status: 'Active' | 'Inactive';
}

interface ContactsViewProps {
  isDark: boolean;
}

const INITIAL_CONTACTS: Contact[] = [
  { id: 'CON-001', name: 'Ali Mohammadi', email: 'ali@enterhub.com', phone: '+98 912 345 6789', company: 'Persian Gas Corp', leadScore: 'Hot', lastContact: 'June 18, 2026', status: 'Active' },
  { id: 'CON-002', name: 'Sarah Jenkins', email: 's.jenkins@safetydrill.co', phone: '+1 (555) 019-2834', company: 'DrillTech Solutions', leadScore: 'Warm', lastContact: 'June 17, 2026', status: 'Active' },
  { id: 'CON-003', name: 'Mark Davis', email: 'm.davis@compliance.org', phone: '+1 (555) 014-9921', company: 'Global Compliance Inc', leadScore: 'Cold', lastContact: 'June 10, 2026', status: 'Inactive' },
  { id: 'CON-004', name: 'Zahra Alavi', email: 'zahra@enterhub.com', phone: '+98 912 987 6543', company: 'Tehran Fire Safety', leadScore: 'Hot', lastContact: 'June 19, 2026', status: 'Active' },
  { id: 'CON-005', name: 'David Smith', email: 'dsmith@safetyfirst.net', phone: '+44 20 7946 0958', company: 'SafetyFirst Ltd', leadScore: 'Warm', lastContact: 'June 15, 2026', status: 'Active' },
];

export default function ContactsView({ isDark }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
  
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [leadScore, setLeadScore] = useState<Contact['leadScore']>('Warm');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLead = leadFilter === 'All' ? true : c.leadScore === leadFilter;
      return matchesSearch && matchesLead;
    });
  }, [contacts, searchQuery, leadFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newContact: Contact = {
      id: `CON-00${contacts.length + 1}`,
      name,
      email,
      phone: phone || 'N/A',
      company: company || 'Self-employed',
      leadScore,
      lastContact: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
    };

    setContacts(prev => [newContact, ...prev]);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setLeadScore('Warm');
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const getScoreBadge = (score: Contact['leadScore']) => {
    switch (score) {
      case 'Hot':
        return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' };
      case 'Warm':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' };
      case 'Cold':
        return { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
    }
  };

  // Metrics calculation
  const totalCount = contacts.length;
  const hotLeadsCount = contacts.filter(c => c.leadScore === 'Hot').length;
  const activePercent = totalCount > 0 ? Math.round((contacts.filter(c => c.status === 'Active').length / totalCount) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>CRM / Contacts</h2>
          <p className="text-xs" style={{ color: sec }}>Manage Enterhub Safety accounts and team members</p>
        </div>
        <GlassButton onClick={() => setIsAddOpen(true)}>
          Add Contact
        </GlassButton>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-5 border flex items-center gap-4 cursor-default shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Total Contacts</span>
            <span className="text-2xl font-black block mt-0.5" style={{ color: pri }}>{totalCount}</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-5 border flex items-center gap-4 cursor-default shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Hot Leads</span>
            <span className="text-2xl font-black block mt-0.5 text-rose-500">{hotLeadsCount}</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-5 border flex items-center gap-4 cursor-default shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Active Ratio</span>
            <span className="text-2xl font-black block mt-0.5 text-emerald-500">{activePercent}%</span>
          </div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors border shadow-md" style={{ background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderColor: border }}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all duration-200 focus-within:border-primary w-full sm:w-auto" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), minWidth: 240 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-55">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search contact name, company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none border-none text-xs w-full"
              style={{ color: pri }}
            />
          </div>
          <CustomSelect
            value={leadFilter}
            onChange={setLeadFilter}
            isDark={isDark}
            options={[
              { value: 'All', label: 'All Scores' },
              { value: 'Hot', label: 'Hot Leads' },
              { value: 'Warm', label: 'Warm Leads' },
              { value: 'Cold', label: 'Cold Leads' },
            ]}
            className="min-w-[130px]"
          />
        </div>
        <div className="text-xs font-semibold" style={{ color: mut }}>
          Showing {filteredContacts.length} of {totalCount} contacts
        </div>
      </div>

      {/* Grid List Table */}
      <div className="overflow-x-auto rounded-2xl border shadow-lg" style={{ borderColor: border, background: bg }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <th className="p-4 font-bold">Contact Name</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Phone</th>
              <th className="p-4 font-bold">Company</th>
              <th className="p-4 font-bold text-center">Lead Score</th>
              <th className="p-4 font-bold">Last Contact</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filteredContacts.map((c, i) => {
                const b = getScoreBadge(c.leadScore);
                const initials = c.name.split(' ').map(n => n[0]).join('');
                return (
                  <motion.tr 
                    key={c.id} 
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} 
                    className="hover:bg-primary/[0.04] transition-colors"
                  >
                    <td className="p-4 font-semibold flex items-center gap-2.5" style={{ color: pri }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br from-primary to-purple-600 shadow-md">
                        {initials}
                      </div>
                      {c.name}
                    </td>
                    <td className="p-4" style={{ color: sec }}>{c.email}</td>
                    <td className="p-4" style={{ color: sec }}>{c.phone}</td>
                    <td className="p-4 font-medium" style={{ color: pri }}>{c.company}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border block w-fit mx-auto shadow-sm" style={{ background: b.bg, color: b.text, borderColor: b.border }}>
                        {c.leadScore}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: mut }}>{c.lastContact}</td>
                    <td className="p-4">
                      <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ background: c.status === 'Active' ? '#10b981' : '#6b7280' }} />
                      <span style={{ color: c.status === 'Active' ? pri : mut }} className="font-semibold">{c.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all duration-200 cursor-pointer opacity-60 hover:opacity-100"
                        title="Delete Contact"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-md p-6 rounded-2xl relative shadow-2xl border"
              style={glassDropdown(isDark)}
            >
              <button
                onClick={() => setIsAddOpen(false)}
                className="absolute top-4 right-4 text-xs hover:text-primary p-1.5 font-bold cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: mut }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Add New Contact</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Add new team member or client account details</p>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Zahra Alavi"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. zahra@enterhub.com"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +98 912..."
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Company</label>
                    <input
                      type="text"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Persian Gas Corp"
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Lead Score</label>
                  <CustomSelect
                    value={leadScore}
                    onChange={setLeadScore}
                    isDark={isDark}
                    options={[
                      { value: 'Hot', label: 'Hot (High Conversion)' },
                      { value: 'Warm', label: 'Warm (Medium Conversion)' },
                      { value: 'Cold', label: 'Cold (Low Conversion)' },
                    ]}
                  />
                </div>

                <GlassButton type="submit" className="w-full mt-2 justify-center">
                  Create Contact
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
