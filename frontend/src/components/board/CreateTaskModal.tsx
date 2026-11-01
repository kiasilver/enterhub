'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import {
  MdAccessTime,
  MdAttachFile,
  MdClose,
  MdFolderOpen,
  MdFlag,
  MdLabel,
  MdPersonAdd,
  MdSupervisorAccount,
} from 'react-icons/md';
import { CARD_PRIORITIES, type CardPriorityValue } from '@/lib/workspace-labels';
import {
  defaultChecklistDrafts,
  isChecklistEnd,
  isChecklistStart,
  type ChecklistDraftItem,
} from '@/lib/checklist-defaults';
import { ChecklistEditor } from '@/components/board/ChecklistEditor';
import { AppDateRangePicker } from '@/components/ui/AppDateRangePicker';
import { AppDurationPicker } from '@/components/ui/AppDurationPicker';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
} from '@/components/SafeDashboard/theme';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  localizeListTitle,
  localizePrioritySelect,
  localizeProjectName,
  localizeWorkspaceLabel,
} from '@/lib/list-i18n';

type ChecklistDraftRow = ChecklistDraftItem & { id: string };

function seedChecklistDrafts(): ChecklistDraftRow[] {
  return defaultChecklistDrafts().map((item) => ({
    ...item,
    id: `draft-${crypto.randomUUID()}`,
  }));
}

type BoardOption = { id: string; name: string; isGeneral?: boolean };
type ListOption = { id: string; title: string };
type MemberOption = { userId: string; label: string };
type LabelOption = { id: string; name: string; color: string };
type PendingAttachment = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

function readFileAsDataUrl(file: File): Promise<PendingAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        fileUrl: String(reader.result || ''),
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export type CreateTaskModalProps = {
  workspaceId: string;
  isDark: boolean;
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
  /** Prefill / lock project when opening from a board column */
  initialBoardId?: string | null;
  /** Prefill list when opening from a board column */
  initialListId?: string | null;
  /** Limit project dropdown (e.g. department projects only) */
  boardOptions?: BoardOption[] | null;
  lockBoard?: boolean;
};

export function CreateTaskModal({
  workspaceId,
  isDark,
  open,
  onClose,
  onCreated,
  initialBoardId = null,
  initialListId = null,
  boardOptions = null,
  lockBoard = false,
}: CreateTaskModalProps) {
  const { t } = useLang();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? '';
  const boardOptionsKey = boardOptions?.map((b) => b.id).join(',') ?? '';

  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [boardId, setBoardId] = useState('');
  const [listId, setListId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [priority, setPriority] = useState<CardPriorityValue>('NONE');
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [labelOptions, setLabelOptions] = useState<LabelOption[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistDraftRow[]>([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setChecklistItems(seedChecklistDrafts());
    setChecklistDraft('');
    setSupervisorId('');
    setAttachments([]);
    setDescription('');
    setPriority('NONE');
    setLabelIds([]);
    setAssigneeIds(myUserId ? [myUserId] : []);
    setEstimatedHours('');
    setDueDate('');
    setStartDate('');
    setBoardId(initialBoardId || '');
    setListId('');
    void (async () => {
      setCreateError(null);
      try {
        const [boardsRes, membersRes, labelsRes] = await Promise.all([
          boardOptions
            ? Promise.resolve(null)
            : fetch(`/api/workspaces/${workspaceId}/boards`),
          fetch(`/api/workspaces/${workspaceId}/members`),
          fetch(`/api/workspaces/${workspaceId}/labels`),
        ]);

        let opts: BoardOption[] = boardOptions ? [...boardOptions] : [];
        if (boardsRes) {
          const boardsJson = await boardsRes.json();
          if (!boardsRes.ok) {
            setCreateError(boardsJson.error || t('common.loadFailed'));
            setBoards([]);
            return;
          }
          opts = (boardsJson.data || []).map(
            (b: { id: string; name: string; isGeneral?: boolean }) => ({
              id: b.id,
              name: b.name,
              isGeneral: b.isGeneral,
            }),
          );
        }
        setBoards(opts);
        setBoardId((prev) => {
          if (initialBoardId && opts.some((b) => b.id === initialBoardId)) {
            return initialBoardId;
          }
          return prev || opts[0]?.id || '';
        });

        if (membersRes.ok) {
          const membersJson = await membersRes.json();
          setMembers(
            (membersJson.data || [])
              .filter((m: { status?: string }) => !m.status || m.status === 'ACTIVE')
              .map(
                (m: {
                  userId?: string;
                  user: { id: string; name: string | null; email: string };
                }) => ({
                  userId: m.userId || m.user.id,
                  label: m.user.name || m.user.email,
                }),
              ),
          );
        } else {
          setMembers([]);
        }

        if (labelsRes.ok) {
          const labelsJson = await labelsRes.json();
          setLabelOptions(
            (labelsJson.data || []).map((l: { id: string; name: string; color: string }) => ({
              id: l.id,
              name: l.name,
              color: l.color,
            })),
          );
        } else {
          setLabelOptions([]);
        }
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : t('common.loadFailed'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspaceId, initialBoardId, boardOptionsKey]);

  useEffect(() => {
    if (!open || !myUserId) return;
    setAssigneeIds((prev) => (prev.length === 0 ? [myUserId] : prev));
  }, [open, myUserId]);

  useEffect(() => {
    if (!open || !boardId) {
      setLists([]);
      setListId('');
      setListsLoading(false);
      return;
    }
    // Drop previous board's listId immediately — stale ids cause 400 "List not on this board"
    setLists([]);
    setListId('');
    let cancelled = false;
    void (async () => {
      setListsLoading(true);
      setCreateError(null);
      try {
        const res = await fetch(`/api/boards/${boardId}/cards`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setCreateError(json.error || t('common.loadFailed'));
          setLists([]);
          setListId('');
          return;
        }
        const opts: ListOption[] = (json.data?.lists || []).map(
          (l: { id: string; title: string }) => ({ id: l.id, title: l.title }),
        );
        setLists(opts);
        setListId(
          initialListId && opts.some((o) => o.id === initialListId)
            ? initialListId
            : opts[0]?.id ?? '',
        );
      } catch (e) {
        if (cancelled) return;
        setCreateError(e instanceof Error ? e.message : t('common.loadFailed'));
        setLists([]);
        setListId('');
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, boardId, initialListId]);

  function toggleAssignee(userId: string) {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function addChecklistItem() {
    const text = checklistDraft.trim();
    if (!text) return;
    setChecklistItems((prev) => {
      const endIdx = prev.findIndex((x) => isChecklistEnd(x.title));
      const row: ChecklistDraftRow = {
        id: `draft-${crypto.randomUUID()}`,
        title: text,
        description: '',
        noteOpen: false,
      };
      if (endIdx >= 0) {
        const next = [...prev];
        next.splice(endIdx, 0, row);
        return next;
      }
      const startIdx = prev.findIndex((x) => isChecklistStart(x.title));
      if (startIdx >= 0) {
        const next = [...prev];
        next.splice(startIdx + 1, 0, row);
        return next;
      }
      return [...prev, row];
    });
    setChecklistDraft('');
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      const next: PendingAttachment[] = [];
      for (const file of Array.from(files).slice(0, 10 - attachments.length)) {
        if (file.size > 8 * 1024 * 1024) {
          setCreateError(`File too large: ${file.name} (max 8MB)`);
          continue;
        }
        next.push(await readFileAsDataUrl(file));
      }
      if (next.length) setAttachments((prev) => [...prev, ...next].slice(0, 10));
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : t('common.failed'));
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    if (createBusy || !boardId || !listId || listsLoading) return;
    if (!lists.some((l) => l.id === listId)) {
      setCreateError(t('boardTask.listNotReady'));
      return;
    }
    let trimmed = title.trim();
    if (!trimmed && description.trim()) {
      trimmed = description.trim().split('\n')[0].slice(0, 300);
      setTitle(trimmed);
    }
    if (!trimmed) {
      setCreateError(t('boardTask.titleRequired'));
      return;
    }
    setCreateBusy(true);
    setCreateError(null);
    try {
      const ids = assigneeIds.length > 0 ? assigneeIds : myUserId ? [myUserId] : [];
      const hours = Number(estimatedHours);
      if (ids.length > 0 && (!startDate || !dueDate)) {
        setCreateError(t('boardTask.dueRangeRequired'));
        setCreateBusy(false);
        return;
      }
      const checklist = checklistItems
        .filter((item) => item.title.trim())
        .map((item) => ({
          title: item.title.trim(),
          ...(item.noteOpen && item.description.trim()
            ? { description: item.description.trim() }
            : {}),
        }));
      const res = await fetch(`/api/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          listId,
          assigneeIds: ids,
          priority,
          ...(supervisorId ? { supervisorId } : {}),
          ...(labelIds.length ? { labelIds } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(startDate ? { startDate } : {}),
          ...(dueDate ? { dueDate } : {}),
          ...(estimatedHours && !Number.isNaN(hours) && hours > 0
            ? { estimatedHours: hours }
            : {}),
          ...(checklist.length ? { checklist } : {}),
          ...(attachments.length ? { attachments } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || t('projectsPage.createFailed'));
        return;
      }
      onClose();
      await onCreated?.();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('projectsPage.createFailed'));
    } finally {
      setCreateBusy(false);
    }
  }

  if (!open) return null;

  const fieldStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={() => !createBusy && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={glassStyle(isDark)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('boardTask.newTask')}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
        >
          <p className="text-sm truncate" style={{ color: textSecondary(isDark) }}>
            {t('boardTask.newTask')}
            {lists.find((l) => l.id === listId)?.title
              ? ` · ${localizeListTitle(lists.find((l) => l.id === listId)!.title, t)}`
              : ''}
          </p>
          <button
            type="button"
            onClick={() => !createBusy && onClose()}
            className="p-2 rounded-lg"
            style={{ color: textMuted(isDark) }}
            aria-label={t('common.close')}
          >
            <MdClose size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-5">
          {createError && (
            <p className="text-sm text-red-500 mb-3">{createError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
            <div className="space-y-5 min-w-0">
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  {t('boardTask.taskTitle')}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  placeholder={t('boardTask.taskTitle')}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={fieldStyle}
                  autoFocus
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  {t('boardTask.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder={t('boardTask.descriptionPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-transparent text-sm outline-none"
                  style={fieldStyle}
                />
              </div>

              <ChecklistEditor
                isDark={isDark}
                mode="create"
                canEdit
                draft={checklistDraft}
                onDraftChange={setChecklistDraft}
                onAdd={addChecklistItem}
                items={checklistItems.map((item) => ({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  isDone: false,
                }))}
                noteOpen={Object.fromEntries(
                  checklistItems.map((item) => [item.id, item.noteOpen]),
                )}
                onToggleNote={(id, open) => {
                  setChecklistItems((prev) =>
                    prev.map((row) =>
                      row.id === id
                        ? {
                            ...row,
                            noteOpen: open,
                            description: open ? row.description : '',
                          }
                        : row,
                    ),
                  );
                }}
                onTitleChange={(id, title) => {
                  setChecklistItems((prev) =>
                    prev.map((row) => (row.id === id ? { ...row, title } : row)),
                  );
                }}
                onNoteChange={(id, description) => {
                  setChecklistItems((prev) =>
                    prev.map((row) =>
                      row.id === id ? { ...row, description } : row,
                    ),
                  );
                }}
                onRemove={(id) => {
                  setChecklistItems((prev) => prev.filter((row) => row.id !== id));
                }}
                onReorder={(orderedMiddleIds) => {
                  setChecklistItems((prev) => {
                    const start = prev.filter((i) => isChecklistStart(i.title));
                    const end = prev.filter((i) => isChecklistEnd(i.title));
                    const byId = new Map(prev.map((i) => [i.id, i]));
                    const middle = orderedMiddleIds
                      .map((id) => byId.get(id))
                      .filter(Boolean) as ChecklistDraftRow[];
                    return [...start, ...middle, ...end];
                  });
                }}
                fieldStyle={fieldStyle}
              />

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdAttachFile size={14} />
                  {t('boardTask.attachments')}
                </p>
                <ul className="space-y-1.5 mb-2">
                  {attachments.map((a, i) => (
                    <li
                      key={`${a.fileName}-${i}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm"
                      style={{
                        background: surfaceItem(isDark),
                        color: textPrimary(isDark),
                      }}
                    >
                      <span className="flex-1 truncate">{a.fileName}</span>
                      <button
                        type="button"
                        aria-label={t('common.remove')}
                        onClick={() =>
                          setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="p-1 rounded"
                        style={{ color: textMuted(isDark) }}
                      >
                        <MdClose size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                <label
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textSecondary(isDark),
                  }}
                >
                  <MdAttachFile size={14} />
                  {t('boardTask.addFiles')}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void onPickFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            <aside className="space-y-4">
              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdFolderOpen size={14} />
                  {t('boardTask.project')}
                </p>
                <select
                  required
                  value={boardId}
                  onChange={(e) => {
                    setBoardId(e.target.value);
                    setListId('');
                    setLists([]);
                  }}
                  disabled={lockBoard}
                  className="w-full rounded-lg px-2.5 py-2 text-sm outline-none bg-transparent disabled:opacity-70"
                  style={fieldStyle}
                >
                  {boards.length === 0 && (
                    <option value="">{t('common.noResults')}</option>
                  )}
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {localizeProjectName(b.name, t, b.isGeneral)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium mb-2" style={{ color: textMuted(isDark) }}>
                  {t('boardTask.list')}
                </p>
                <select
                  required
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  disabled={!boardId || listsLoading || lists.length === 0}
                  className="w-full rounded-lg px-2.5 py-2 text-sm outline-none bg-transparent disabled:opacity-50"
                  style={fieldStyle}
                >
                  {listsLoading && (
                    <option value="">{t('common.loading')}</option>
                  )}
                  {!listsLoading && lists.length === 0 && (
                    <option value="">{t('common.noResults')}</option>
                  )}
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {localizeListTitle(l.title, t)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdPersonAdd size={14} />
                  {t('boardTask.assignees')}
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {members.length === 0 && (
                    <li className="text-xs" style={{ color: textMuted(isDark) }}>
                      {t('membersPage.noMembers')}
                    </li>
                  )}
                  {members.map((m) => {
                    const checked = assigneeIds.includes(m.userId);
                    return (
                      <li key={m.userId}>
                        <label
                          className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer"
                          style={{
                            background: checked ? surfaceItem(isDark) : 'transparent',
                            color: textSecondary(isDark),
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAssignee(m.userId)}
                          />
                          <span className="truncate">
                            {m.label}
                            {m.userId === myUserId ? ` ${t('boardTask.you')}` : ''}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdSupervisorAccount size={14} />
                  {t('boardTask.supervisorOptional')}
                </p>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-sm outline-none bg-transparent"
                  style={fieldStyle}
                >
                  <option value="">{t('boardTask.noSupervisor')}</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.label}
                      {m.userId === myUserId ? ` ${t('boardTask.you')}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] mt-1.5" style={{ color: textMuted(isDark) }}>
                  {t('boardTask.supervisorHint')}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdAccessTime size={14} />
                  {t('boardTask.dueDate')}
                </p>
                <AppDateRangePicker
                  value={{ start: startDate, end: dueDate }}
                  onChange={(r) => {
                    setStartDate(r.start);
                    setDueDate(r.end);
                  }}
                  isDark={isDark}
                  placeholder={t('boardTask.dueRangePlaceholder')}
                />
              </div>

              <div>
                <p className="text-xs font-medium mb-2" style={{ color: textMuted(isDark) }}>
                  {t('boardTask.estimatedTime')}{' '}
                  <span className="font-normal">({t('boardTask.estimatedOptional')})</span>
                </p>
                <AppDurationPicker
                  value={estimatedHours}
                  onChange={setEstimatedHours}
                  isDark={isDark}
                  placeholder={t('boardTask.estimatedPlaceholder')}
                />
              </div>

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdFlag size={14} />
                  {t('boardTask.priority')}
                </p>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CardPriorityValue)}
                  className="w-full rounded-lg px-2.5 py-2 text-sm outline-none bg-transparent"
                  style={fieldStyle}
                >
                  {CARD_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {localizePrioritySelect(p.value, t)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p
                  className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdLabel size={14} />
                  {t('boardTask.labels')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {labelOptions.map((l) => {
                    const on = labelIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() =>
                          setLabelIds((prev) =>
                            on ? prev.filter((id) => id !== l.id) : [...prev, l.id],
                          )
                        }
                        className="text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{
                          background: on ? l.color : surfaceItem(isDark),
                          color: on ? '#fff' : textSecondary(isDark),
                          border: `1px solid ${on ? l.color : borderSubtle(isDark)}`,
                        }}
                      >
                        {localizeWorkspaceLabel(l.name, t)}
                      </button>
                    );
                  })}
                  {labelOptions.length === 0 && (
                    <p className="text-xs" style={{ color: textMuted(isDark) }}>
                      {t('common.noResults')}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={
                    createBusy ||
                    listsLoading ||
                    !boardId ||
                    !listId ||
                    !lists.some((l) => l.id === listId)
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: isDark ? 'rgba(37,99,235,0.9)' : '#2563eb' }}
                >
                  {createBusy ? t('kanban.creating') : t('kanban.createTask')}
                </button>
                <button
                  type="button"
                  onClick={() => !createBusy && onClose()}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textSecondary(isDark),
                  }}
                >
                  {t('kanban.cancel')}
                </button>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
