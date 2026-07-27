'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useIsMobile } from './useIsMobile';
import SafeCalendarMobile from './SafeCalendarMobile';

interface Props {
  isDark: boolean;
}

// ─── Event Types & Priority Interfaces ─────────────────────────────────────
export interface SafetyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  category: 'inspection' | 'drill' | 'audit' | 'maintenance' | 'training' | 'incident';
  priority: 'critical' | 'high' | 'medium' | 'low';
  zone: string;
  description: string;
}

// ─── Constant Definitions ──────────────────────────────────────────────────
export const CATEGORIES = {
  inspection: { label: 'Safety Inspection', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  drill: { label: 'Emergency Drill', color: 'var(--primary)', bg: 'rgba(var(--primary-rgb),0.1)' },
  incident: { label: 'Safety Incident', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  maintenance: { label: 'Equipment Maintenance', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  audit: { label: 'Compliance Audit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  training: { label: 'Safety Training', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
};

export const PRIORITIES = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: 'High', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export const ZONES = [
  'Zone A - Manufacturing',
  'Zone B - Warehouse',
  'Zone C - Logistics',
  'Zone D - Offices',
  'All Zones',
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Initial Mock Data ─────────────────────────────────────────────────────
export const INITIAL_EVENTS: SafetyEvent[] = [
  {
    id: 'e1',
    title: 'Zone A Annual Fire Drill',
    date: '2026-06-05',
    startTime: '09:00',
    endTime: '11:00',
    category: 'drill',
    priority: 'high',
    zone: 'Zone A - Manufacturing',
    description: 'Full facility evacuation drill with local fire department observers. All zone alarm systems will be tested.',
  },
  {
    id: 'e2',
    title: 'HVAC Air Filter Replacement',
    date: '2026-06-12',
    startTime: '08:00',
    endTime: '12:00',
    category: 'maintenance',
    priority: 'low',
    zone: 'Zone B - Warehouse',
    description: 'Routine HVAC air flow inspection and filter maintenance to comply with workplace air safety metrics.',
  },
  {
    id: 'e3',
    title: 'Quarterly Compliance Audit',
    date: '2026-06-18',
    startTime: '10:00',
    endTime: '16:00',
    category: 'audit',
    priority: 'medium',
    zone: 'All Zones',
    description: 'Full inspection of safety records, machinery safety guards, and emergency exit signs across the site.',
  },
  {
    id: 'e4',
    title: 'Minor Chemical Spill Containment',
    date: '2026-06-19',
    startTime: '13:15',
    endTime: '14:30',
    category: 'incident',
    priority: 'critical',
    zone: 'Zone A - Manufacturing',
    description: 'Containment and clean-up of minor glycol spill. Clean-up complete, incident report logged in CRM dashboard.',
  },
  {
    id: 'e5',
    title: 'First Aid Refresher Course',
    date: '2026-06-19',
    startTime: '15:00',
    endTime: '17:00',
    category: 'training',
    priority: 'low',
    zone: 'Zone C - Logistics',
    description: 'Hands-on practical training covering CPR, AED usage, and immediate minor injury triage.',
  },
  {
    id: 'e6',
    title: 'Zone C Scaffolding Review',
    date: '2026-06-22',
    startTime: '09:30',
    endTime: '11:30',
    category: 'inspection',
    priority: 'high',
    zone: 'Zone C - Logistics',
    description: 'Structural inspection of newly erected warehouse shelving and scaffolding systems.',
  },
  {
    id: 'e7',
    title: 'Forklift Safety Certification',
    date: '2026-06-26',
    startTime: '08:30',
    endTime: '15:00',
    category: 'training',
    priority: 'medium',
    zone: 'Zone B - Warehouse',
    description: 'Annual certification course for operations staff running heavy duty forklift vehicles.',
  },
  {
    id: 'e8',
    title: 'Electrical Panel Inspection',
    date: '2026-06-29',
    startTime: '13:00',
    endTime: '15:30',
    category: 'inspection',
    priority: 'high',
    zone: 'Zone A - Manufacturing',
    description: 'Thermal imaging inspection of main breaker panels to identify hot spots or overloading.',
  },
  {
    id: 'e9',
    title: 'Zone B Safety Briefing',
    date: '2026-07-02',
    startTime: '08:00',
    endTime: '08:45',
    category: 'training',
    priority: 'low',
    zone: 'Zone B - Warehouse',
    description: 'Pre-shift safety protocol briefing for warehouse operations team members.',
  },
];

// ─── Inline SVG Helpers ────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconWrench = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconBookOpen = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconClipboard = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────────────
export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const formatDateString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function CardWrapper({ children, isDark, delay = 0, className = '' }: { children: React.ReactNode; isDark: boolean; delay?: number; className?: string }) {
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-[18px] p-3.5 sm:p-5 flex flex-col transition-colors ${className}`}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </motion.div>
  );
}

export default function SafeCalendar({ isDark }: Props) {
  // Below the lg breakpoint, render the dedicated mobile screen instead.
  const isMobile = useIsMobile();
  if (isMobile) return <SafeCalendarMobile isDark={isDark} />;
  return <SafeCalendarDesktop isDark={isDark} />;
}

function SafeCalendarDesktop({ isDark }: Props) {
  const { primaryColor } = useTheme();
  // Theme styling helpers
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';

  // Current Calendar state (June 2026 by default to showcase mock events)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19)); // Start on June 19, 2026

  // Events list state
  const [events, setEvents] = useState<SafetyEvent[]>(INITIAL_EVENTS);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-06-19');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<keyof typeof CATEGORIES>('inspection');
  const [formPriority, setFormPriority] = useState<keyof typeof PRIORITIES>('medium');
  const [formZone, setFormZone] = useState('Zone A - Manufacturing');
  const [formDescription, setFormDescription] = useState('');

  // Focus and styling for modal inputs
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getInputStyle = (fieldName: string) => ({
    borderColor: focusedField === fieldName ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedField === fieldName
      ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)')
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const categoryFormOptions = useMemo(() => {
    return Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const priorityFormOptions = useMemo(() => {
    return Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const zoneFormOptions = useMemo(() => {
    return ZONES.map(z => ({ value: z, label: z }));
  }, []);

  // Clock dynamic display
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter options mapping for CustomSelect
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  // Filtering Logic
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.zone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [events, searchQuery, categoryFilter, priorityFilter]);

  // Calendar Grid builder
  const gridCells = useMemo(() => {
    const list = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInCurrMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Previous Month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      list.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        dayNumber: daysInPrevMonth - i,
      });
    }

    // Current Month days
    for (let i = 1; i <= daysInCurrMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      list.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        dayNumber: i,
      });
    }

    // Next Month padding days (fill to 6 full rows = 42 cells)
    const remaining = 42 - list.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      list.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        dayNumber: i,
      });
    }

    return list;
  }, [currentMonth, currentYear]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(p => p - 1);
    } else {
      setCurrentMonth(p => p - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(p => p + 1);
    } else {
      setCurrentMonth(p => p + 1);
    }
  };

  // Get active day events
  const selectedDayEvents = useMemo(() => {
    const formatted = formatDateString(selectedDate);
    return filteredEvents.filter(e => e.date === formatted);
  }, [selectedDate, filteredEvents]);

  // Get upcoming events chronologically (ignoring filtered, sorted from today onwards)
  const upcomingEvents = useMemo(() => {
    // We base chronological check relative to June 19, 2026 (the active dashboard simulation date)
    const referenceDateStr = '2026-06-19';
    return events
      .filter(e => e.date >= referenceDateStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 4);
  }, [events]);

  // Check categories to render proper icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inspection': return <IconShield />;
      case 'drill': return <IconWrench />;
      case 'incident': return <IconAlert />;
      case 'maintenance': return <IconWrench />;
      case 'audit': return <IconClipboard />;
      case 'training': return <IconBookOpen />;
      default: return <IconShield />;
    }
  };

  // Handle Event submission
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newEvent: SafetyEvent = {
      id: `e-${Date.now()}`,
      title: formTitle,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      category: formCategory,
      priority: formPriority,
      zone: formZone,
      description: formDescription,
    };

    setEvents(prev => [...prev, newEvent]);
    
    // Reset Form
    setFormTitle('');
    setFormDescription('');
    setIsModalOpen(false);
  };

  // Trigger Modal and set default date to current selectedDate
  const openScheduleModal = () => {
    setFormDate(formatDateString(selectedDate));
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Calendar
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Safety Calendar
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-mono select-none transition-colors border bg-[rgba(var(--primary-rgb),0.06)] border-[rgba(var(--primary-rgb),0.2)] flex items-center gap-1.5" style={{ color: primaryColor }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primaryColor }}></span>
            {timeStr || '12:00:00 PM'}
          </div>
          <GlassButton onClick={openScheduleModal} style={{ padding: '8px 16px', borderRadius: '12px' }}>
            <IconPlus /> Schedule Event
          </GlassButton>
        </div>
      </div>

      {/* ─── Toolbar / Filters ────────────────────────────────────────────── */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row gap-3.5 items-center justify-between transition-colors"
        style={{
          borderColor: borderSubtle(isDark),
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: sec }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search events, descriptions or zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200"
            style={{
              borderColor: borderSubtle(isDark),
              background: inputBg,
              color: pri,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
            isDark={isDark}
            className="w-full md:w-48 md:flex-shrink-0"
          />
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityOptions}
            isDark={isDark}
            className="w-full md:w-44 md:flex-shrink-0"
          />
          {(searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setPriorityFilter('all');
              }}
              className="text-sm font-semibold cursor-pointer transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── Grid Dashboard Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Column 1 & 2: Calendar Card */}
        <div className="lg:col-span-2">
          <CardWrapper isDark={isDark} delay={0.1} className="h-full">
            
            {/* Month & Navigation */}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-3.5">
                <h2 className="text-xl font-bold" style={{ color: pri }}>
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                {filteredEvents.length > 0 && (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[rgba(var(--primary-rgb),0.1)]" style={{ color: primaryColor }}>
                    {filteredEvents.length} events
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handlePrevMonth}
                  style={{ width: 36, height: 36, padding: 0, borderRadius: '10px' }}
                >
                  <IconArrowLeft />
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    setSelectedDate(today);
                  }}
                  style={{ height: 36, padding: '0 14px', borderRadius: '10px', fontSize: '13px' }}
                >
                  Today
                </GlassButton>
                <GlassButton
                  onClick={handleNextMonth}
                  style={{ width: 36, height: 36, padding: 0, borderRadius: '10px' }}
                >
                  <IconArrowRight />
                </GlassButton>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center mb-4 min-w-0">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-[10px] xs:text-xs font-bold py-1 truncate" style={{ color: mut }}>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                    <span className="hidden sm:inline">{day.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              {/* Grid cells with animated transition on month change */}
              <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentMonth}-${currentYear}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className="grid grid-cols-7 grid-rows-6 gap-0.5 xs:gap-1 sm:gap-1.5 absolute inset-0 max-w-6xl 4xl:max-w-7xl mx-auto w-full"
                  >
                    {gridCells.map((cell, idx) => {
                      const cellEvents = filteredEvents.filter(e => e.date === formatDateString(cell.date));
                      const isSelected = isSameDay(cell.date, selectedDate);
                  
                  // Style configurations
                  const cellBg = isSelected
                    ? (isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.08)')
                    : 'transparent';
                  
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        zIndex: 10,
                        boxShadow: isDark
                          ? '0 12px 28px rgba(0,0,0,0.6), 0 0 1px 1px rgba(var(--primary-rgb),0.2)'
                          : '0 12px 28px rgba(var(--primary-rgb),0.1), 0 0 1px 1px rgba(var(--primary-rgb),0.1)',
                      }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      className="group p-1 sm:p-3 rounded-lg sm:rounded-2xl flex flex-col items-start justify-between text-left select-none relative cursor-pointer transition-colors duration-150"
                      style={{
                        background: cellBg,
                        border: (cell.isToday && !isSelected) ? `1px solid ${primaryColor}` : `1px solid ${borderSubtle(isDark)}`,
                        opacity: cell.isCurrentMonth ? 1 : 0.4,
                      }}
                    >
                      {/* Day number & today highlight */}
                      <div className="flex justify-between items-center w-full">
                        <span
                          className="text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors"
                          style={{
                            color: cell.isToday ? '#ffffff' : pri,
                            background: cell.isToday ? primaryColor : 'transparent',
                          }}
                        >
                          {cell.dayNumber}
                        </span>
                      </div>

                      {/* Event dots — clear circles + overflow (no clip) */}
                      {cellEvents.length > 0 && (
                        <div className="flex flex-nowrap items-center gap-1 mt-auto pt-1 w-full min-h-[10px] sm:min-h-[12px]">
                          {cellEvents.slice(0, 4).map((e) => (
                            <span
                              key={e.id}
                              className="inline-block shrink-0 rounded-full"
                              style={{
                                width: 7,
                                height: 7,
                                backgroundColor: CATEGORIES[e.category]?.color || primaryColor,
                                boxShadow: isDark
                                  ? '0 0 0 1px rgba(255,255,255,0.12)'
                                  : '0 0 0 1px rgba(0,0,0,0.06)',
                              }}
                              title={`${e.title} (${e.startTime})`}
                            />
                          ))}
                          {cellEvents.length > 4 && (
                            <span
                              className="text-[10px] sm:text-[11px] font-semibold leading-none tabular-nums shrink-0"
                              style={{ color: mut }}
                            >
                              +{cellEvents.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </CardWrapper>
        </div>

        {/* Column 3: Event Details & Upcoming Panel */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          
          {/* Active Date Panel */}
          <CardWrapper isDark={isDark} delay={0.2} className="min-h-[280px]">
            <div className="border-b pb-3 mb-4 flex justify-between items-center" style={{ borderColor: borderSubtle(isDark) }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: pri }}>
                  {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <p className="text-xs" style={{ color: sec }}>Selected day activities</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-[rgba(var(--primary-rgb),0.1)]" style={{ color: primaryColor }}>
                {selectedDayEvents.length} scheduled
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[220px]" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="popLayout">
                {selectedDayEvents.length === 0 ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col items-center justify-center text-center py-6"
                  >
                    <div className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-2.5" style={{ borderColor: borderSubtle(isDark), color: mut }}>
                      <IconShield />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: sec }}>No Events scheduled</p>
                    <p className="text-xs mb-4" style={{ color: mut }}>Schedule training or safety drills</p>
                    <GlassButton onClick={openScheduleModal} style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}>
                      + Add Event
                    </GlassButton>
                  </motion.div>
                ) : (
                  selectedDayEvents.map((e, index) => {
                    const cat = CATEGORIES[e.category] || CATEGORIES.inspection;
                    const prio = PRIORITIES[e.priority] || PRIORITIES.medium;
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 15, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 22, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 2, boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)' }}
                        className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all duration-150 cursor-pointer"
                        style={{
                          borderColor: borderSubtle(isDark),
                          background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                        }}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-sm font-semibold" style={{ color: pri }}>{e.title}</span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: prio.bg, color: prio.color }}
                          >
                            {prio.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs" style={{ color: sec }}>
                          <span className="flex items-center gap-1">
                            <span className="shrink-0">{getCategoryIcon(e.category)}</span>
                            {cat.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconClock />
                            {e.startTime} - {e.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconMapPin />
                            {e.zone}
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed" style={{ color: mut }}>
                          {e.description}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </CardWrapper>

          {/* Upcoming Events list */}
          <CardWrapper isDark={isDark} delay={0.3}>
            <h3 className="text-base font-bold mb-4" style={{ color: pri }}>Upcoming Safety Events</h3>
            <div className="space-y-4">
              {upcomingEvents.map(e => {
                const dateObj = new Date(e.date);
                const day = dateObj.getDate();
                const mStr = dateObj.toLocaleDateString([], { month: 'short' });
                const cat = CATEGORIES[e.category] || CATEGORIES.inspection;

                return (
                  <motion.div
                    key={e.id}
                    onClick={() => {
                      setSelectedDate(dateObj);
                      setCurrentMonth(dateObj.getMonth());
                      setCurrentYear(dateObj.getFullYear());
                    }}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex gap-4 items-center cursor-pointer group select-none"
                  >
                    {/* Date Block */}
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:border-[rgba(var(--primary-rgb),0.4)]"
                      style={{
                        borderColor: borderSubtle(isDark),
                        background: surfaceItem(isDark),
                      }}
                    >
                      <span className="text-[11px] uppercase font-bold transition-colors group-hover:text-[var(--primary)]" style={{ color: mut }}>{mStr}</span>
                      <span className="text-base font-black leading-none transition-colors group-hover:text-[var(--primary)]" style={{ color: pri }}>{day}</span>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors" style={{ color: pri }}>
                        {e.title}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-1 text-xs" style={{ color: sec }}>
                        <span className="flex items-center gap-0.5">
                          <IconClock /> {e.startTime}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500/30 shrink-0"></span>
                        <span style={{ color: cat.color }}>{cat.label}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardWrapper>

        </div>

      </div>

      {/* ─── Add Event Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl p-6 overflow-hidden shadow-2xl border transition-colors"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderSubtle(isDark),
                boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.8)' : '0 25px 50px -12px rgba(0,0,0,0.15)',
              }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b" style={{ borderColor: borderSubtle(isDark) }}>
                <h3 className="text-base font-bold" style={{ color: pri }}>Schedule Safety Activity</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 transition-colors"
                  style={{ borderColor: borderSubtle(isDark), color: sec }}
                >
                  ✕
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleAddEvent} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter activity title (e.g. Zone B Drill)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border"
                    style={getInputStyle('title')}
                  />
                </div>

                {/* Category & Priority Grid */}
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

                {/* Date & Zone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Date</label>
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
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Zone</label>
                    <CustomSelect
                      value={formZone}
                      onChange={(val) => setFormZone(val)}
                      options={zoneFormOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Time range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Start Time</label>
                    <input
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      onFocus={() => setFocusedField('startTime')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('startTime')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>End Time</label>
                    <input
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      onFocus={() => setFocusedField('endTime')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('endTime')}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about the safety objective, compliance rules or instructions..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none"
                    style={getInputStyle('description')}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-3.5 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                  <motion.button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-colors"
                    style={{
                      borderColor: borderSubtle(isDark),
                      background: 'transparent',
                      color: pri,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <GlassButton type="submit" style={{ padding: '8px 20px', borderRadius: '12px' }}>
                    Schedule
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
