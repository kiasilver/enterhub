import { planLabelEn, planLabelFa } from '@/lib/plans-catalog';

type Translate = (key: string, params?: Record<string, string | number>) => string;

function pick(t: Translate, key: string, fallback: string): string {
  const translated = t(key);
  return translated !== key ? translated : fallback;
}

/** Localize workspace RBAC role display names without changing DB values. */
export function localizeRoleName(name: string, t: Translate): string {
  return pick(t, `rolesPage.roleNames.${name}`, name);
}

export function localizeRoleDescription(
  name: string,
  fallback: string | null | undefined,
  t: Translate,
): string {
  return pick(t, `rolesPage.roleDescs.${name}`, fallback || '');
}

export function localizePermGroup(group: string, t: Translate): string {
  return pick(t, `rolesPage.groups.${group}`, group);
}

export function localizeDeptLabel(deptKey: string, t: Translate): string {
  return pick(t, `rolesPage.depts.${deptKey}`, deptKey);
}

export function localizePositionName(templateKey: string, fallback: string, t: Translate): string {
  return pick(t, `rolesPage.positions.${templateKey}.name`, fallback);
}

export function localizePositionDesc(templateKey: string, fallback: string, t: Translate): string {
  return pick(t, `rolesPage.positions.${templateKey}.desc`, fallback);
}

export function localizePermLabel(action: string, t: Translate): string {
  return pick(t, `rolesPage.permLabels.${action}`, action);
}

export function localizePermDesc(
  action: string,
  fallback: string | undefined,
  t: Translate,
): string {
  return pick(t, `rolesPage.permDescs.${action}`, fallback || t('rolesPage.noDescription'));
}

export function localizeAuditAction(action: string, t: Translate): string {
  const key = `auditActions.${action.replace(/[.:]/g, '_')}`;
  return pick(t, key, action.replace(/[._]/g, ' '));
}

export function localizeAuditSeverity(severity: string, t: Translate): string {
  return pick(t, `auditSeverity.${severity.toLowerCase()}`, severity);
}

export function planLabelForLocale(code: string, lang: string): string {
  return lang === 'fa' ? planLabelFa(code) : planLabelEn(code);
}
