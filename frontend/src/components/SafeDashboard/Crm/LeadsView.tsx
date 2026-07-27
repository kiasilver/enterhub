'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceHover, surfaceItem, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: 'Web Search' | 'Referral' | 'Direct Email' | 'LinkedIn';
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified';
  value: number;
}

interface LeadsViewProps {
  isDark: boolean;
}

const INITIAL_LEADS: Lead[] = [
  { id: 'LEAD-201', name: 'Ramin Rezaei', email: 'ramin@gaspars.ir', company: 'GasPars IR', source: 'Referral', priority: 'High', status: 'New', value: 15000 },
  { id: 'LEAD-202', name: 'John Doe', email: 'j.doe@safetygear.com', company: 'GearTech Group', source: 'Web Search', priority: 'Medium', status: 'Contacted', value: 8500 },
  { id: 'LEAD-203', name: 'Sara Alavi', email: 'sara@firecheck.ir', company: 'FireCheck Tehran', source: 'LinkedIn', priority: 'High', status: 'Qualified', value: 35000 },
  { id: 'LEAD-204', name: 'Mark Davis', email: 'm.davis@compliance.org', company: 'Global Compliance Inc', source: 'Direct Email', priority: 'Low', status: 'Unqualified', value: 5000 },
];

export default function LeadsView({ isDark }: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [hoveredLeadId, setHoveredLeadId] = useState<string | null>(null);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState<Lead['source']>('Web Search');
  const [priority, setPriority] = useState<Lead['priority']>('Medium');
  const [value, setValue] = useState(0);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const getPriorityStyle = (p: Lead['priority']) => {
    switch (p) {
      case 'High': return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' };
      case 'Medium': return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' };
      case 'Low': return { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return '#c084fc';
      case 'Contacted': return '#3b82f6';
      case 'Qualified': return '#10b981';
      case 'Unqualified': return '#ef4444';
    }
  };

  const updateStatus = (id: string, nextStatus: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    const newLead: Lead = {
      id: `LEAD-${Math.floor(Math.random() * 900) + 205}`,
      name,
      email,
      company,
      source,
      priority,
      status: 'New',
      value: Number(value) || 5000,
    };

    setLeads(prev => [...prev, newLead]);
    setName('');
    setEmail('');
    setCompany('');
    setValue(0);
    setIsAddOpen(false);
  };

  // Metrics
  const totalCount = leads.length;
  const qualifiedCount = leads.filter(l => l.status === 'Qualified').length;
  const ratePercent = totalCount > 0 ? Math.round((qualifiedCount / totalCount) * 100) : 0;
  const totalLeadValue = leads.reduce((sum, l) => sum + l.value, 0);

  // SVG Gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratePercent / 100) * circumference;

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
          <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>CRM / Leads</h2>
          <p className="text-xs" style={{ color: sec }}>Track and qualify early safety project inquiries</p>
        </div>
        <GlassButton onClick={() => setIsAddOpen(true)}>
          Add Lead
        </GlassButton>
      </div>

      {/* SVG gauge and metrics banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SVG Circular Gauge Widget */}
        <div className="rounded-2xl p-5 border flex items-center justify-between shadow-lg" style={{ background: bg, borderColor: border }}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Qualified Conversion Rate</span>
            <span className="text-3xl font-black block" style={{ color: pri }}>{ratePercent}%</span>
            <span className="text-[9px]" style={{ color: mut }}>Targeting 40% HSE Qualification standard</span>
          </div>

          <div className="relative w-[100px] h-[100px] flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="8" />
              <motion.circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="transparent" 
                stroke="#10b981" 
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-black text-xs" style={{ color: pri }}>
              {qualifiedCount}/{totalCount}
            </div>
          </div>
        </div>

        {/* Lead Volume Metric */}
        <div className="rounded-2xl p-5 border flex flex-col justify-between min-h-[110px] shadow-lg" style={{ background: bg, borderColor: border }}>
          <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Leads Ingestion Volume</span>
          <div className="mt-2">
            <span className="text-2xl font-black block" style={{ color: pri }}>${totalLeadValue.toLocaleString()}</span>
            <span className="text-[9px]" style={{ color: mut }}>Total expected pipeline revenue from leads</span>
          </div>
        </div>

        {/* Source Channels */}
        <div className="rounded-2xl p-5 border flex flex-col justify-between min-h-[110px] shadow-lg" style={{ background: bg, borderColor: border }}>
          <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Top Channel Source</span>
          <div className="mt-2">
            <span className="text-2xl font-black block text-primary">LinkedIn Marketing</span>
            <span className="text-[9px]" style={{ color: mut }}>Generating 50% qualified HSE accounts</span>
          </div>
        </div>
      </div>

      {/* Grid list of leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <AnimatePresence initial={false}>
          {leads.map((lead, i) => {
            const pStyle = getPriorityStyle(lead.priority);
            const isHovered = hoveredLeadId === lead.id;
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                onMouseEnter={() => setHoveredLeadId(lead.id)}
                onMouseLeave={() => setHoveredLeadId(null)}
                className="p-5 rounded-2xl border flex flex-col justify-between min-h-[200px] transition-all duration-200 relative overflow-hidden shadow-lg"
                style={{ background: bg, borderColor: border }}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold" style={{ color: mut }}>{lead.id}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold border" style={{ background: pStyle.bg, color: pStyle.text, borderColor: pStyle.border }}>
                      {lead.priority} Priority
                    </span>
                  </div>
                  <h4 className="text-sm font-bold mt-3" style={{ color: pri }}>{lead.name}</h4>
                  <p className="text-[10px] mt-0.5" style={{ color: sec }}>{lead.company}</p>
                  <p className="text-[9px]" style={{ color: mut }}>Source: {lead.source}</p>
                </div>

                <div className="mt-4 pt-3.5 border-t flex justify-between items-center" style={{ borderColor: borderSubtle(isDark) }}>
                  <div>
                    <span className="text-[9px] block" style={{ color: mut }}>Value</span>
                    <span className="text-xs font-black block" style={{ color: pri }}>${lead.value.toLocaleString()}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5" style={{ background: `${getStatusColor(lead.status)}15`, color: getStatusColor(lead.status) }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: getStatusColor(lead.status) }} />
                    {lead.status}
                  </span>
                </div>

                {/* Hover slide action overlays */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 80, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute inset-x-0 bottom-0 p-4 border-t flex flex-col gap-2 justify-center"
                      style={{ 
                        background: panelFill(isDark),
                        borderColor: borderSubtle(isDark)
                      }}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: mut }}>Actions</p>
                      <div className="flex gap-2">
                        {lead.status !== 'Qualified' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'Qualified')}
                            className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer text-center"
                          >
                            Qualify
                          </button>
                        )}
                        {lead.status !== 'Contacted' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'Contacted')}
                            className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer text-center"
                          >
                            Contact
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(lead.id, 'Unqualified')}
                          className="text-[9px] font-bold py-1.5 px-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer text-center"
                        >
                          Disqualify
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-md p-6 rounded-2xl relative shadow-2xl border"
              style={{
                background: bg,
                borderColor: borderSubtle(isDark),
              }}
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

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Add New Lead</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Qualify and ingest workplace safety prospects</p>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramin Rezaei"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Company</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. GasPars IR"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. ramin@gaspars.ir"
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Estimated Value ($)</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={e => setValue(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Source Channel</label>
                    <CustomSelect
                      value={source}
                      onChange={setSource}
                      isDark={isDark}
                      options={[
                        { value: 'LinkedIn', label: 'LinkedIn' },
                        { value: 'Referral', label: 'Referral' },
                        { value: 'Web Search', label: 'Web Search' },
                        { value: 'Direct Email', label: 'Direct Email' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Priority</label>
                    <CustomSelect
                      value={priority}
                      onChange={setPriority}
                      isDark={isDark}
                      options={[
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' },
                      ]}
                    />
                  </div>
                </div>

                <GlassButton type="submit" className="w-full mt-2 justify-center">
                  Create Lead
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
