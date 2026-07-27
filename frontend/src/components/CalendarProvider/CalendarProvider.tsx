'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CALENDAR_COOKIE,
  DEFAULT_CALENDAR,
  formatAppDate,
  formatDueLabel,
  isCalendarSystem,
  type CalendarSystem,
} from '@/lib/app-date';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type CalendarContextType = {
  calendar: CalendarSystem;
  setCalendar: (c: CalendarSystem) => void;
  formatDate: (
    input: Date | string | number | null | undefined,
    style?: 'short' | 'medium' | 'long' | 'monthYear',
  ) => string;
  formatDue: (input: Date | string | number | null | undefined) => string | null;
};

const CalendarContext = createContext<CalendarContextType>({
  calendar: DEFAULT_CALENDAR,
  setCalendar: () => {},
  formatDate: (input) => formatAppDate(input),
  formatDue: (input) => formatDueLabel(input),
});

function readStoredCalendar(): CalendarSystem {
  if (typeof window === 'undefined') return DEFAULT_CALENDAR;
  try {
    const fromLs = localStorage.getItem(CALENDAR_COOKIE);
    if (isCalendarSystem(fromLs)) return fromLs;
    const match = document.cookie.match(new RegExp(`(?:^|; )${CALENDAR_COOKIE}=([^;]*)`));
    const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (isCalendarSystem(fromCookie)) return fromCookie;
  } catch {
    /* ignore */
  }
  return DEFAULT_CALENDAR;
}

function persistCalendar(system: CalendarSystem) {
  try {
    localStorage.setItem(CALENDAR_COOKIE, system);
    document.cookie = `${CALENDAR_COOKIE}=${encodeURIComponent(system)};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.dataset.calendar = system;
  } catch {
    /* ignore */
  }
}

export function CalendarProvider({
  children,
  initialCalendar,
}: {
  children: ReactNode;
  initialCalendar?: CalendarSystem;
}) {
  const { lang } = useLang();
  const [calendar, setCalendarState] = useState<CalendarSystem>(
    initialCalendar ?? DEFAULT_CALENDAR,
  );

  useEffect(() => {
    const stored = readStoredCalendar();
    setCalendarState(stored);
    document.documentElement.dataset.calendar = stored;
  }, []);

  const setCalendar = useCallback((next: CalendarSystem) => {
    setCalendarState(next);
    persistCalendar(next);
  }, []);

  const formatDate = useCallback(
    (
      input: Date | string | number | null | undefined,
      style: 'short' | 'medium' | 'long' | 'monthYear' = 'medium',
    ) =>
      formatAppDate(input, {
        calendar,
        lang: lang === 'fa' ? 'fa' : 'en',
        style,
      }),
    [calendar, lang],
  );

  const formatDue = useCallback(
    (input: Date | string | number | null | undefined) =>
      formatDueLabel(input, {
        calendar,
        lang: lang === 'fa' ? 'fa' : 'en',
      }),
    [calendar, lang],
  );

  const value = useMemo(
    () => ({ calendar, setCalendar, formatDate, formatDue }),
    [calendar, setCalendar, formatDate, formatDue],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  return useContext(CalendarContext);
}
