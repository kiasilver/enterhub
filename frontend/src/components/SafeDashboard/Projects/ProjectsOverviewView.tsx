'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, hexToRgba, panelFill } from '../theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

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
  { id: 'PRJ-101', title: 'Enterhub Redesign', description: 'Refactoring dashboard design systems.', status: 'In Progress', priority: 'Urgent', progress: 75, dueDate: 'July 15, 2026', members: ['AM', 'SK'], budget: 15000, actualCost: 11200 },
  { id: 'PRJ-102', title: 'Safety Drill App', description: 'Creating interactive drill checklists.', status: 'Planning', priority: 'Normal', progress: 25, dueDate: 'Aug 30, 2026', members: ['SJ', 'MD'], budget: 8500, actualCost: 2100 },
  { id: 'PRJ-103', title: 'Gas Sensor Audit', description: 'Evaluating ventilation sensors in Sector 4.', status: 'Completed', priority: 'Low', progress: 100, dueDate: 'Jun 10, 2026', members: ['AM', 'MD', 'SJ'], budget: 5000, actualCost: 4800 },
  { id: 'PRJ-104', title: 'Fulfillment Portal Integration', description: 'Connecting order statuses to standard APIs.', status: 'In Progress', priority: 'Normal', progress: 60, dueDate: 'Sep 10, 2026', members: ['SK', 'SJ'], budget: 12000, actualCost: 7500 },
];

interface ProjectsOverviewViewProps {
  isDark: boolean;
}

export default function ProjectsOverviewView({ isDark }: ProjectsOverviewViewProps) {
  const { primaryColor } = useTheme();
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const totalProjects = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const overallProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Projects / Overview</h2>
        <p className="text-xs" style={{ color: sec }}>Statistical analysis, budget compliance reports, and velocities</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[140px]" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sec }}>Projects Count</span>
          <span className="text-3xl font-black block mt-2" style={{ color: pri }}>{totalProjects}</span>
          <span className="text-[9px]" style={{ color: mut }}>{inProgressCount} in progress</span>
        </div>

        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[140px]" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sec }}>Completed Targets</span>
          <span className="text-3xl font-black block mt-2 text-emerald-500" style={{ color: '#10b981' }}>{completedCount}</span>
          <span className="text-[9px]" style={{ color: mut }}>All indicators green</span>
        </div>

        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[140px]" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sec }}>Overall Velocity</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-black" style={{ color: pri }}>{overallProgress}%</span>
            <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="113" strokeDashoffset={`${113 - (113 * overallProgress) / 100}`} transform="rotate(-90 22 22)" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[140px]" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sec }}>Budget Spent</span>
          <div className="flex flex-col mt-2">
            <span className="text-2xl font-black" style={{ color: pri }}>42.3%</span>
            <div className="w-full h-1.5 rounded-full overflow-hidden mt-3.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <div className="h-full bg-gradient-to-r from-purple-500 to-primary rounded-full" style={{ width: '42.3%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px]" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: pri }}>Budget vs Actual Cost</h3>
            <p className="text-xs" style={{ color: sec }}>Auditing compliance cost efficiency</p>
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
                  <Bar dataKey="budget" barSize={16} fill={hexToRgba(primaryColor, 0.15)} stroke={primaryColor} strokeWidth={1} radius={[4, 4, 0, 0]} name="Budget" />
                  <Line type="monotone" dataKey="actualCost" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Efficiency summary panel */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] justify-between" style={{ background: bg, border: `1px solid ${border}` }}>
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
    </div>
  );
}
