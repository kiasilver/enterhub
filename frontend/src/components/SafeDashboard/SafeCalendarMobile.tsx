'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  type SafetyEvent,
  CATEGORIES,
  PRIORITIES,
  ZONES,
  MONTHS,
  WEEKDAYS,
  INITIAL_EVENTS,
  isSameDay,
  formatDateString,
} from './SafeCalendar';

interface Props {
  isDark: boolean;
}

// ─── Inline SVG Helpers ────────────────────────────────────────────────────
const IconChevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 shrink-0">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

// ─── Dedicated Mobile Calendar Screen ───────────────────────────────────────
export default function SafeCalendarMobile({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';
  const cardBg = panelFill(isDark);
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19));
  const [events, setEvents] = useState<SafetyEvent[]>(INITIAL_EVENTS);

  // Add-event modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-06-19');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<keyof typeof CATEGORIES>('inspection');
  const [formPriority, setFormPriority] = useState<keyof typeof PRIORITIES>('medium');
  const [formZone, setFormZone] = useState('Zone A - Manufacturing');
  const [formDescription, setFormDescription] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getInputStyle = (fieldName: string) => ({
    borderColor: focusedField === fieldName ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedField === fieldName
      ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.25)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15)')
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const categoryFormOptions = useMemo(() => Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })), []);
  const priorityFormOptions = useMemo(() => Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })), []);
  const zoneFormOptions = useMemo(() => ZONES.map(z => ({ value: z, label: z })), []);

  // Calendar grid (6 rows × 7)
  const gridCells = useMemo(() => {
    const list: { date: Date; isCurrentMonth: boolean; isToday: boolean; dayNumber: number }[] = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInCurrMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      list.push({ date, isCurrentMonth: false, isToday: isSameDay(date, new Date()), dayNumber: daysInPrevMonth - i });
    }
    for (let i = 1; i <= daysInCurrMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      list.push({ date, isCurrentMonth: true, isToday: isSameDay(date, new Date()), dayNumber: i });
    }
    const remaining = 42 - list.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      list.push({ date, isCurrentMonth: false, isToday: isSameDay(date, new Date()), dayNumber: i });
    }
    return list;
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(p => p - 1); }
    else setCurrentMonth(p => p - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(p => p + 1); }
    else setCurrentMonth(p => p + 1);
  };

  const selectedDayEvents = useMemo(() => {
    const formatted = formatDateString(selectedDate);
    return events.filter(e => e.date === formatted);
  }, [selectedDate, events]);

  const upcomingEvents = useMemo(() => {
    const ref = '2026-06-19';
    return events
      .filter(e => e.date >= ref)
      .sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)))
      .slice(0, 4);
  }, [events]);

  const openScheduleModal = () => {
    setFormDate(formatDateString(selectedDate));
    setIsModalOpen(true);
  };

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
    setFormTitle('');
    setFormDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium mb-0.5 text-[var(--muted)]">Workspaces / Calendar</p>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Safety Calendar</h1>
        </div>
        <GlassButton onClick={openScheduleModal} style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '13px' }}>
          <IconPlus /> Event
        </GlassButton>
      </div>

      {/* Calendar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-3.5"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: pri }}>{MONTHS[currentMonth]} {currentYear}</h2>
          <div className="flex items-center gap-1.5">
            <GlassButton onClick={handlePrevMonth} style={{ width: 34, height: 34, padding: 0, borderRadius: '10px' }}>
              <IconChevron dir="left" />
            </GlassButton>
            <GlassButton
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setSelectedDate(today);
              }}
              style={{ height: 34, padding: '0 12px', borderRadius: '10px', fontSize: '12px' }}
            >
              Today
            </GlassButton>
            <GlassButton onClick={handleNextMonth} style={{ width: 34, height: 34, padding: 0, borderRadius: '10px' }}>
              <IconChevron dir="right" />
            </GlassButton>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 mb-1.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-[10px] font-bold text-center py-1" style={{ color: mut }}>{d[0]}</div>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentMonth}-${currentYear}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-7 gap-1"
          >
            {gridCells.map((cell, idx) => {
              const cellEvents = events.filter(e => e.date === formatDateString(cell.date));
              const isSelected = isSameDay(cell.date, selectedDate);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 relative transition-colors"
                  style={{
                    background: isSelected ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                    border: (cell.isToday && !isSelected) ? `1px solid ${primaryColor}` : `1px solid ${isSelected ? 'transparent' : borderSubtle(isDark)}`,
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                  }}
                >
                  <span
                    className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      color: cell.isToday ? '#ffffff' : pri,
                      background: cell.isToday ? primaryColor : 'transparent',
                    }}
                  >
                    {cell.dayNumber}
                  </span>
                  <div className="flex gap-0.5 h-1.5 items-center">
                    {cellEvents.slice(0, 3).map(e => (
                      <span key={e.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: CATEGORIES[e.category]?.color || primaryColor }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Selected day events */}
      <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: borderSubtle(isDark) }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: pri }}>
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <p className="text-[11px]" style={{ color: sec }}>Selected day activities</p>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 rounded bg-[rgba(var(--primary-rgb),0.1)]" style={{ color: primaryColor }}>
            {selectedDayEvents.length} events
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {selectedDayEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-6"
              >
                <p className="text-sm font-semibold" style={{ color: sec }}>No events scheduled</p>
                <p className="text-xs mb-3" style={{ color: mut }}>Schedule training or safety drills</p>
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
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: index * 0.04 }}
                    className="p-3.5 rounded-xl border flex flex-col gap-2"
                    style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-semibold" style={{ color: pri }}>{e.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: prio.bg, color: prio.color }}>
                        {prio.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: sec }}>
                      <span className="flex items-center gap-1"><IconClock />{e.startTime} - {e.endTime}</span>
                      <span className="flex items-center gap-1"><IconMapPin />{e.zone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: mut }}>{e.description}</p>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: pri }}>Upcoming Safety Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map(e => {
            const dateObj = new Date(e.date);
            const day = dateObj.getDate();
            const mStr = dateObj.toLocaleDateString([], { month: 'short' });
            const cat = CATEGORIES[e.category] || CATEGORIES.inspection;
            return (
              <button
                key={e.id}
                onClick={() => {
                  setSelectedDate(dateObj);
                  setCurrentMonth(dateObj.getMonth());
                  setCurrentYear(dateObj.getFullYear());
                }}
                className="w-full flex gap-3 items-center text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0"
                  style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: mut }}>{mStr}</span>
                  <span className="text-sm font-black leading-none" style={{ color: pri }}>{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate" style={{ color: pri }}>{e.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: sec }}>
                    <span className="flex items-center gap-0.5"><IconClock /> {e.startTime}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-500/40 shrink-0" />
                    <span style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-lg rounded-2xl p-5 overflow-y-auto border max-h-[88dvh]"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderSubtle(isDark),
                scrollbarWidth: 'none',
              }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: borderSubtle(isDark) }}>
                <h3 className="text-base font-bold" style={{ color: pri }}>Schedule Activity</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border text-xs hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  style={{ borderColor: borderSubtle(isDark), color: sec }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Event Title</label>
                  <input
                    type="text" required placeholder="e.g. Zone B Drill"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border" style={getInputStyle('title')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Category</label>
                    <CustomSelect value={formCategory} onChange={(v) => setFormCategory(v as keyof typeof CATEGORIES)} options={categoryFormOptions} isDark={isDark} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Priority</label>
                    <CustomSelect value={formPriority} onChange={(v) => setFormPriority(v as keyof typeof PRIORITIES)} options={priorityFormOptions} isDark={isDark} className="w-full" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Date</label>
                  <input
                    type="date" required value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    onFocus={() => setFocusedField('date')} onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border" style={getInputStyle('date')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Zone</label>
                  <CustomSelect value={formZone} onChange={setFormZone} options={zoneFormOptions} isDark={isDark} className="w-full" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Start</label>
                    <input
                      type="time" required value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      onFocus={() => setFocusedField('start')} onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border" style={getInputStyle('start')}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>End</label>
                    <input
                      type="time" required value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      onFocus={() => setFocusedField('end')} onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-3 rounded-xl text-sm border" style={getInputStyle('end')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Description</label>
                  <textarea
                    rows={3} placeholder="Safety objective, compliance rules or instructions..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    onFocus={() => setFocusedField('desc')} onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none" style={getInputStyle('desc')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                  <button
                    type="button" onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: borderSubtle(isDark), background: 'transparent', color: pri }}
                  >
                    Cancel
                  </button>
                  <GlassButton type="submit" style={{ padding: '8px 20px', borderRadius: '12px' }}>Schedule</GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
