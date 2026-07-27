'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

// Subpage Views
import ProjectsListView from './Projects/ProjectsListView';
import ProjectsOverviewView from './Projects/ProjectsOverviewView';
import ProjectsCreateView from './Projects/ProjectsCreateView';

interface SafeProjectsProps {
  isDark: boolean;
  activePage?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  priority: 'Urgent' | 'Normal' | 'Low';
  progress: number;
  dueDate: string;
  members: string[];
  budget: number;
  actualCost: number;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconCheckSquare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21-12v7a9 9 0 1 1-9-9H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  </svg>
);

const IconTrendUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconPieChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const IconCalendar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const IconFlag = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-101',
    title: 'Enterhub Redesign',
    description: 'Refactoring dashboard design systems and inline spacing variables.',
    status: 'In Progress',
    priority: 'Urgent',
    progress: 75,
    dueDate: 'July 15, 2026',
    members: ['AM', 'SK'],
    budget: 15000,
    actualCost: 11200,
  },
  {
    id: 'PRJ-102',
    title: 'Safety Drill App',
    description: 'Creating interactive drill scheduling and response flow checklists.',
    status: 'Planning',
    priority: 'Normal',
    progress: 25,
    dueDate: 'Aug 30, 2026',
    members: ['SJ', 'MD'],
    budget: 8500,
    actualCost: 2100,
  },
  {
    id: 'PRJ-103',
    title: 'Gas Sensor Audit',
    description: 'Evaluating ventilation sensors and compliance indicators in Sector 4.',
    status: 'Completed',
    priority: 'Low',
    progress: 100,
    dueDate: 'Jun 10, 2026',
    members: ['AM', 'MD', 'SJ'],
    budget: 5000,
    actualCost: 4800,
  },
  {
    id: 'PRJ-104',
    title: 'Fulfillment Portal Integration',
    description: 'Connecting order statuses and payment gateways to standard APIs.',
    status: 'In Progress',
    priority: 'Normal',
    progress: 60,
    dueDate: 'Sep 10, 2026',
    members: ['SK', 'SJ'],
    budget: 12000,
    actualCost: 7500,
  },
];

export default function SafeProjects({ isDark, activePage }: SafeProjectsProps) {
  // Check for active Projects sub-pages
  if (activePage === 'projects-list') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ProjectsListView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'projects-overview') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ProjectsOverviewView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'projects-create') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ProjectsCreateView isDark={isDark} />
      </div>
    );
  }

  const { primaryColor } = useTheme();
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Planning' | 'In Progress' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Project Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjPriority, setNewProjPriority] = useState<Project['priority']>('Normal');
  const [newProjBudget, setNewProjBudget] = useState<number>(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newProj: Project = {
      id: `PRJ-${Math.floor(Math.random() * 900) + 105}`,
      title: newProjTitle,
      description: newProjDesc,
      status: 'Planning',
      priority: newProjPriority,
      progress: 10,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      members: ['AM'],
      budget: newProjBudget || 5000,
      actualCost: 0,
    };

    setProjects(prev => [...prev, newProj]);
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjBudget(0);
    setNewProjPriority('Normal');
    setIsCreateOpen(false);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Derived calculations
  const totalProjects = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const overallProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Toggle status onClick
  const toggleProjectStatus = (id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const statuses: Project['status'][] = ['Planning', 'In Progress', 'Completed'];
        const nextIdx = (statuses.indexOf(p.status) + 1) % statuses.length;
        const newStatus = statuses[nextIdx];
        const newProgress = newStatus === 'Completed' ? 100 : newStatus === 'Planning' ? 10 : 50;
        return { ...p, status: newStatus, progress: newProgress };
      }
      return p;
    }));
  };

  const getPriorityStyles = (p: Project['priority']) => {
    switch (p) {
      case 'Urgent':
        return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
      case 'Normal':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Low':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
    }
  };

  const getStatusColor = (s: Project['status']) => {
    switch (s) {
      case 'Completed': return '#10b981';
      case 'In Progress': return primaryColor;
      case 'Planning': return '#f59e0b';
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
            Project Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => setIsCreateOpen(true)}>
            Create Project
          </GlassButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        {/* 1. Projects Count */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Projects
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>
              <IconBriefcase />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{totalProjects}</span>
              <span className="text-[10px] font-semibold text-[var(--primary)] block mt-1">
                {inProgressCount} in progress
              </span>
            </div>
          </div>
        </div>

        {/* 2. Completed count */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Completed Tasks
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconCheckSquare />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{completedCount}</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                All targets met
              </span>
            </div>
          </div>
        </div>

        {/* 3. Overall Velocity */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Velocity
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconTrendUp />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{overallProgress}%</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                Speed: Optimal
              </span>
            </div>
            {/* Sparkline circle progress */}
            <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="113" strokeDashoffset={`${113 - (113 * overallProgress) / 100}`} strokeLinecap="round" transform="rotate(-90 22 22)" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Budget Burn Rate */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Budget Burn
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
              <IconPieChart />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>42.3%</span>
              <span className="text-[9px]" style={{ color: mut }}>Total: $44k</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <div className="h-full bg-gradient-to-r from-purple-500 to-primary rounded-full" style={{ width: '42.3%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Graph Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Composed Chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Project Budget vs Actual Cost</h3>
              <p className="text-xs" style={{ color: sec }}>Budget limits and expense efficiency</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={projects} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="title" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} tickFormatter={val => `$${val}`} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Bar dataKey="budget" barSize={16} fill={`${primaryColor}26`} stroke={primaryColor} strokeWidth={1} radius={[4, 4, 0, 0]} name="Budget" />
                  <Line type="monotone" dataKey="actualCost" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Project progress summary info panel */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors justify-between" style={{ background: bg, border: `1px solid ${border}` }}>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: pri }}>Fulfillment Efficiency</h3>
            <p className="text-xs" style={{ color: sec }}>Completion velocity index</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>In Progress Burn</span>
                <span style={{ color: 'var(--primary)' }}>75%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-primary" style={{ width: '75%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Cost Burn</span>
                <span style={{ color: '#10b981' }}>55%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '55%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Planning Stage</span>
                <span style={{ color: '#f59e0b' }}>25%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-amber-500" style={{ width: '25%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px]" style={{ color: mut }}>Updated: 10 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Search panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${border}` }}>
        <div className="flex items-center gap-1">
          {(['All', 'Planning', 'In Progress', 'Completed'] as const).map(tab => {
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
            placeholder="Search project..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none border-none text-xs w-full"
            style={{ color: textPrimary(isDark) }}
          />
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.map((proj) => {
          const prio = getPriorityStyles(proj.priority);
          return (
            <div
              key={proj.id}
              className="p-5 rounded-2xl border flex flex-col justify-between min-h-[180px] transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: bg, borderColor: border }}
            >
              {/* Top Row: Title, ID and Status Tag */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold" style={{ color: mut }}>{proj.id}</span>
                  <h4 className="text-sm font-bold mt-0.5 group-hover:text-primary transition-colors" style={{ color: pri }}>{proj.title}</h4>
                </div>

                <button
                  onClick={() => toggleProjectStatus(proj.id)}
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold border cursor-pointer active:scale-95 transition-all"
                  style={{
                    background: `${getStatusColor(proj.status)}15`,
                    color: getStatusColor(proj.status),
                    borderColor: `${getStatusColor(proj.status)}30`,
                  }}
                >
                  {proj.status}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: sec }}>{proj.description}</p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1" style={{ color: pri }}>
                  <span>Progress</span>
                  <span>{proj.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      background: getStatusColor(proj.status),
                      width: `${proj.progress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bottom Row: Due date, priority and members */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: mut }}>
                  <IconCalendar />
                  <span>Due: {proj.dueDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Priority */}
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border"
                    style={{ background: prio.bg, color: prio.text, borderColor: prio.border }}
                  >
                    <IconFlag color={prio.text} />
                    {proj.priority}
                  </span>

                  {/* Avatar stack */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {proj.members.map((m, index) => (
                      <div
                        key={m}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border"
                        style={{
                          background: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--primary)' : '#10b981',
                          color: '#ffffff',
                          borderColor: isDark ? 'var(--surface)' : '#ffffff',
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── CREATE PROJECT DIALOG MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isCreateOpen && (
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
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Create New Project</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Add a new compliance or auditing workspace project</p>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-4">

                {/* Project Title */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Project Title</label>
                  <input
                    type="text"
                    required
                    value={newProjTitle}
                    onChange={e => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Risk Assessment System"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newProjDesc}
                    onChange={e => setNewProjDesc(e.target.value)}
                    placeholder="e.g. Audit procedures for high voltage zones..."
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary resize-none"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                {/* Priority & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Priority</label>
                    <CustomSelect
                      value={newProjPriority}
                      onChange={setNewProjPriority}
                      isDark={isDark}
                      options={[
                        { value: 'Urgent', label: 'Urgent' },
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Low', label: 'Low' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Budget ($)</label>
                    <input
                      type="number"
                      required
                      value={newProjBudget || ''}
                      onChange={e => setNewProjBudget(parseInt(e.target.value) || 0)}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                      style={{
                        background: surfaceItem(isDark),
                        borderColor: borderSubtle(isDark),
                        color: pri,
                      }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <GlassButton
                  type="submit"
                  className="w-full mt-4"
                >
                  Create Project
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
