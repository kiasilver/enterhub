import { toJalaali, toGregorian } from 'jalaali-js';

export type CalendarSystem = 'gregorian' | 'jalali';

export const CALENDAR_COOKIE = 'enterhub_calendar';
export const DEFAULT_CALENDAR: CalendarSystem = 'gregorian';

export function isCalendarSystem(v: unknown): v is CalendarSystem {
  return v === 'gregorian' || v === 'jalali';
}

const JALALI_MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

const JALALI_MONTHS_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
] as const;

const WEEKDAYS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toFaDigits(s: string): string {
  return s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);
}

/** Parse YYYY-MM-DD as local calendar date (avoids UTC shift). */
export function parseLocalYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) {
    const d = toDate(ymd);
    return d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Compact month + day for upcoming-event badges. */
export function formatDayMonthBadge(
  input: Date | string | number | null | undefined,
  opts: { calendar?: CalendarSystem; lang?: 'fa' | 'en' } = {},
): { month: string; day: string } {
  const d =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)
      ? parseLocalYmd(input)
      : toDate(input);
  if (!d) return { month: '—', day: '—' };
  const calendar = opts.calendar ?? DEFAULT_CALENDAR;
  const lang = opts.lang ?? 'en';

  if (calendar === 'jalali') {
    const { jm, jd } = getJalaliParts(d);
    const month = jalaliMonthName(jm, lang);
    const day = String(jd);
    return {
      month,
      day: lang === 'fa' ? toFaDigits(day) : day,
    };
  }

  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: lang === 'fa' ? toFaDigits(String(d.getDate())) : String(d.getDate()),
  };
}

export function getJalaliParts(date: Date) {
  return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function jalaliMonthName(jm: number, lang: 'fa' | 'en' = 'fa'): string {
  const idx = Math.min(11, Math.max(0, jm - 1));
  return lang === 'fa' ? JALALI_MONTHS_FA[idx]! : JALALI_MONTHS_EN[idx]!;
}

export function jalaliWeekdayLabels(lang: 'fa' | 'en' = 'fa') {
  if (lang === 'fa') return [...WEEKDAYS_FA];
  return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
}

export function formatAppDate(
  input: Date | string | number | null | undefined,
  opts: {
    calendar?: CalendarSystem;
    lang?: 'fa' | 'en';
    style?: 'short' | 'medium' | 'long' | 'monthYear';
  } = {},
): string {
  const d = toDate(input);
  if (!d) return '—';
  const calendar = opts.calendar ?? DEFAULT_CALENDAR;
  const lang = opts.lang ?? 'en';
  const style = opts.style ?? 'medium';

  if (calendar === 'jalali') {
    const { jy, jm, jd } = getJalaliParts(d);
    const month = jalaliMonthName(jm, lang);
    let out: string;
    if (style === 'short') out = `${jd}/${jm}/${jy}`;
    else if (style === 'monthYear') out = `${month} ${jy}`;
    else out = `${jd} ${month} ${jy}`;
    return lang === 'fa' ? toFaDigits(out) : out;
  }

  const locale = lang === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US';
  if (style === 'short') {
    const out = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return lang === 'fa' ? toFaDigits(out) : out;
  }
  if (style === 'monthYear') {
    const out = d.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
    return lang === 'fa' ? toFaDigits(out) : out;
  }
  if (style === 'long') {
    const out = d.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return lang === 'fa' ? toFaDigits(out) : out;
  }
  const out = d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return lang === 'fa' ? toFaDigits(out) : out;
}

export function formatDueLabel(
  input: Date | string | number | null | undefined,
  opts: {
    calendar?: CalendarSystem;
    lang?: 'fa' | 'en';
  } = {},
): string | null {
  const d = toDate(input);
  if (!d) return null;
  const date = formatAppDate(d, { ...opts, style: 'medium' });
  return opts.lang === 'fa' ? `مهلت ${date}` : `Due ${date}`;
}

export function gregorianYearToJalaliYear(gy: number): number {
  return toJalaali(gy, 6, 15).jy;
}

export function jalaliYearToGregorianYear(jy: number): number {
  return toGregorian(jy, 7, 1).gy;
}

export function listRecentYears(calendar: CalendarSystem, count = 6): number[] {
  const now = new Date();
  if (calendar === 'jalali') {
    const { jy } = getJalaliParts(now);
    return Array.from({ length: count }, (_, i) => jy - i);
  }
  const gy = now.getFullYear();
  return Array.from({ length: count }, (_, i) => gy - i);
}

export { JALALI_MONTHS_FA, JALALI_MONTHS_EN, toGregorian, toJalaali };
