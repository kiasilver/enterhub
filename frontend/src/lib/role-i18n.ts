import { planLabelEn, planLabelFa } from '@/lib/plans-catalog';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Localize workspace RBAC role display names without changing DB values. */
export function localizeRoleName(name: string, t: Translate): string {
  const key = `rolesPage.roleNames.${name}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return name;
}

export function planLabelForLocale(code: string, lang: string): string {
  return lang === 'fa' ? planLabelFa(code) : planLabelEn(code);
}
