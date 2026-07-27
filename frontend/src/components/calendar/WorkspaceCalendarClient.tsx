'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  MdClose,
  MdLink,
  MdLocationOn,
  MdPeople,
  MdTaskAlt,
  MdVideocam,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { getJalaliParts, formatDayMonthBadge, parseLocalYmd, toFaDigits } from '@/lib/app-date';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import CustomSelect from '@/components/SafeDashboard/CustomSelect';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle, panelFill } from '@/components/SafeDashboard/theme';
import {
  PRIORITIES,
  MONTHS,
  WEEKDAYS,
  isSameDay,
  formatDateString,
} from '@/components/SafeDashboard/SafeCalendar';
import { useIsMobile } from '@/components/SafeDashboard/useIsMobile';

type CalEvent = {
  id: string;
  kind: 'event';
  eventKind: string;
  title: string;
  description?: string | null;
  meetingMode: 'IN_APP' | 'IN_PERSON' | 'LINK';
  meetingUrl?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  color: string;
  createdBy: { id: string; name: string; avatarUrl?: string | null };
  attendees: {
    userId: string;
    status: string;
    name: string;
    avatarUrl?: string | null;
  }[];
  canEdit?: boolean;
};

type CalTask = {
  id: string;
  kind: 'task';
  title: string;
  startsAt: string;
  endsAt: string;
  color: string;
  boardId: string;
  boardName: string;
  priority: string;
  href: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

type DisplayCategory = 'meeting' | 'ceremony' | 'reminder' | 'other' | 'task';

type DisplayItem = {
  id: string;
  source: CalEvent | CalTask;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: DisplayCategory;
  priority: keyof typeof PRIORITIES;
  zone: string;
  description: string;
};

const CATEGORIES: Record<
  DisplayCategory,
  { label: string; color: string; bg: string }
> = {
  meeting: { label: 'Meeting', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ceremony: { label: 'Ceremony', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  reminder: { label: 'Reminder', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  other: { label: 'Event', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  task: { label: 'Task', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

function calendarCategoryLabel(
  t: (key: string) => string,
  cat: DisplayCategory,
): string {
  const keys: Record<DisplayCategory, string> = {
    meeting: 'calendarPage.meeting',
    ceremony: 'calendarPage.ceremony',
    reminder: 'calendarPage.reminder',
    other: 'calendarPage.event',
    task: 'calendarPage.task',
  };
  return t(keys[cat]);
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapPriority(raw?: string): keyof typeof PRIORITIES {
  const p = (raw || '').toUpperCase();
  if (p === 'CRITICAL' || p === 'URGENT') return 'critical';
  if (p === 'HIGH') return 'high';
  if (p === 'LOW') return 'low';
  return 'medium';
}

function mapEventCategory(kind: string): DisplayCategory {
  if (kind === 'MEETING') return 'meeting';
  if (kind === 'CEREMONY') return 'ceremony';
  if (kind === 'REMINDER') return 'reminder';
  return 'other';
}

function toDisplay(item: CalEvent | CalTask): DisplayItem {
  if (item.kind === 'task') {
    return {
      id: `task-${item.id}`,
      source: item,
      title: item.title,
      date: formatDateString(new Date(item.endsAt)),
      startTime: timeOf(item.startsAt),
      endTime: timeOf(item.endsAt),
      category: 'task',
      priority: mapPriority(item.priority),
      zone: item.boardName || 'Project',
      description: `Due on ${item.boardName}`,
    };
  }
  const zone =
    item.meetingMode === 'IN_PERSON'
      ? item.location || 'In person'
      : item.meetingMode === 'LINK'
        ? 'Meeting link'
        : 'In-app meeting';
  return {
    id: `event-${item.id}`,
    source: item,
    title: item.title,
    date: formatDateString(new Date(item.startsAt)),
    startTime: timeOf(item.startsAt),
    endTime: timeOf(item.endsAt),
    category: mapEventCategory(item.eventKind),
    priority: 'medium',
    zone,
    description: item.description || '',
  };
}

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

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function CardWrapper({
  children,
  isDark,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  isDark: boolean;
  delay?: number;
  className?: string;
}) {
  const bg = 'transparent';
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

export function WorkspaceCalendarClient({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { lang, t } = useLang();
  const { calendar, formatDate } = useCalendar();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const focusEventId = searchParams.get('event');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(now);

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [tasks, setTasks] = useState<CalTask[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalEvent | CalTask | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [busy, setBusy] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    kind: 'MEETING' as 'MEETING' | 'CEREMONY' | 'REMINDER' | 'OTHER',
    meetingMode: 'IN_APP' as 'IN_APP' | 'IN_PERSON' | 'LINK',
    meetingUrl: '',
    location: '',
    date: formatDateString(now),
    startTime: '10:00',
    endTime: '11:00',
    color: '#8B5CF6',
    attendeeIds: [] as string[],
  });

  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const range = useMemo(() => {
    const from = new Date(currentYear, currentMonth, 1);
    const to = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [currentYear, currentMonth]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/calendar?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
      );
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setEvents(json.data?.events || []);
      setTasks(json.data?.tasks || []);
      setCanCreate(!!json.meta?.canCreate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch(`/api/workspaces/${workspaceId}/chat/team`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setTeam(
            j.data.map(
              (t: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
                role: string;
              }) => ({
                id: t.id,
                name: t.name,
                email: t.email,
                avatarUrl: t.avatarUrl,
                role: t.role,
              }),
            ),
          );
        }
      })
      .catch(() => undefined);
  }, [workspaceId]);

  useEffect(() => {
    if (!focusEventId || !events.length) return;
    const hit = events.find((e) => e.id === focusEventId);
    if (hit) {
      setDetail(hit);
      setSelectedDate(new Date(hit.startsAt));
      setCurrentMonth(new Date(hit.startsAt).getMonth());
      setCurrentYear(new Date(hit.startsAt).getFullYear());
    }
  }, [focusEventId, events]);

  const displayItems = useMemo(() => {
    return [...events.map(toDisplay), ...tasks.map(toDisplay)];
  }, [events, tasks]);

  const filteredEvents = useMemo(() => {
    return displayItems.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.zone.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [displayItems, searchQuery, categoryFilter, priorityFilter]);

  const gridCells = useMemo(() => {
    const list: {
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayNumber: number;
    }[] = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInCurrMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      list.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        dayNumber: daysInPrevMonth - i,
      });
    }
    for (let i = 1; i <= daysInCurrMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      list.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        dayNumber: i,
      });
    }
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

  const selectedDayEvents = useMemo(() => {
    const formatted = formatDateString(selectedDate);
    return filteredEvents
      .filter((e) => e.date === formatted)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const today = formatDateString(new Date());
    return filteredEvents
      .filter((e) => e.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 4);
  }, [filteredEvents]);

  const categoryOptions = [
    { value: 'all', label: t('calendarPage.allCategories') },
    { value: 'meeting', label: t('calendarPage.meeting') },
    { value: 'ceremony', label: t('calendarPage.ceremony') },
    { value: 'reminder', label: t('calendarPage.reminder') },
    { value: 'other', label: t('calendarPage.event') },
    { value: 'task', label: t('calendarPage.task') },
  ];
  const priorityOptions = [
    { value: 'all', label: t('common.all') },
    ...Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })),
  ];
  const kindFormOptions = [
    { value: 'MEETING', label: t('calendarPage.meeting') },
    { value: 'CEREMONY', label: t('calendarPage.ceremony') },
    { value: 'REMINDER', label: t('calendarPage.reminder') },
    { value: 'OTHER', label: t('calendarPage.other') },
  ];

  const getInputStyle = (fieldName: string) => ({
    borderColor: focusedField === fieldName ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow:
      focusedField === fieldName
        ? isDark
          ? '0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)'
          : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)'
        : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((p) => p - 1);
    } else setCurrentMonth((p) => p - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((p) => p + 1);
    } else setCurrentMonth((p) => p + 1);
  };

  const openScheduleModal = () => {
    setForm((f) => ({ ...f, date: formatDateString(selectedDate) }));
    setIsModalOpen(true);
  };

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const startsAt = new Date(`${form.date}T${form.startTime}:00`);
      const endsAt = new Date(`${form.date}T${form.endTime}:00`);
      const res = await fetch(`/api/workspaces/${workspaceId}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          kind: form.kind,
          meetingMode: form.meetingMode,
          meetingUrl: form.meetingMode === 'LINK' ? form.meetingUrl.trim() : null,
          location: form.meetingMode === 'IN_PERSON' ? form.location.trim() : null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          color: form.color,
          attendeeIds: form.attendeeIds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Create failed');
      setIsModalOpen(false);
      setForm((f) => ({
        ...f,
        title: '',
        description: '',
        meetingUrl: '',
        location: '',
        attendeeIds: [],
      }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function rsvp(eventId: string, status: 'ACCEPTED' | 'DECLINED') {
    await fetch(`/api/workspaces/${workspaceId}/calendar/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myStatus: status }),
    });
    await load();
  }

  async function removeEvent(eventId: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/workspaces/${workspaceId}/calendar/${eventId}`, {
      method: 'DELETE',
    });
    setDetail(null);
    await load();
  }

  return (
    <div
      className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 py-4 sm:py-5'} space-y-6`}
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Header — same as SafeCalendar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            {t('calendarPage.breadcrumb')}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            {t('calendarPage.title')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className="px-3.5 py-1.5 rounded-full text-xs font-mono select-none transition-colors border bg-[rgba(var(--primary-rgb),0.06)] border-[rgba(var(--primary-rgb),0.2)] flex items-center gap-1.5"
            style={{ color: primaryColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primaryColor }} />
            {timeStr || '12:00:00 PM'}
          </div>
          {canCreate && (
            <GlassButton onClick={openScheduleModal} style={{ padding: '8px 16px', borderRadius: '12px' }}>
              <IconPlus /> {t('calendarPage.scheduleEvent')}
            </GlassButton>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* Toolbar / Filters */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row gap-3.5 items-center justify-between transition-colors"
        style={{
          borderColor: borderSubtle(isDark),
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <div className="relative w-full md:w-80">
          <span className="absolute start-3.5 top-1/2 -translate-y-1/2" style={{ color: sec }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder={t('calendarPage.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200"
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
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setPriorityFilter('all');
              }}
              className="text-sm font-semibold cursor-pointer transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              {t('calendarPage.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <CardWrapper isDark={isDark} delay={0.1} className="h-full">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-3.5">
                <h2 className="text-xl font-bold" style={{ color: pri }}>
                  {calendar === 'jalali'
                    ? formatDate(new Date(currentYear, currentMonth, 15), 'monthYear')
                    : `${MONTHS[currentMonth]} ${currentYear}`}
                </h2>
                {filteredEvents.length > 0 && (
                  <span
                    className="px-2.5 py-1 rounded text-xs font-bold bg-[rgba(var(--primary-rgb),0.1)]"
                    style={{ color: primaryColor }}
                  >
                    {t('calendarPage.eventsCount', {
                      n:
                        lang === 'fa'
                          ? toFaDigits(String(filteredEvents.length))
                          : filteredEvents.length,
                    })}
                  </span>
                )}
                {loading && (
                  <span className="text-xs" style={{ color: mut }}>
                    {t('common.loading')}
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
                  {t('calendarPage.today')}
                </GlassButton>
                <GlassButton
                  onClick={handleNextMonth}
                  style={{ width: 36, height: 36, padding: 0, borderRadius: '10px' }}
                >
                  <IconArrowRight />
                </GlassButton>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 text-center mb-4 min-w-0">
                {(lang === 'fa'
                  ? ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
                  : WEEKDAYS
                ).map((day) => (
                  <div key={day} className="text-[10px] xs:text-xs font-bold py-1 truncate" style={{ color: mut }}>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                    <span className="hidden sm:inline">{lang === 'fa' ? day : day.toUpperCase()}</span>
                  </div>
                ))}
              </div>

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
                      const cellEvents = filteredEvents.filter(
                        (e) => e.date === formatDateString(cell.date),
                      );
                      const isSelected = isSameDay(cell.date, selectedDate);
                      const cellBg = isSelected
                        ? isDark
                          ? 'rgba(var(--primary-rgb), 0.15)'
                          : 'rgba(var(--primary-rgb), 0.08)'
                        : 'transparent';

                      return (
                        <motion.button
                          key={idx}
                          type="button"
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
                          className="group p-1 sm:p-3 rounded-lg sm:rounded-2xl flex flex-col items-start justify-between text-start select-none relative cursor-pointer transition-colors duration-150"
                          style={{
                            background: cellBg,
                            border:
                              cell.isToday && !isSelected
                                ? `1px solid ${primaryColor}`
                                : `1px solid ${borderSubtle(isDark)}`,
                            opacity: cell.isCurrentMonth ? 1 : 0.4,
                          }}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span
                              className="text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors"
                              style={{
                                color: cell.isToday ? '#ffffff' : pri,
                                background: cell.isToday ? primaryColor : 'transparent',
                              }}
                            >
                              {calendar === 'jalali'
                                ? getJalaliParts(cell.date).jd
                                : cell.dayNumber}
                            </span>
                          </div>
                          {/* Event dots — match SafeCalendar reference: clear circles + overflow count */}
                          {cellEvents.length > 0 && (
                            <div className="flex flex-nowrap items-center gap-1 mt-auto pt-1 w-full min-h-[10px] sm:min-h-[12px]">
                              {cellEvents.slice(0, 4).map((e) => (
                                <span
                                  key={e.id}
                                  className="inline-block shrink-0 rounded-full"
                                  style={{
                                    width: 7,
                                    height: 7,
                                    backgroundColor:
                                      CATEGORIES[e.category]?.color || primaryColor,
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

        {/* Right panel */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <CardWrapper isDark={isDark} delay={0.2} className="min-h-[280px]">
            <div
              className="border-b pb-3 mb-4 flex justify-between items-center"
              style={{ borderColor: borderSubtle(isDark) }}
            >
              <div>
                <h3 className="text-base font-bold" style={{ color: pri }}>
                  {formatDate(selectedDate, 'long')}
                </h3>
                <p className="text-xs" style={{ color: sec }}>
                  {t('calendarPage.selectedDay')}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded bg-[rgba(var(--primary-rgb),0.1)]"
                style={{ color: primaryColor }}
              >
                {selectedDayEvents.length} {t('calendarPage.scheduled')}
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
                    <div
                      className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-2.5"
                      style={{ borderColor: borderSubtle(isDark), color: mut }}
                    >
                      <IconShield />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: sec }}>
                      {t('calendarPage.noEvents')}
                    </p>
                    <p className="text-xs mb-4" style={{ color: mut }}>
                      {t('calendarPage.noEventsHint')}
                    </p>
                    {canCreate && (
                      <GlassButton
                        onClick={openScheduleModal}
                        style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}
                      >
                        + {t('calendarPage.addEvent')}
                      </GlassButton>
                    )}
                  </motion.div>
                ) : (
                  selectedDayEvents.map((e, index) => {
                    const cat = CATEGORIES[e.category];
                    const prio = PRIORITIES[e.priority] || PRIORITIES.medium;
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 15, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 22,
                          delay: index * 0.05,
                        }}
                        whileHover={{
                          scale: 1.02,
                          x: 2,
                          boxShadow: isDark
                            ? '0 4px 12px rgba(0,0,0,0.3)'
                            : '0 4px 12px rgba(0,0,0,0.03)',
                        }}
                        onClick={() => setDetail(e.source)}
                        className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all duration-150 cursor-pointer"
                        style={{
                          borderColor: borderSubtle(isDark),
                          background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                        }}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-sm font-semibold" style={{ color: pri }}>
                            {e.title}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: prio.bg, color: prio.color }}
                          >
                            {prio.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs" style={{ color: sec }}>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: cat.color }}
                            />
                            {calendarCategoryLabel(t, e.category)}
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
                        {e.description && (
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: mut }}>
                            {e.description}
                          </p>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </CardWrapper>

          <CardWrapper isDark={isDark} delay={0.3}>
            <h3 className="text-base font-bold mb-4" style={{ color: pri }}>
              {t('calendarPage.upcomingEvents')}
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length === 0 && (
                <p className="text-xs" style={{ color: mut }}>
                  {t('calendarPage.noUpcoming')}
                </p>
              )}
              {upcomingEvents.map((e) => {
                const dateObj = parseLocalYmd(e.date) || new Date(e.date);
                const { month: mStr, day } = formatDayMonthBadge(e.date, {
                  calendar,
                  lang: lang === 'fa' ? 'fa' : 'en',
                });
                const cat = CATEGORIES[e.category];
                return (
                  <motion.div
                    key={e.id}
                    onClick={() => {
                      setSelectedDate(dateObj);
                      setCurrentMonth(dateObj.getMonth());
                      setCurrentYear(dateObj.getFullYear());
                      setDetail(e.source);
                    }}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex gap-4 items-center cursor-pointer group select-none"
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:border-[rgba(var(--primary-rgb),0.4)]"
                      style={{
                        borderColor: borderSubtle(isDark),
                        background: surfaceItem(isDark),
                      }}
                    >
                      <span
                        className={`text-[10px] font-bold leading-tight text-center px-0.5 truncate max-w-full transition-colors group-hover:text-[var(--primary)] ${
                          calendar === 'jalali' && lang === 'fa' ? '' : 'uppercase'
                        }`}
                        style={{ color: mut }}
                      >
                        {mStr}
                      </span>
                      <span
                        className="text-base font-black leading-none transition-colors group-hover:text-[var(--primary)]"
                        style={{ color: pri }}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors"
                        style={{ color: pri }}
                      >
                        {e.title}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-1 text-xs" style={{ color: sec }}>
                        <span className="flex items-center gap-0.5">
                          <IconClock /> {e.startTime}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500/30 shrink-0" />
                        <span style={{ color: cat.color }}>{calendarCategoryLabel(t, e.category)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardWrapper>
        </div>
      </div>

      {/* Create modal — SafeCalendar style */}
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
              className="relative w-full max-w-lg rounded-2xl p-6 overflow-hidden shadow-2xl border transition-colors max-h-[90vh] overflow-y-auto"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderSubtle(isDark),
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0,0,0,0.8)'
                  : '0 25px 50px -12px rgba(0,0,0,0.15)',
              }}
            >
              <div
                className="flex justify-between items-center mb-6 pb-2 border-b"
                style={{ borderColor: borderSubtle(isDark) }}
              >
                <h3 className="text-base font-bold" style={{ color: pri }}>
                  {t('calendarPage.scheduleEvent')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 transition-colors"
                  style={{ borderColor: borderSubtle(isDark), color: sec }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => void createEvent(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter event title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border"
                    style={getInputStyle('title')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                      Category
                    </label>
                    <CustomSelect
                      value={form.kind}
                      onChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          kind: val as typeof f.kind,
                          color: CATEGORIES[mapEventCategory(val)]?.color || f.color,
                        }))
                      }
                      options={kindFormOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      onFocus={() => setFocusedField('date')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('date')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      onFocus={() => setFocusedField('startTime')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('startTime')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      onFocus={() => setFocusedField('endTime')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border"
                      style={getInputStyle('endTime')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                    Meeting mode
                  </label>
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: surfaceItem(isDark) }}>
                    {(
                      [
                        { id: 'IN_APP' as const, label: 'In-app', icon: MdVideocam },
                        { id: 'IN_PERSON' as const, label: 'In person', icon: MdLocationOn },
                        { id: 'LINK' as const, label: 'Link', icon: MdLink },
                      ] as const
                    ).map((m) => {
                      const Icon = m.icon;
                      const on = form.meetingMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, meetingMode: m.id }))}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold"
                          style={{
                            background: on ? 'rgba(var(--primary-rgb),0.2)' : 'transparent',
                            color: on ? primaryColor : mut,
                          }}
                        >
                          <Icon size={14} /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.meetingMode === 'LINK' && (
                  <input
                    value={form.meetingUrl}
                    onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                    placeholder="https://meet.example.com/…"
                    onFocus={() => setFocusedField('url')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border"
                    style={getInputStyle('url')}
                  />
                )}
                {form.meetingMode === 'IN_PERSON' && (
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Location / address"
                    onFocus={() => setFocusedField('location')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border"
                    style={getInputStyle('location')}
                  />
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details, agenda, notes…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none"
                    style={getInputStyle('description')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
                    {t('calendarPage.invitePeople')}
                  </label>
                  <ul
                    className="max-h-32 overflow-auto space-y-1 rounded-xl p-2 border"
                    style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark) }}
                  >
                    {team.map((t) => {
                      const on = form.attendeeIds.includes(t.id);
                      return (
                        <li key={t.id}>
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  attendeeIds: on
                                    ? f.attendeeIds.filter((id) => id !== t.id)
                                    : [...f.attendeeIds, t.id],
                                }))
                              }
                            />
                            <span style={{ color: pri }}>{t.name}</span>
                            <span style={{ color: mut }}>{t.role}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-3.5 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                  <motion.button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-colors"
                    style={{
                      borderColor: borderSubtle(isDark),
                      background: 'transparent',
                      color: pri,
                    }}
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <GlassButton
                    type="submit"
                    disabled={busy || form.title.trim().length < 2}
                    style={{ padding: '8px 20px', borderRadius: '12px', opacity: busy ? 0.6 : 1 }}
                  >
                    {busy ? t('calendarPage.scheduling') : t('calendarPage.schedule')}
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl p-6 space-y-3 max-h-[85vh] overflow-auto border"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderSubtle(isDark),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase"
                    style={{
                      color:
                        detail.kind === 'task'
                          ? CATEGORIES.task.color
                          : CATEGORIES[mapEventCategory((detail as CalEvent).eventKind)].color,
                    }}
                  >
                    {detail.kind === 'task'
                      ? 'Task due'
                      : calendarCategoryLabel(t, mapEventCategory((detail as CalEvent).eventKind))}
                  </p>
                  <h3 className="text-lg font-bold" style={{ color: pri }}>
                    {detail.title}
                  </h3>
                </div>
                <button type="button" onClick={() => setDetail(null)} style={{ color: mut }}>
                  <MdClose size={20} />
                </button>
              </div>

              <p className="text-sm" style={{ color: sec }}>
                {new Date(detail.startsAt).toLocaleString()}
                {detail.kind === 'event' &&
                  ` – ${new Date(detail.endsAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
              </p>

              {detail.kind === 'task' ? (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: mut }}>
                    Project: {(detail as CalTask).boardName}
                  </p>
                  <Link
                    href={(detail as CalTask).href}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: primaryColor }}
                  >
                    <MdTaskAlt size={14} /> Open task
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {(detail as CalEvent).description && (
                    <p className="text-sm whitespace-pre-wrap" style={{ color: sec }}>
                      {(detail as CalEvent).description}
                    </p>
                  )}
                  <div className="rounded-xl px-3 py-2 text-xs space-y-1" style={{ background: surfaceItem(isDark) }}>
                    {(detail as CalEvent).meetingMode === 'IN_APP' && (
                      <p className="inline-flex items-center gap-1.5" style={{ color: pri }}>
                        <MdVideocam size={16} style={{ color: primaryColor }} /> In-app meeting
                      </p>
                    )}
                    {(detail as CalEvent).meetingMode === 'IN_PERSON' && (
                      <p className="inline-flex items-center gap-1.5" style={{ color: pri }}>
                        <MdLocationOn size={16} className="text-amber-500" />
                        {(detail as CalEvent).location || 'In person'}
                      </p>
                    )}
                    {(detail as CalEvent).meetingMode === 'LINK' && (
                      <a
                        href={(detail as CalEvent).meetingUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-cyan-500 underline"
                      >
                        <MdLink size={16} /> Join meeting link
                      </a>
                    )}
                  </div>

                  <div>
                    <p
                      className="text-[10px] font-bold uppercase mb-1.5 inline-flex items-center gap-1"
                      style={{ color: mut }}
                    >
                      <MdPeople size={12} /> Invitees
                    </p>
                    <ul className="space-y-1">
                      {(detail as CalEvent).attendees.map((a) => (
                        <li
                          key={a.userId}
                          className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg"
                          style={{ background: surfaceItem(isDark) }}
                        >
                          <span style={{ color: pri }}>{a.name}</span>
                          <span style={{ color: mut }}>{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GlassButton
                      onClick={() => void rsvp(detail.id, 'ACCEPTED')}
                      style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px' }}
                    >
                      {t('common.accept')}
                    </GlassButton>
                    <button
                      type="button"
                      onClick={() => void rsvp(detail.id, 'DECLINED')}
                      className="px-3 py-2 rounded-xl text-xs font-bold border"
                      style={{ borderColor: borderSubtle(isDark), color: sec }}
                    >
                      {t('calendarPage.decline')}
                    </button>
                    {(detail as CalEvent).canEdit && (
                      <button
                        type="button"
                        onClick={() => void removeEvent(detail.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
