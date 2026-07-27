'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, glassStyle, panelFill } from './theme';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';

// Subpage Views
import ContactsView from './Crm/ContactsView';
import CompaniesView from './Crm/CompaniesView';
import DealsView from './Crm/DealsView';
import LeadsView from './Crm/LeadsView';

interface SafeCrmProps {
  isDark: boolean;
  activePage?: string;
}

interface Task {
  id: string;
  title: string;
  category: string;
  status: 'backlog' | 'in-progress' | 'validation' | 'done';
  priority: 'Urgent' | 'Normal' | 'Low';
  dueDate: string;
  avatars: string[];
  commentsCount: number;
  date: string;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconFolder = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconBolt = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconSparkles = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </svg>
);

const IconCheck = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconFlag = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
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

const IconMessage = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconExpand = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  {
    id: 'MDS-39',
    title: 'New microdose website',
    category: 'New Homepage',
    status: 'backlog',
    priority: 'Urgent',
    dueDate: "July 29, '24",
    avatars: ['AM', 'JD'],
    commentsCount: 13,
    date: 'May 30, 2024',
  },
  {
    id: 'MDS-56',
    title: 'Input Styleguide',
    category: 'Contact',
    status: 'backlog',
    priority: 'Normal',
    dueDate: "June 2, '24",
    avatars: ['SK', 'AM'],
    commentsCount: 0,
    date: 'May 24, 2024',
  },
  {
    id: 'MDS-2',
    title: 'Sales deck',
    category: 'Marketing',
    status: 'in-progress',
    priority: 'Low',
    dueDate: "Sep 19, '24",
    avatars: ['PR', 'AM', 'JD'],
    commentsCount: 7,
    date: 'May 31, 2024',
  },
  {
    id: 'MDS-1',
    title: 'Case studies',
    category: 'Fin Tech work',
    status: 'validation',
    priority: 'Urgent',
    dueDate: "Sep 21, '24",
    avatars: ['SK', 'JD'],
    commentsCount: 1,
    date: 'Apr 22, 2024',
  },
  {
    id: 'MDS-12',
    title: 'Demo reel',
    category: 'Animation 2nd',
    status: 'validation',
    priority: 'Normal',
    dueDate: "Aug 2, '24",
    avatars: ['PR', 'SK', 'AM'],
    commentsCount: 2,
    date: 'Apr 27, 2024',
  },
  {
    id: 'MDS-43',
    title: 'Spline animated logo',
    category: 'Logo',
    status: 'done',
    priority: 'Low',
    dueDate: "July 13, '24",
    avatars: ['JD', 'PR', 'SK'],
    commentsCount: 13,
    date: 'July 29, 2024',
  },
];

const BURNDOWN_DATA = [
  { day: 'Day 1', actual: 120, estimate: 120 },
  { day: 'Day 2', actual: 110, estimate: 112 },
  { day: 'Day 3', actual: 110, estimate: 104 },
  { day: 'Day 4', actual: 95, estimate: 96 },
  { day: 'Day 5', actual: 90, estimate: 88 },
  { day: 'Day 6', actual: 70, estimate: 80 },
  { day: 'Day 7', actual: 70, estimate: 72 },
  { day: 'Day 8', actual: 48, estimate: 64 },
  { day: 'Day 9', actual: 38, estimate: 56 },
  { day: 'Day 10', actual: 30, estimate: 48 },
];

export default function SafeCrm({ isDark, activePage }: SafeCrmProps) {
  // Check for active CRM sub-pages
  if (activePage === 'crm-contacts') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ContactsView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'crm-companies') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <CompaniesView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'crm-deals') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <DealsView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'crm-leads') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <LeadsView isDark={isDark} />
      </div>
    );
  }

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'Spreadsheet' | 'Board' | 'Calendar' | 'Timeline'>('Board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Urgent' | 'Normal' | 'Low'>('All');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals / forms state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Urgent' | 'Normal' | 'Low'>('Normal');
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('backlog');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Drag and drop states
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Compute status distributions
  const backlogCount = tasks.filter(t => t.status === 'backlog').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const validationCount = tasks.filter(t => t.status === 'validation').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length || 1;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingCardId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingCardId;
    if (id) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: targetStatus } : t));
    }
    setDraggingCardId(null);
    setDragOverColumn(null);
  };

  // Move card via click (for accessibility/mobile)
  const moveCard = (id: string, targetStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: targetStatus } : t));
  };

  // Add a task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `MDS-${Math.floor(Math.random() * 90) + 10}`,
      title: newTaskTitle,
      category: newTaskCategory || 'General',
      status: newTaskStatus,
      priority: newTaskPriority,
      dueDate: "Sep 30, '24",
      avatars: ['AM'],
      commentsCount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskCategory('');
    setIsAddTaskOpen(false);
  };

  // Colors based on priority
  const getPriorityStyles = (p: Task['priority']) => {
    switch (p) {
      case 'Urgent':
        return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
      case 'Normal':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Low':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>

      {/* ── Welcome and header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            CRM Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => setIsAddTaskOpen(true)}>
            New Task
          </GlassButton>
        </div>
      </div>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        {/* 1. Task Status Card */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Task Status
            </h3>
            <div className="flex items-center gap-2" style={{ color: mut }}>
              <button className="hover:text-primary transition-colors p-0.5"><IconEdit /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconExpand /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconThreeDots /></button>
            </div>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-2xl font-bold block" style={{ color: pri }}>{backlogCount}</span>
                <span className="text-[10px] uppercase font-semibold block" style={{ color: mut }}>Backlog</span>
              </div>
              <div>
                <span className="text-2xl font-bold block text-primary">{inProgressCount}</span>
                <span className="text-[10px] uppercase font-semibold block" style={{ color: mut }}>In Progress</span>
              </div>
              <div>
                <span className="text-2xl font-bold block text-[var(--primary)]">{validationCount}</span>
                <span className="text-[10px] uppercase font-semibold block" style={{ color: mut }}>Validation</span>
              </div>
            </div>
          </div>

          {/* Progress Bar (Visual distribution of Backlog, In Progress, Validation) */}
          <div className="w-full h-3.5 rounded-full overflow-hidden mt-4 flex" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-primary transition-all duration-500 ease-out"
              style={{ width: `${(backlogCount / totalCount) * 100}%` }}
              title={`Backlog: ${backlogCount}`}
            />
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
              title={`In Progress: ${inProgressCount}`}
            />
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ease-out"
              style={{ width: `${(validationCount / totalCount) * 100}%` }}
              title={`Validation: ${validationCount}`}
            />
          </div>
        </div>

        {/* 2. Comments Card */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Comments
            </h3>
            <div className="flex items-center gap-2" style={{ color: mut }}>
              <button className="hover:text-primary transition-colors p-0.5"><IconEdit /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconExpand /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconThreeDots /></button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>109</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1 mt-1">
                <IconChevronLeft /> 10.2% <span style={{ color: mut }}>(7d)</span>
              </span>
            </div>

            {/* Custom SVG sparkline showing scatter + regression line */}
            <div className="w-[110px] h-[55px] flex items-center justify-center">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                {/* Grid guidelines */}
                <line x1="0" y1="40" x2="100" y2="40" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeDasharray="3 3" />
                <line x1="0" y1="20" x2="100" y2="20" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeDasharray="3 3" />
                {/* Scattered points */}
                <circle cx="10" cy="38" r="3" fill="var(--primary)" opacity="0.8" />
                <circle cx="25" cy="28" r="3.5" fill="#f59e0b" opacity="0.8" />
                <circle cx="40" cy="34" r="3" fill="var(--primary)" opacity="0.8" />
                <circle cx="55" cy="20" r="3" fill="var(--primary)" opacity="0.8" />
                <circle cx="70" cy="18" r="3.5" fill="#f59e0b" opacity="0.8" />
                <circle cx="85" cy="12" r="3" fill="var(--primary)" opacity="0.8" />
                {/* Fit regression line */}
                <line x1="5" y1="42" x2="95" y2="10" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Commits Card */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Commits
            </h3>
            <div className="flex items-center gap-2" style={{ color: mut }}>
              <button className="hover:text-primary transition-colors p-0.5"><IconEdit /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconExpand /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconThreeDots /></button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>27</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconChevronRight /> 2.9% <span style={{ color: mut }}>(7d)</span>
              </span>
            </div>

            {/* Custom SVG bar sparkline */}
            <div className="w-[100px] h-[55px] flex items-end justify-between">
              {[8, 14, 25, 12, 19, 35, 22, 28, 42].map((height, i) => (
                <div
                  key={i}
                  className="w-2 rounded-t-sm bg-gradient-to-t from-orange-600 to-amber-500 transition-all duration-300"
                  style={{ height: `${(height / 45) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Mini Burndown Card */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Burndown
            </h3>
            <div className="flex items-center gap-2" style={{ color: mut }}>
              <button className="hover:text-primary transition-colors p-0.5"><IconEdit /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconExpand /></button>
              <button className="hover:text-primary transition-colors p-0.5"><IconThreeDots /></button>
            </div>
          </div>

          <div className="h-[75px] mt-2 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={BURNDOWN_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide domain={[0, 130]} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '8px' }}
                    labelStyle={{ color: pri }}
                  />
                  <Line type="step" dataKey="actual" stroke="var(--primary)" strokeWidth={2} dot={false} name="Actual" />
                  <Line type="step" dataKey="estimate" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Estimate" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR / VIEWS SELECTOR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${border}` }}>
        {/* Left Tabs */}
        <div className="flex items-center gap-1">
          {(['Spreadsheet', 'Board', 'Calendar', 'Timeline'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
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

        {/* Search, Filter & Quick Stats info */}
        <div className="flex items-center gap-3">
          {/* Search box */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, minWidth: 160 }}
          >
            <img src="/search.svg" alt="search" width={12} height={12} style={{ opacity: 0.45, filter: isDark ? 'invert(1)' : 'none' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none border-none text-xs w-full"
              style={{ color: textPrimary(isDark) }}
            />
          </div>

          {/* Priority filter - styled to match and remove default arrow */}
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            isDark={isDark}
            options={[
              { value: 'All', label: 'All Priorities' },
              { value: 'Urgent', label: 'Urgent' },
              { value: 'Normal', label: 'Normal' },
              { value: 'Low', label: 'Low' },
            ]}
            className="min-w-[130px]"
          />
        </div>
      </div>

      {/* ── VIEWS LAYOUT CONTAINER ── */}
      <div className="relative min-h-[450px]">
        <AnimatePresence mode="wait">

          {/* 1. BOARD VIEW (KANBAN) */}
          {activeTab === 'Board' && (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-5"
            >
              {(['backlog', 'in-progress', 'validation', 'done'] as const).map(columnId => {
                const columnTasks = filteredTasks.filter(t => t.status === columnId);
                const isOver = dragOverColumn === columnId;

                // Headers configs
                const getColHeader = () => {
                  switch (columnId) {
                    case 'backlog':
                      return { title: 'Backlog', count: columnTasks.length, icon: <IconFolder color="var(--primary)" />, color: 'var(--primary)' };
                    case 'in-progress':
                      return { title: 'In progress', count: columnTasks.length, icon: <IconBolt color="#f59e0b" />, color: '#f59e0b' };
                    case 'validation':
                      return { title: 'Validation', count: columnTasks.length, icon: <IconSparkles color="#c084fc" />, color: '#c084fc' };
                    case 'done':
                      return { title: 'Done', count: columnTasks.length, icon: <IconCheck color="#10b981" />, color: '#10b981' };
                  }
                };

                const col = getColHeader();

                return (
                  <div
                    key={columnId}
                    onDragOver={e => handleDragOver(e, columnId)}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={e => handleDrop(e, columnId)}
                    className="flex flex-col gap-4 p-4 rounded-2xl transition-all duration-200 min-h-[400px]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                      border: isOver ? `2px dashed ${col.color}` : `1px solid ${border}`,
                    }}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderSubtle(isDark) }}>
                      <div className="flex items-center gap-2">
                        {col.icon}
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: pri }}>{col.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${col.color}20`, color: col.color }}>{col.count}</span>
                      </div>
                      <button className="text-xs hover:text-primary p-0.5" style={{ color: mut }}><IconThreeDots /></button>
                    </div>

                    {/* Cards Container */}
                    <div className="flex flex-col gap-3 flex-1">
                      {columnTasks.map(task => {
                        const style = getPriorityStyles(task.priority);
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={e => handleDragStart(e, task.id)}
                            className="p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group border"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                              borderColor: border,
                            }}
                          >
                            {/* Card Top: ID and Priority */}
                            <div className="flex items-center justify-between text-[10px] mb-2.5">
                              <span className="font-semibold flex items-center gap-1 hover:text-primary" style={{ color: sec }}>
                                <IconLink /> {task.id}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                                style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                              >
                                <IconFlag color={style.text} /> {task.priority}
                              </span>
                            </div>

                            {/* Card Middle: Title and Tag */}
                            <h4 className="text-xs font-bold leading-snug mb-1 transition-colors duration-200 group-hover:text-primary" style={{ color: pri }}>
                              {task.title}
                            </h4>
                            <p className="text-[10px] mb-4 flex items-center gap-1" style={{ color: mut }}>
                              ↳ <IconFolder /> {task.category}
                            </p>

                            {/* Card Bottom-left: Due date */}
                            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                              <div className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: mut }}>
                                <IconCalendar /> Due to: <span className="font-bold" style={{ color: pri }}>{task.dueDate}</span>
                              </div>
                            </div>

                            {/* Card Bottom-right: Avatars and comments */}
                            <div className="flex items-center justify-between mt-3">
                              {/* Avatar stack */}
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.avatars.map((av, index) => (
                                  <div
                                    key={av}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border"
                                    style={{
                                      background: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--primary)' : '#10b981',
                                      color: '#ffffff',
                                      borderColor: isDark ? 'var(--surface)' : '#ffffff',
                                    }}
                                  >
                                    {av}
                                  </div>
                                ))}
                                {task.avatars.length > 2 && (
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold border"
                                    style={{
                                      background: isDark ? '#333' : '#eee',
                                      color: sec,
                                      borderColor: isDark ? 'var(--surface)' : '#ffffff',
                                    }}
                                  >
                                    +{task.avatars.length - 2}
                                  </div>
                                )}
                              </div>

                              {/* Comment indicator and quick move options */}
                              <div className="flex items-center gap-2">
                                {task.commentsCount > 0 && (
                                  <span className="text-[9px] font-semibold flex items-center gap-1" style={{ color: mut }}>
                                    <IconMessage /> {task.commentsCount}
                                  </span>
                                )}
                                <span className="text-[9px] font-medium" style={{ color: mut }}>
                                  {task.date}
                                </span>
                              </div>
                            </div>

                            {/* Mobile / Click-to-move quick buttons */}
                            <div className="grid grid-cols-3 gap-1 mt-3.5 pt-2.5 border-t border-dashed opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ borderColor: borderSubtle(isDark) }}>
                              {columnId !== 'backlog' && (
                                <button onClick={() => moveCard(task.id, 'backlog')} className="text-[8px] font-bold py-1 bg-gray-500/10 rounded text-center hover:bg-gray-500/20 cursor-pointer" style={{ color: sec }}>Backlog</button>
                              )}
                              {columnId !== 'in-progress' && (
                                <button onClick={() => moveCard(task.id, 'in-progress')} className="text-[8px] font-bold py-1 bg-primary/10 rounded text-center hover:bg-primary/20 cursor-pointer" style={{ color: 'var(--primary)' }}>Work</button>
                              )}
                              {columnId !== 'validation' && (
                                <button onClick={() => moveCard(task.id, 'validation')} className="text-[8px] font-bold py-1 bg-[rgba(var(--primary-rgb),0.1)] rounded text-center hover:bg-[rgba(var(--primary-rgb),0.2)] cursor-pointer" style={{ color: '#c084fc' }}>Validate</button>
                              )}
                              {columnId !== 'done' && (
                                <button onClick={() => moveCard(task.id, 'done')} className="text-[8px] font-bold py-1 bg-emerald-500/10 rounded text-center hover:bg-emerald-500/20 cursor-pointer" style={{ color: '#10b981' }}>Done</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 2. SPREADSHEET VIEW */}
          {activeTab === 'Spreadsheet' && (
            <motion.div
              key="spreadsheet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="overflow-x-auto rounded-2xl border transition-colors"
              style={{ borderColor: border, background: bg }}
            >
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                    <th className="p-4 font-bold">ID</th>
                    <th className="p-4 font-bold">Task Title</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Priority</th>
                    <th className="p-4 font-bold">Due Date</th>
                    <th className="p-4 font-bold">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => {
                    const style = getPriorityStyles(t.priority);
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-bold" style={{ color: pri }}>{t.id}</td>
                        <td className="p-4 font-semibold" style={{ color: pri }}>{t.title}</td>
                        <td className="p-4" style={{ color: sec }}>{t.category}</td>
                        <td className="p-4 uppercase">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                            background: t.status === 'done' ? 'rgba(16,185,129,0.12)' : t.status === 'in-progress' ? 'rgba(var(--primary-rgb), 0.12)' : 'rgba(120,120,120,0.12)',
                            color: t.status === 'done' ? '#10b981' : t.status === 'in-progress' ? 'var(--primary)' : sec,
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: style.bg, color: style.text }}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-4" style={{ color: pri }}>{t.dueDate}</td>
                        <td className="p-4 font-semibold" style={{ color: sec }}>{t.commentsCount} comments</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* 3. CALENDAR VIEW */}
          {activeTab === 'Calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl border flex flex-col gap-4 transition-colors"
              style={{ borderColor: border, background: bg }}
            >
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: borderSubtle(isDark) }}>
                <h3 className="text-sm font-bold" style={{ color: pri }}>September 2024</h3>
                <div className="flex gap-1 items-center">
                  <button className="p-1.5 rounded border text-xs cursor-pointer hover:bg-primary/5 transition-colors" style={{ borderColor: borderSubtle(isDark), color: pri }}><IconChevronLeft /></button>
                  <button className="px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer hover:bg-primary/5 transition-colors" style={{ borderColor: borderSubtle(isDark), color: pri }}>Today</button>
                  <button className="p-1.5 rounded border text-xs cursor-pointer hover:bg-primary/5 transition-colors" style={{ borderColor: borderSubtle(isDark), color: pri }}><IconChevronRight /></button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold" style={{ color: sec }}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="py-2">{d}</div>)}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 grid-rows-5 gap-1.5 h-[320px]">
                {[...Array(35)].map((_, i) => {
                  const dayNum = i - 5; // offset to start September
                  const isValidDay = dayNum > 0 && dayNum <= 30;

                  // Tasks due on this day
                  const dayTasks = isValidDay ? filteredTasks.filter(t => {
                    if (dayNum === 19 && t.id === 'MDS-2') return true;
                    if (dayNum === 21 && t.id === 'MDS-1') return true;
                    if (dayNum === 2 && t.id === 'MDS-56') return true;
                    return false;
                  }) : [];

                  return (
                    <div
                      key={i}
                      className="rounded-lg p-1.5 flex flex-col justify-between border hover:border-primary/30 transition-colors"
                      style={{
                        borderColor: borderSubtle(isDark),
                        background: isValidDay ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.005)') : 'transparent',
                        opacity: isValidDay ? 1 : 0.25,
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: isValidDay ? pri : mut }}>{isValidDay ? dayNum : ''}</span>
                      {dayTasks.map(t => (
                        <div
                          key={t.id}
                          className="text-[8px] font-black p-1 rounded leading-none truncate"
                          style={{
                            background: t.priority === 'Urgent' ? 'rgba(239,68,68,0.12)' : 'rgba(var(--primary-rgb), 0.12)',
                            color: t.priority === 'Urgent' ? '#ef4444' : 'var(--primary)',
                            border: `1px solid ${t.priority === 'Urgent' ? 'rgba(239,68,68,0.2)' : 'rgba(var(--primary-rgb), 0.2)'}`,
                          }}
                          title={t.title}
                        >
                          {t.id}: {t.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 4. TIMELINE VIEW */}
          {activeTab === 'Timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl border flex flex-col gap-4 transition-colors"
              style={{ borderColor: border, background: bg }}
            >
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: borderSubtle(isDark) }}>
                <h3 className="text-sm font-bold" style={{ color: pri }}>Project Roadmap</h3>
                <span className="text-xs" style={{ color: mut }}>Q3 - 2024</span>
              </div>

              <div className="flex flex-col gap-4">
                {filteredTasks.map((t, idx) => {
                  const startOffset = idx * 10; // offset each bar visually
                  const barWidth = 40 + (idx % 3) * 15;

                  return (
                    <div key={t.id} className="flex items-center gap-4">
                      {/* Name section */}
                      <div className="w-[160px] flex-shrink-0 text-xs font-semibold truncate" style={{ color: pri }}>
                        {t.id}: {t.title}
                      </div>

                      {/* Timeline Bar visualization */}
                      <div className="flex-1 h-5 relative rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}>
                        <div
                          className="absolute h-full rounded-full flex items-center justify-between px-3 text-[8px] font-bold text-white bg-gradient-to-r from-primary to-purple-500 shadow-sm"
                          style={{
                            left: `${startOffset}%`,
                            width: `${barWidth}%`,
                          }}
                        >
                          <span className="truncate">{t.category}</span>
                          <span>{t.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── ADD TASK MODAL (Glassmorphic panel popup) ── */}
      <AnimatePresence>
        {isAddTaskOpen && (
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
              {/* Close Button */}
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-4" style={{ color: pri }}>Add New Task</h3>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Design Landing Page"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Category / Project</label>
                  <input
                    type="text"
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    placeholder="e.g. Frontend"
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
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Priority</label>
                    <CustomSelect
                      value={newTaskPriority}
                      onChange={setNewTaskPriority}
                      isDark={isDark}
                      options={[
                        { value: 'Urgent', label: 'Urgent' },
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Low', label: 'Low' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Initial Column</label>
                    <CustomSelect
                      value={newTaskStatus}
                      onChange={setNewTaskStatus}
                      isDark={isDark}
                      options={[
                        { value: 'backlog', label: 'Backlog' },
                        { value: 'in-progress', label: 'In progress' },
                        { value: 'validation', label: 'Validation' },
                        { value: 'done', label: 'Done' },
                      ]}
                    />
                  </div>
                </div>

                <GlassButton type="submit" className="w-full mt-4">
                  Create Task
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
