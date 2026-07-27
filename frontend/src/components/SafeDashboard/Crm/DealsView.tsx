'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceHover, surfaceItem, glassDropdown, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  contact: string;
  stage: 'Lead In' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';
  probability: number; // percentage
  avatarColor: string;
}

interface DealsViewProps {
  isDark: boolean;
}

const INITIAL_DEALS: Deal[] = [
  { id: 'DEAL-101', title: 'Sensors Compliance System', company: 'Persian Gas Corp', value: 45000, contact: 'Ali Mohammadi', stage: 'Proposal', probability: 80, avatarColor: 'var(--primary)' },
  { id: 'DEAL-102', title: 'Harness Equipment Batch', company: 'DrillTech Solutions', value: 12500, contact: 'Sarah Jenkins', stage: 'Contacted', probability: 50, avatarColor: '#ec4899' },
  { id: 'DEAL-103', title: 'Emergency Ventilation Audit', company: 'Global Compliance Inc', value: 7500, contact: 'Mark Davis', stage: 'Lead In', probability: 20, avatarColor: '#3b82f6' },
  { id: 'DEAL-104', title: 'Site Inspection Software', company: 'Tehran Fire Safety', value: 22000, contact: 'Zahra Alavi', stage: 'Won', probability: 100, avatarColor: '#10b981' },
  { id: 'DEAL-105', title: 'HSE Advisory Retainer', company: 'SafetyFirst Ltd', value: 15000, contact: 'David Smith', stage: 'Lost', probability: 0, avatarColor: '#f59e0b' },
];

export default function DealsView({ isDark }: DealsViewProps) {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Add deal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState(0);
  const [contact, setContact] = useState('');
  const [initialStage, setInitialStage] = useState<Deal['stage']>('Lead In');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const stages: Deal['stage'][] = ['Lead In', 'Contacted', 'Proposal', 'Won', 'Lost'];
  const colors = ['var(--primary)', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  const getStageColor = (stage: Deal['stage']) => {
    switch (stage) {
      case 'Lead In': return 'var(--primary)';
      case 'Contacted': return '#3b82f6';
      case 'Proposal': return '#f59e0b';
      case 'Won': return '#10b981';
      case 'Lost': return '#ef4444';
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: Deal['stage']) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: Deal['stage']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (id) {
      moveDeal(id, targetStage);
    }
    setDraggingId(null);
    setDragOverStage(null);
  };

  const moveDeal = (id: string, targetStage: Deal['stage']) => {
    setDeals(prev => prev.map(d => {
      if (d.id === id) {
        let prob = 50;
        if (targetStage === 'Lead In') prob = 20;
        if (targetStage === 'Contacted') prob = 50;
        if (targetStage === 'Proposal') prob = 80;
        if (targetStage === 'Won') prob = 100;
        if (targetStage === 'Lost') prob = 0;
        return { ...d, stage: targetStage, probability: prob };
      }
      return d;
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    let prob = 50;
    if (initialStage === 'Lead In') prob = 20;
    if (initialStage === 'Contacted') prob = 50;
    if (initialStage === 'Proposal') prob = 80;
    if (initialStage === 'Won') prob = 100;
    if (initialStage === 'Lost') prob = 0;

    const newDeal: Deal = {
      id: `DEAL-${Math.floor(Math.random() * 900) + 106}`,
      title,
      company,
      value: Number(value) || 5000,
      contact: contact || 'Unknown',
      stage: initialStage,
      probability: prob,
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    };

    setDeals(prev => [...prev, newDeal]);
    setTitle('');
    setCompany('');
    setValue(0);
    setContact('');
    setInitialStage('Lead In');
    setIsAddOpen(false);
  };

  const totalWon = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);
  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);

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
          <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>CRM / Deals</h2>
          <p className="text-xs" style={{ color: sec }}>Pipeline sales deals, safety contract integrations, and audits</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs font-semibold flex items-center gap-3">
            <span style={{ color: sec }}>Won: <span className="text-[#10b981] font-extrabold text-sm">${totalWon.toLocaleString()}</span></span>
            <span style={{ color: sec }}>Pipeline: <span className="text-primary font-extrabold text-sm">${totalPipeline.toLocaleString()}</span></span>
          </div>
          <GlassButton onClick={() => setIsAddOpen(true)}>
            Add Deal
          </GlassButton>
        </div>
      </div>

      {/* Board layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
          const color = getStageColor(stage);
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDrop={(e) => handleDrop(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              className="rounded-2xl p-4 border flex flex-col gap-3 min-h-[460px] transition-all duration-200"
              style={{
                background: isOver 
                  ? (isDark ? `${color}12` : `${color}08`) 
                  : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)'),
                borderColor: isOver ? color : border,
                boxShadow: isOver ? `0 0 20px ${color}35` : 'none',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: borderSubtle(isDark) }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: pri }}>{stage}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color: color }}>
                  {stageDeals.length}
                </span>
              </div>

              {/* Total Value for Column */}
              <div className="text-[10px] font-black text-right" style={{ color: mut }}>
                Total: ${stageTotal.toLocaleString()}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence initial={false}>
                  {stageDeals.map(deal => {
                    const isSelected = selectedDealId === deal.id;
                    const initials = deal.contact.split(' ').map(n => n[0]).join('');
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedDealId(isSelected ? null : deal.id)}
                        className="p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-lg group shadow-md"
                        style={{
                          background: bg,
                          borderColor: isSelected ? 'var(--primary)' : border,
                        }}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold" style={{ color: mut }}>{deal.id}</span>
                            <span className="text-xs font-black text-primary">${deal.value.toLocaleString()}</span>
                          </div>
                          <h4 className="text-sm font-bold mt-1.5 group-hover:text-primary transition-colors" style={{ color: pri }}>{deal.title}</h4>
                          <p className="text-[11px] mt-1" style={{ color: sec }}>{deal.company}</p>
                        </div>

                        {/* Probability Progress Track */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: mut }}>
                            <span>Probability</span>
                            <span>{deal.probability}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
                            <div className="h-full rounded-full transition-all duration-300" style={{ background: color, width: `${deal.probability}%` }} />
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 flex justify-between items-center border-t pt-2.5" style={{ borderColor: borderSubtle(isDark) }}>
                          <span className="text-[10px] font-bold" style={{ color: mut }}>Acc: {deal.contact.split(' ')[0]}</span>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md" style={{ background: deal.avatarColor }}>
                            {initials}
                          </div>
                        </div>

                        {/* Quick action overlay inside card */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-2 border-t border-dashed space-y-2 overflow-hidden"
                              style={{ borderColor: borderSubtle(isDark) }}
                              onClick={(e) => e.stopPropagation()} // stop parent toggle
                            >
                              <p className="text-[9px]" style={{ color: mut }}>Change Stage:</p>
                              <div className="flex flex-wrap gap-1">
                                {stages.filter(s => s !== stage).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => moveDeal(deal.id, s)}
                                    className="text-[8px] font-bold px-1.5 py-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer transition-all"
                                    style={{ color: getStageColor(s) }}
                                  >
                                    {s.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
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

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Add New Deal</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Add client safety project pipeline values</p>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Deal Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Sensors Compliance System"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Client Company</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Persian Gas Corp"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                    style={{ borderColor: borderSubtle(isDark), color: pri }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Value ($)</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={e => setValue(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Account Manager</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="e.g. Ali Mohammadi"
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent transition-colors focus:bg-primary/[0.01]"
                      style={{ borderColor: borderSubtle(isDark), color: pri }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Initial Deal Stage</label>
                  <CustomSelect
                    value={initialStage}
                    onChange={setInitialStage}
                    isDark={isDark}
                    options={[
                      { value: 'Lead In', label: 'Lead In' },
                      { value: 'Contacted', label: 'Contacted' },
                      { value: 'Proposal', label: 'Proposal' },
                      { value: 'Won', label: 'Won' },
                      { value: 'Lost', label: 'Lost' },
                    ]}
                  />
                </div>

                <GlassButton type="submit" className="w-full mt-2 justify-center">
                  Create Deal
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
