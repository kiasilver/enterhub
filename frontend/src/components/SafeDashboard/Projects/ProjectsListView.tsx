'use client';

import { useState, useMemo } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceHover, surfaceItem, panelFill } from '../theme';

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

const INITIAL_PROJECTS: Project[] = [
  { id: 'PRJ-101', title: 'Enterhub Redesign', description: 'Refactoring dashboard design systems and inline spacing variables.', status: 'In Progress', priority: 'Urgent', progress: 75, dueDate: 'July 15, 2026', members: ['AM', 'SK'], budget: 15000, actualCost: 11200 },
  { id: 'PRJ-102', title: 'Safety Drill App', description: 'Creating interactive drill scheduling and response flow checklists.', status: 'Planning', priority: 'Normal', progress: 25, dueDate: 'Aug 30, 2026', members: ['SJ', 'MD'], budget: 8500, actualCost: 2100 },
  { id: 'PRJ-103', title: 'Gas Sensor Audit', description: 'Evaluating ventilation sensors and compliance indicators in Sector 4.', status: 'Completed', priority: 'Low', progress: 100, dueDate: 'Jun 10, 2026', members: ['AM', 'MD', 'SJ'], budget: 5000, actualCost: 4800 },
  { id: 'PRJ-104', title: 'Fulfillment Portal Integration', description: 'Connecting order statuses and payment gateways to standard APIs.', status: 'In Progress', priority: 'Normal', progress: 60, dueDate: 'Sep 10, 2026', members: ['SK', 'SJ'], budget: 12000, actualCost: 7500 },
];

interface ProjectsListViewProps {
  isDark: boolean;
}

export default function ProjectsListView({ isDark }: ProjectsListViewProps) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Planning' | 'In Progress' | 'Completed'>('All');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

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
      case 'Urgent': return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
      case 'Normal': return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Low': return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
    }
  };

  const getStatusColor = (s: Project['status']) => {
    switch (s) {
      case 'Completed': return '#10b981';
      case 'In Progress': return 'var(--primary)';
      case 'Planning': return '#f59e0b';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Projects / List</h2>
        <p className="text-xs" style={{ color: sec }}>All active safety workflows and compliance auditing timelines</p>
      </div>

      {/* Toolbar / Search panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors border" style={{ background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderColor: border }}>
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

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), minWidth: 200 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-55">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none border-none text-xs w-full"
            style={{ color: pri }}
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
                    background: `color-mix(in srgb, ${getStatusColor(proj.status)} 8%, transparent)`,
                    color: getStatusColor(proj.status),
                    borderColor: `color-mix(in srgb, ${getStatusColor(proj.status)} 19%, transparent)`,
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
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Due: {proj.dueDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border"
                    style={{ background: prio.bg, color: prio.text, borderColor: prio.border }}
                  >
                    {proj.priority}
                  </span>

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
    </div>
  );
}
