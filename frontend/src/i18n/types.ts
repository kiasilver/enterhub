export type Locale = 'en' | 'fa';

export const LOCALES: Locale[] = ['en', 'fa'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'enterhub_locale';

export function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'fa';
}
