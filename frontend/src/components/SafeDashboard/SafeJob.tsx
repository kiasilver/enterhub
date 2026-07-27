'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface SafeJobProps {
  isDark: boolean;
}

interface JobVacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Hybrid';
  status: 'Active' | 'Draft' | 'Closed';
  applicationsCount: number;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconAward = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-emerald-500 mr-1">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconTrendingDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-red-500 mr-1">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 ml-1">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_VACANCIES: JobVacancy[] = [
  { id: 'JOB-901', title: 'Senior Safety Specialist', department: 'Operations', location: 'New York, US', type: 'Full-time', status: 'Active', applicationsCount: 48 },
  { id: 'JOB-902', title: 'Fulfillment & Risk Officer', department: 'Logistics', location: 'London, UK', type: 'Remote', status: 'Active', applicationsCount: 32 },
  { id: 'JOB-903', title: 'Compliance Coordinator', department: 'Safety Auditing', location: 'Berlin, DE', type: 'Hybrid', status: 'Draft', applicationsCount: 0 },
  { id: 'JOB-904', title: 'Lead PPE Inspector', department: 'Operations', location: 'Paris, FR', type: 'Part-time', status: 'Closed', applicationsCount: 14 },
];

const SOURCES_DATA = [
  { source: 'LinkedIn', count: 120 },
  { source: 'Direct', count: 54 },
  { source: 'Referral', count: 42 },
  { source: 'Indeed', count: 29 },
];

export default function SafeJob({ isDark }: SafeJobProps) {
  const { primaryColor } = useTheme();
  const [vacancies, setVacancies] = useState<JobVacancy[]>(INITIAL_VACANCIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Closed'>('All');
  
  // Post Job Modal
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('');
  const [newJobType, setNewJobType] = useState<JobVacancy['type']>('Full-time');
  const [newJobStatus, setNewJobStatus] = useState<JobVacancy['status']>('Active');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Calculations
  const totalApplications = vacancies.reduce((sum, v) => sum + v.applicationsCount, 94) + 151;
  const activeVacanciesCount = vacancies.filter(v => v.status === 'Active').length;
  const shortlistedCount = 82;

  const filteredVacancies = useMemo(() => {
    return vacancies.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vacancies, searchQuery, statusFilter]);

  // Toggle vacancy status
  const toggleVacancyStatus = (id: string) => {
    setVacancies(prev => prev.map(v => {
      if (v.id === id) {
        const nextStatus: JobVacancy['status'] = v.status === 'Active' ? 'Draft' : v.status === 'Draft' ? 'Closed' : 'Active';
        return { ...v, status: nextStatus };
      }
      return v;
    }));
  };

  const handlePostJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    const newJob: JobVacancy = {
      id: `JOB-${Math.floor(Math.random() * 90) + 910}`,
      title: newJobTitle,
      department: newJobDept || 'General',
      location: 'Remote',
      type: newJobType,
      status: newJobStatus,
      applicationsCount: 0,
    };

    setVacancies(prev => [...prev, newJob]);
    setNewJobTitle('');
    setNewJobDept('');
    setIsPostJobOpen(false);
  };

  const getStatusStyles = (status: JobVacancy['status']) => {
    switch (status) {
      case 'Active':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
      case 'Draft':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Closed':
        return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Recruitment Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => setIsPostJobOpen(true)}>
            Post Vacancy
          </GlassButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Total Applications */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Applications
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>
              <IconBriefcase />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{totalApplications}</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 12.5% <span style={{ color: mut }}>(30d)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Shortlisted Applicants */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Shortlisted
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconUsers />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{shortlistedCount}</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 8.4% <span style={{ color: mut }}>(7d)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Open Positions */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Active Openings
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconAward />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{activeVacanciesCount}</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                Optimal recruiting velocity
              </span>
            </div>
          </div>
        </div>

        {/* 4. Rejected */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Rejections
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <IconAlertCircle />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>28</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1 mt-1">
                <IconTrendingDown /> 10.5% <span style={{ color: mut }}>(30d)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Graph Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Applications Referral Sources Bar Chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Applications Referral Sources</h3>
              <p className="text-xs" style={{ color: sec }}>Recruitment channels distribution</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SOURCES_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="source" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} barSize={18} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Informative Side Card */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors justify-between" style={{ background: bg, border: `1px solid ${border}` }}>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: pri }}>Auditing Efficiency</h3>
            <p className="text-xs" style={{ color: sec }}>Candidate screening indexes</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Shortlist Conversion</span>
                <span style={{ color: '#10b981' }}>33.4%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '33.4%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Interview Completion</span>
                <span style={{ color: 'var(--primary)' }}>17.0%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-primary" style={{ width: '17%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px]" style={{ color: mut }}>Optimal Recruiting Balance</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${border}` }}>
        <div className="flex items-center gap-1">
          {(['All', 'Active', 'Draft', 'Closed'] as const).map(tab => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                  color: isActive ? pri : sec,
                  border: `1px solid ${isActive ? borderSubtle(isDark) : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = surfaceHover(isDark); }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, minWidth: 160 }}
        >
          <img src="/search.svg" alt="search" width={12} height={12} style={{ opacity: 0.45, filter: isDark ? 'invert(1)' : 'none' }} />
          <input
            type="text"
            placeholder="Search position..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none border-none text-xs w-full"
            style={{ color: textPrimary(isDark) }}
          />
        </div>
      </div>

      {/* Vacancy cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVacancies.map((vac) => {
          const style = getStatusStyles(vac.status);
          return (
            <div
              key={vac.id}
              className="p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: bg, borderColor: border }}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-bold block" style={{ color: mut }}>{vac.id} • {vac.location}</span>
                  <h4 className="text-sm font-bold mt-1 group-hover:text-primary transition-colors" style={{ color: pri }}>{vac.title}</h4>
                  <span className="text-[10px] font-semibold" style={{ color: sec }}>Dept: {vac.department}</span>
                </div>

                <button
                  onClick={() => toggleVacancyStatus(vac.id)}
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold border cursor-pointer active:scale-95 transition-all text-center"
                  style={{ background: style.bg, color: style.text, borderColor: style.border }}
                >
                  {vac.status}
                </button>
              </div>

              <div className="flex justify-between items-end pt-4 mt-4 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                <div className="text-[10px]" style={{ color: mut }}>
                  Type: <span className="font-bold" style={{ color: pri }}>{vac.type}</span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black block" style={{ color: pri }}>{vac.applicationsCount}</span>
                  <span className="text-[9px] uppercase font-bold" style={{ color: mut }}>Applicants</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── POST JOB MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isPostJobOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl relative shadow-2xl transition-colors"
              style={{
                background: isDark ? 'rgba(20, 20, 20, 0.98)' : '#ffffff',
                border: `1px solid ${borderSubtle(isDark)}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                onClick={() => setIsPostJobOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-4" style={{ color: pri }}>Post Job Vacancy</h3>
              
              <form onSubmit={handlePostJobSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Job Title</label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={e => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Lead HSE Engineer"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Department</label>
                  <input
                    type="text"
                    value={newJobDept}
                    onChange={e => setNewJobDept(e.target.value)}
                    placeholder="e.g. Auditing"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Job Type</label>
                    <CustomSelect
                      value={newJobType}
                      onChange={setNewJobType}
                      isDark={isDark}
                      options={[
                        { value: 'Full-time', label: 'Full-time' },
                        { value: 'Part-time', label: 'Part-time' },
                        { value: 'Remote', label: 'Remote' },
                        { value: 'Hybrid', label: 'Hybrid' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Initial Status</label>
                    <CustomSelect
                      value={newJobStatus}
                      onChange={setNewJobStatus}
                      isDark={isDark}
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Draft', label: 'Draft' },
                        { value: 'Closed', label: 'Closed' },
                      ]}
                    />
                  </div>
                </div>

                <GlassButton
                  type="submit"
                  className="w-full mt-4"
                >
                  Create Position
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
