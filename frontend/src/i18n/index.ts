import { en, type Messages } from './messages/en';
import { fa } from './messages/fa';
import { getMessage } from './get-message';
import type { Locale } from './types';

export const dictionaries: Record<Locale, Messages> = { en, fa };

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const primary = getMessage(dictionaries[locale] as unknown as Record<string, unknown>, key, params);
  if (primary !== key) return primary;
  if (locale !== 'en') {
    return getMessage(dictionaries.en as unknown as Record<string, unknown>, key, params);
  }
  return key;
}

export type { Messages, Locale };
export { en, fa, getMessage };
export * from './types';
