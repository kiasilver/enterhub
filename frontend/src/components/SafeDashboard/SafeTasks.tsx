'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'inspection' | 'training' | 'maintenance' | 'drill';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

const CATEGORIES = {
  inspection: { label: 'Inspection', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  training: { label: 'Training', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  maintenance: { label: 'Maintenance', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  drill: { label: 'Drill', color: 'var(--primary)', bg: 'rgba(var(--primary-rgb),0.1)' },
};

const PRIORITIES = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: 'High', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#f59e0b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Under Review', color: 'var(--primary)' },
  { id: 'done', label: 'Completed', color: '#10b981' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'T-101',
    title: 'Breaker Panel 3 Thermal Sweep',
    description: 'Verify breaker panel temperatures in Zone A after thermal sensor A4 incident report.',
    category: 'maintenance',
    priority: 'critical',
    dueDate: '2026-06-20',
    assignee: 'Mohammad Reza',
    status: 'in_progress',
  },
  {
    id: 'T-102',
    title: 'Zone C Scaffolding Sign-off',
    description: 'Inspect ground tags, support locks, and load limit decals on logistics Rack 14.',
    category: 'inspection',
    priority: 'medium',
    dueDate: '2026-06-22',
    assignee: 'Hassan Alavi',
    status: 'todo',
  },
  {
    id: 'T-103',
    title: 'Forklift Safety Briefing Logs',
    description: 'Ensure training attendance lists are uploaded and certification badges are tagged in HR CRM.',
    category: 'training',
    priority: 'low',
    dueDate: '2026-06-21',
    assignee: 'Sara Nouri',
    status: 'review',
  },
  {
    id: 'T-104',
    title: 'Zone B Chemical Ventilation Check',
    description: 'Confirm vent air sensor returns green and absorbent pads are stocked near chemical lockers.',
    category: 'inspection',
    priority: 'high',
    dueDate: '2026-06-20',
    assignee: 'Ali Mohammadi',
    status: 'done',
  },
  {
    id: 'T-105',
    title: 'Weekly Extinguisher Pressure Log',
    description: 'Check pressure readings for all 15 fire extinguishers in manufacturing Zone A.',
    category: 'inspection',
    priority: 'low',
    dueDate: '2026-06-25',
    assignee: 'Hassan Alavi',
    status: 'todo',
  },
];

// SVG Icons
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconUser = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function SafeTasks({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<keyof typeof CATEGORIES>('inspection');
  const [formPriority, setFormPriority] = useState<keyof typeof PRIORITIES>('medium');
  const [formDate, setFormDate] = useState('2026-06-20');
  const [formAssignee, setFormAssignee] = useState('Ali Mohammadi');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Simulated background activity to make the page dynamic
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.5) {
        // Move a random non-done task to the next column
        setTasks(prev => {
          const active = prev.filter(t => t.status !== 'done');
          if (active.length === 0) return prev;
          const randomTask = active[Math.floor(Math.random() * active.length)];
          const statuses: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];
          const currIdx = statuses.indexOf(randomTask.status);
          const nextStatus = statuses[currIdx + 1];
          return prev.map(t => t.id === randomTask.id ? { ...t, status: nextStatus } : t);
        });
      } else {
        // Add a new mock task
        const mockTasks = [
          { title: 'Zone B First Aid Kit Inspection', desc: 'Verify bandage stocks and antiseptic dates are valid.', category: 'inspection', priority: 'low', assignee: 'Sara Nouri' },
          { title: 'Zone A Emergency Exit Test', desc: 'Check push-bars and confirm emergency lights operate on battery backup.', category: 'drill', priority: 'high', assignee: 'Hassan Alavi' },
          { title: 'Logistics Rack Bolt Tightening', desc: 'Secure load-bearing bolts on logistics shelves in Zone C.', category: 'maintenance', priority: 'medium', assignee: 'Mohammad Reza' },
        ];
        const selected = mockTasks[Math.floor(Math.random() * mockTasks.length)];
        const newTask: Task = {
          id: `T-${Math.floor(Math.random() * 900 + 100)}`,
          title: selected.title,
          description: selected.desc,
          category: selected.category as Task['category'],
          priority: selected.priority as Task['priority'],
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          assignee: selected.assignee,
          status: 'todo',
        };
        setTasks(prev => {
          if (prev.some(t => t.title === newTask.title)) return prev;
          return [...prev, newTask];
        });
      }
    }, 25000); // every 25 seconds
    return () => clearInterval(timer);
  }, []);

  const getInputStyle = (fieldName: string) => ({
    borderColor: focusedField === fieldName ? 'var(--primary)' : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedField === fieldName
      ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)')
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const categorySelectOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Categories' },
      ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
    ];
  }, []);

  const categoryFormOptions = useMemo(() => {
    return Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const priorityFormOptions = useMemo(() => {
    return Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const assigneeOptions = [
    { value: 'Ali Mohammadi', label: 'Ali Mohammadi' },
    { value: 'Hassan Alavi', label: 'Hassan Alavi' },
    { value: 'Sara Nouri', label: 'Sara Nouri' },
    { value: 'Mohammad Reza', label: 'Mohammad Reza' },
  ];

  // Filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchQuery, categoryFilter]);

  // Task Handlers
  const handleMoveTask = (id: string, dir: 'left' | 'right') => {
    const statuses: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const currIdx = statuses.indexOf(t.status);
        let nextIdx = currIdx + (dir === 'right' ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < statuses.length) {
          return { ...t, status: statuses[nextIdx] };
        }
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newTask: Task = {
      id: `T-${Date.now().toString().slice(-3)}`,
      title: formTitle,
      description: formDesc,
      category: formCategory,
      priority: formPriority,
      dueDate: formDate,
      assignee: formAssignee,
      status: 'todo',
    };

    setTasks(prev => [...prev, newTask]);
    setFormTitle('');
    setFormDesc('');
    setIsModalOpen(false);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const critical = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, critical, progress };
  }, [tasks]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Tasks
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Safety Compliance Tasks
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', borderRadius: '12px' }}>
            <IconPlus /> Add Task
          </GlassButton>
        </div>
      </div>

      {/* ─── Metrics Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[120px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Total Tasks</span>
          <span className="text-3xl font-black mt-2" style={{ color: pri }}>{stats.total}</span>
        </div>
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[120px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Completed</span>
          <span className="text-3xl font-black mt-2 text-emerald-500">{stats.completed}</span>
        </div>
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[120px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Active Critical</span>
          <span className="text-3xl font-black mt-2 text-red-500">{stats.critical}</span>
        </div>
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[120px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Compliance Score</span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-black" style={{ color: pri }}>{stats.progress}%</span>
            <div className="flex-1 h-2 rounded-full bg-gray-500/20 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${stats.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filter Toolbar ─── */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row gap-3.5 items-center justify-between transition-colors"
        style={{
          borderColor: borderCol,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs opacity-60" style={{ color: sec }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200"
            style={{
              borderColor: borderCol,
              background: inputBg,
              color: pri,
            }}
          />
        </div>

        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categorySelectOptions}
            isDark={isDark}
            className="w-full md:w-48 flex-shrink-0"
          />
        </div>
      </div>

      {/* ─── Kanban Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className="rounded-2xl p-4 flex flex-col gap-4 border min-h-[120px] lg:min-h-[500px]"
              style={{
                ...glassStyle(isDark),
                borderRadius: 16,
                borderColor: borderCol,
              }}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: borderCol }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-bold" style={{ color: pri }}>{col.label}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 font-bold" style={{ color: sec }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence mode="popLayout">
                  {colTasks.map(task => {
                    const cat = CATEGORIES[task.category] || CATEGORIES.inspection;
                    const prio = PRIORITIES[task.priority] || PRIORITIES.medium;
                    return (
                      <motion.div
                        key={task.id}
                        layoutId={task.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="p-4 rounded-xl border flex flex-col gap-3 transition-all relative group"
                        style={{
                          background: bg,
                          borderColor: borderCol,
                        }}
                      >
                        {/* Title and tags */}
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-semibold text-primary tracking-wider uppercase">{task.id}</span>
                          <span
                            className="text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: prio.bg, color: prio.color }}
                          >
                            {prio.label}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold leading-snug" style={{ color: pri }}>{task.title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: mut }}>{task.description}</p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1" style={{ color: sec }}>
                          <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <IconClock /> {task.dueDate}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <IconUser /> {task.assignee}
                          </span>
                        </div>

                        {/* Column flow handlers */}
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-dashed" style={{ borderColor: borderCol }}>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleMoveTask(task.id, 'left')}
                              disabled={task.status === 'todo'}
                              className="w-6 h-6 rounded flex items-center justify-center border cursor-pointer opacity-50 hover:opacity-100 disabled:opacity-10 disabled:cursor-not-allowed transition-all"
                              style={{ borderColor: borderCol, color: pri }}
                            >
                              <IconArrowLeft />
                            </button>
                            <button
                              onClick={() => handleMoveTask(task.id, 'right')}
                              disabled={task.status === 'done'}
                              className="w-6 h-6 rounded flex items-center justify-center border cursor-pointer opacity-50 hover:opacity-100 disabled:opacity-10 disabled:cursor-not-allowed transition-all"
                              style={{ borderColor: borderCol, color: pri }}
                            >
                              <IconArrowRight />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-6 h-6 rounded flex items-center justify-center border cursor-pointer opacity-50 hover:opacity-100 hover:text-red-500 hover:border-red-500/35 transition-all text-red-500/70"
                            style={{ borderColor: borderCol }}
                          >
                            <IconTrash />
                          </button>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Add Task Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl p-6 overflow-hidden shadow-2xl border transition-colors"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderCol,
              }}
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b" style={{ borderColor: borderCol }}>
                <h3 className="text-base font-bold" style={{ color: pri }}>Add Compliance Task</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 transition-colors"
                  style={{ borderColor: borderCol, color: sec }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter short title (e.g. Zone A Sweep)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border"
                    style={getInputStyle('title')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about compliance criteria..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    onFocus={() => setFocusedField('desc')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none"
                    style={getInputStyle('desc')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Category</label>
                    <CustomSelect
                      value={formCategory}
                      onChange={(val) => setFormCategory(val)}
                      options={categoryFormOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Priority</label>
                    <CustomSelect
                      value={formPriority}
                      onChange={(val) => setFormPriority(val)}
                      options={priorityFormOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Due Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      onFocus={() => setFocusedField('date')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('date')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Assignee</label>
                    <CustomSelect
                      value={formAssignee}
                      onChange={(val) => setFormAssignee(val)}
                      options={assigneeOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3.5 border-t" style={{ borderColor: borderCol }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-colors"
                    style={{ borderColor: borderCol, background: 'transparent', color: pri }}
                  >
                    Cancel
                  </button>
                  <GlassButton type="submit" style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '12px' }}>
                    Create
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
