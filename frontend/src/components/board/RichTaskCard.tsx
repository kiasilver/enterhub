'use client';

import {
  MdAttachFile,
  MdChatBubbleOutline,
  MdCheckCircle,
  MdEdit,
  MdFlag,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  PersonAvatar,
  PersonQuickActions,
} from '@/components/departments/PersonQuickActions';
import type { DeptPerson } from '@/components/departments/department-types';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import { isChecklistBookend, isChecklistEnd } from '@/lib/checklist-defaults';
import {
  localizeChecklistTitle,
  localizeListTitle,
  localizePriorityShort,
  localizeWorkspaceLabel,
} from '@/lib/list-i18n';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba,
} from '@/components/SafeDashboard/theme';

export type RichTaskCardData = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  priority?: string | null;
  workflowStatus?: string | null;
  startedAt?: string | Date | null;
  listTitle?: string | null;
  labels?: { id: string; name: string; color: string }[];
  assignees?: DeptPerson[];
  supervisor?: DeptPerson | null;
  createdBy?: DeptPerson | null;
  checklistItems?: {
    id: string;
    title: string;
    isDone: boolean;
    description?: string | null;
  }[];
  commentCount?: number;
  attachmentCount?: number;
};

function cardLooksFinished(card: RichTaskCardData) {
  const wf = (card.workflowStatus || '').toUpperCase();
  // On Review (pending approval) must not look like Completed
  if (wf === 'PENDING_APPROVAL') return false;
  if (wf === 'APPROVED') return true;
  if (/done|complete|closed|انجام|تمام|تکمیل/i.test(card.listTitle || '')) {
    return true;
  }
  const items = card.checklistItems || [];
  const end = items.find((i) => isChecklistEnd(i.title));
  if (end?.isDone && wf !== 'IN_PROGRESS' && wf !== 'ASSIGNED') return true;
  return false;
}

function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asPerson(p: DeptPerson): DeptPerson {
  return {
    id: p.id,
    name: p.name,
    email: p.email || '',
    avatarUrl: p.avatarUrl ?? null,
  };
}

export function RichTaskCard({
  card,
  cardBg,
  isDark,
  workspaceId,
  departmentId,
  onOpen,
  onToggleChecklist,
  checklistBusyId,
}: {
  card: RichTaskCardData;
  cardBg: string;
  isDark: boolean;
  workspaceId: string;
  departmentId?: string;
  onOpen: () => void;
  /** When set, checklist dots become clickable toggles on the card */
  onToggleChecklist?: (itemId: string, nextDone: boolean) => void | Promise<void>;
  checklistBusyId?: string | null;
}) {
  const { t } = useLang();
  const checklistItems = (card.checklistItems || []).filter(
    (i) => !isChecklistBookend(i.title),
  );
  const checklistDone = checklistItems.filter((i) => i.isDone).length;
  const description = stripHtml(card.description);
  const doers = card.assignees || [];
  const supervisor = card.supervisor;
  const priority = (card.priority || 'NONE').toUpperCase();
  const canToggle = typeof onToggleChecklist === 'function';
  const finished = cardLooksFinished(card);

  return (
    <div
      className="group/task relative w-full text-start rounded-xl p-3.5 space-y-3 transition-colors duration-200"
      style={{
        background: finished
          ? hexToRgba('#22C55E', isDark ? 0.14 : 0.08)
          : cardBg,
        border: `1px solid ${
          finished ? hexToRgba('#22C55E', isDark ? 0.45 : 0.35) : borderSubtle(isDark)
        }`,
        opacity: finished ? 0.92 : 1,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        className="absolute top-2.5 end-2.5 z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        style={{
          background: isDark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.95)',
          color: textSecondary(isDark),
          border: `1px solid ${borderSubtle(isDark)}`,
          boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 12px rgba(15,23,42,0.08)',
        }}
        title={t('board.editTask')}
        aria-label={t('board.editTask')}
      >
        <MdEdit size={15} />
      </button>

      <div className="min-w-0 pe-9">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-semibold leading-snug pe-1"
            style={{
              color: finished ? textMuted(isDark) : textPrimary(isDark),
              textDecoration: finished ? 'line-through' : undefined,
            }}
          >
            {card.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {finished && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: hexToRgba('#22C55E', isDark ? 0.28 : 0.16),
                  color: '#16A34A',
                }}
              >
                <MdCheckCircle size={12} />
                {t('myTasksPage.taskCompleted')}
              </span>
            )}
            {priority !== 'NONE' && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md"
                style={{
                  color: textMuted(isDark),
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}
              >
                <MdFlag size={11} />
                {localizePriorityShort(priority, t)}
              </span>
            )}
          </div>
        </div>
        {(card.labels || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(card.labels || []).slice(0, 4).map((l) => (
              <span
                key={l.id}
                className="text-[10px] font-bold px-2 py-1 rounded-md text-white whitespace-nowrap"
                style={{ background: l.color }}
              >
                {localizeWorkspaceLabel(l.name, t)}
              </span>
            ))}
          </div>
        )}
      </div>

      {description && (
        <p
          className="text-[11px] leading-relaxed line-clamp-2"
          style={{ color: textSecondary(isDark) }}
        >
          {description}
        </p>
      )}

      {checklistItems.length > 0 && (
        <ul className="space-y-1.5">
          {checklistItems.slice(0, 5).map((item) => (
            <li key={item.id} className="space-y-0.5">
              <div
                className="flex items-start gap-2 text-[11px] leading-snug"
                style={{
                  color: item.isDone ? textMuted(isDark) : textSecondary(isDark),
                  textDecoration: item.isDone ? 'line-through' : 'none',
                  opacity: item.isDone ? 0.75 : 1,
                }}
              >
                {canToggle ? (
                  <button
                    type="button"
                    disabled={checklistBusyId === item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void onToggleChecklist?.(item.id, !item.isDone);
                    }}
                    className="mt-0.5 h-3.5 w-3.5 rounded-full border flex-shrink-0 inline-flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{
                      borderColor: item.isDone ? '#22c55e' : borderSubtle(isDark),
                      background: item.isDone ? '#22c55e' : 'transparent',
                      color: '#fff',
                    }}
                    aria-label={
                      item.isDone ? t('boardTask.uncheckItem') : t('boardTask.checkItem')
                    }
                  >
                    {item.isDone ? (
                      <span className="text-[8px] font-bold leading-none">✓</span>
                    ) : null}
                  </button>
                ) : (
                  <span
                    className="mt-0.5 h-3 w-3 rounded-full border flex-shrink-0"
                    style={{
                      borderColor: item.isDone ? '#22c55e' : borderSubtle(isDark),
                      background: item.isDone ? '#22c55e' : 'transparent',
                    }}
                  />
                )}
                <span className="line-clamp-2">{localizeChecklistTitle(item.title, t)}</span>
              </div>
              {item.description && (
                <p
                  className="ps-4.5 text-[10px] line-clamp-2"
                  style={{ color: textMuted(isDark) }}
                >
                  {item.description}
                </p>
              )}
            </li>
          ))}
          {checklistItems.length > 5 && (
            <li className="text-[10px] ps-4" style={{ color: textMuted(isDark) }}>
              +{checklistItems.length - 5} · {checklistDone}/{checklistItems.length}
            </li>
          )}
        </ul>
      )}

      <div
        className="space-y-1.5 pt-1 border-t"
        style={{ borderColor: borderSubtle(isDark) }}
      >
        {supervisor && (
          <PersonQuickActions
            person={asPerson(supervisor)}
            workspaceId={workspaceId}
            departmentId={departmentId}
            isDark={isDark}
            className="w-full"
          >
            <span
              className="flex items-center gap-2 text-[10px] min-w-0"
              style={{ color: textMuted(isDark) }}
            >
              <PersonAvatar person={asPerson(supervisor)} size={20} isDark={isDark} />
              <span className="opacity-70 shrink-0">{t('boardTask.supervisor')}</span>
              <span className="font-medium truncate" style={{ color: textSecondary(isDark) }}>
                {supervisor.name || supervisor.email}
              </span>
            </span>
          </PersonQuickActions>
        )}
        <div className="flex items-center gap-2 text-[10px] min-w-0 flex-wrap">
          <span className="opacity-70 shrink-0" style={{ color: textMuted(isDark) }}>
            {t('boardTask.assignees')}
          </span>
          {doers.length > 0 ? (
            doers.map((a) => (
              <PersonQuickActions
                key={a.id}
                person={asPerson(a)}
                workspaceId={workspaceId}
                departmentId={departmentId}
                isDark={isDark}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full pl-1.5 pr-2.5 py-1"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: textSecondary(isDark),
                  }}
                >
                  <PersonAvatar person={asPerson(a)} size={20} isDark={isDark} />
                  <span className="font-medium max-w-[8rem] truncate">
                    {a.name || a.email}
                  </span>
                </span>
              </PersonQuickActions>
            ))
          ) : (
            <span className="font-medium" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.unassigned')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px]" style={{ color: textMuted(isDark) }}>
          {card.listTitle && (
            <span
              className="px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              {localizeListTitle(card.listTitle, t)}
            </span>
          )}
          {(card.commentCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MdChatBubbleOutline size={11} />
              {card.commentCount}
            </span>
          )}
          {(card.attachmentCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MdAttachFile size={11} />
              {card.attachmentCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <WorkTimerBadge
            startedAt={card.startedAt ? String(card.startedAt) : null}
            workflowStatus={card.workflowStatus || undefined}
            size="sm"
          />
          {card.dueDate && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                background: isDark ? 'rgba(180,83,9,0.35)' : 'rgba(180,83,9,0.15)',
                color: '#f59e0b',
              }}
            >
              {new Date(card.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
