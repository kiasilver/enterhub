'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import {
  MdAccessTime,
  MdAttachFile,
  MdClose,
  MdChatBubbleOutline,
  MdDelete,
  MdEdit,
  MdFlag,
  MdLabel,
  MdPersonAdd,
  MdPlayArrow,
  MdSupervisorAccount,
  MdVisibility,
} from 'react-icons/md';
import { CARD_PRIORITIES, type CardPriorityValue } from '@/lib/workspace-labels';
import { isWorkTimerActive } from '@/lib/elapsed';
import { useLiveElapsed } from '@/hooks/useLiveElapsed';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import { AppDateRangePicker } from '@/components/ui/AppDateRangePicker';
import { AppDurationPicker, formatDurationLabel } from '@/components/ui/AppDurationPicker';
import { EditableTextField } from '@/components/ui/EditableTextField';
import { AutosaveToast } from '@/components/ui/AutosaveToast';
import { ChecklistEditor } from '@/components/board/ChecklistEditor';
import { isChecklistBookend, isChecklistEnd, isChecklistStart } from '@/lib/checklist-defaults';
import {
  CardSchedulePanel,
  type DelayIncidentRow,
  type ExtensionRequestRow,
  type ScheduleChangeRow,
} from '@/components/board/CardSchedulePanel';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  glassStyle,
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  localizeListTitle,
  localizePrioritySelect,
  localizeWorkspaceLabel,
} from '@/lib/list-i18n';

type ChecklistItem = {
  id: string;
  title: string;
  description?: string | null;
  isDone: boolean;
  linkedCardId?: string | null;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
};

type MemberOption = { userId: string; label: string };

type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
  workflowStatus?: 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  startedAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionNote?: string | null;
  priority?: CardPriorityValue;
  createdById?: string | null;
  supervisorId?: string | null;
  supervisor?: { id: string; name: string | null; email: string } | null;
  workspaceId?: string | null;
  list: { id: string; title: string };
  assignees?: { userId: string; user: { id: string; name: string | null; email: string } }[];
  checklistItems: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  labels?: { label: { id: string; name: string; color: string } }[];
  evaluation?: {
    quality: number;
    timeliness: number;
    communication: number;
    initiative: number;
    collaboration: number;
    overall: number;
    strengths?: string | null;
    improvements?: string | null;
    notes?: string | null;
    evaluator?: { id: string; name: string | null; email: string };
  } | null;
  extensionRequests?: ExtensionRequestRow[];
  scheduleChanges?: ScheduleChangeRow[];
  delayIncident?: DelayIncidentRow | null;
  isAssignee?: boolean;
  permissions?: {
    canEdit: boolean;
    canEditTitle?: boolean;
    canEditDescription?: boolean;
    canEditDueDate?: boolean;
    canEditPriority?: boolean;
    canEditLabels?: boolean;
    canDelete: boolean;
    canAssign: boolean;
    canMove?: boolean;
    canMoveToDone?: boolean;
    canChecklist?: boolean;
    canAttach?: boolean;
    canComment?: boolean;
    canSeeViews?: boolean;
    canSeeFinancialFields?: boolean;
  };
  role?: string;
  views?: {
    userId: string;
    user: { id: string; name: string | null; email: string };
    firstSeenAt: string;
    lastSeenAt: string;
    seeCount: number;
  }[];
};

type Props = {
  boardId: string;
  cardId: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  /** Fired after workflow/list-changing updates so boards can refresh live. */
  onChanged?: () => void;
  readOnly?: boolean;
  isGuest?: boolean;
};

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function readFileAsDataUrl(file: File) {
  return new Promise<{ fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }>(
    (resolve, reject) => {
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
    },
  );
}

function renderCommentBody(body: string) {
  const parts = body.split(/(@[^\s@]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="font-semibold text-blue-500">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function CardDetailsModal({
  boardId,
  cardId,
  open,
  onClose,
  onDeleted,
  onChanged,
  readOnly,
  isGuest,
}: Props) {
  const { theme } = useTheme();
  const { t } = useLang();
  const { data: session } = useSession();
  const myUserId = session?.user?.id || '';
  const isDark = theme === 'dark';
  const [card, setCard] = useState<CardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const saveHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveShownAt = useRef(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [priority, setPriority] = useState<CardPriorityValue>('NONE');
  const [dueDirty, setDueDirty] = useState(false);
  const [dueSaveReason, setDueSaveReason] = useState('');
  const [dueSaving, setDueSaving] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [evalForm, setEvalForm] = useState({
    quality: 4,
    timeliness: 4,
    communication: 4,
    initiative: 4,
    collaboration: 4,
    overall: 4,
    strengths: '',
    improvements: '',
    notes: '',
  });
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [workspaceLabels, setWorkspaceLabels] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [checklistTitle, setChecklistTitle] = useState('');
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});
  const [supervisorId, setSupervisorId] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [deleting, setDeleting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  /** Last persisted checklist titles — needed because local edits update state before blur-save */
  const checklistTitleBaseline = useRef<Record<string, string>>({});

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const p = card?.permissions;
  const canEditTitle =
    !readOnly && !isGuest && (p?.canEditTitle ?? p?.canEdit ?? false);
  const canEditDescription =
    !readOnly && !isGuest && (p?.canEditDescription ?? p?.canEdit ?? false);
  const canEditDueDate =
    !readOnly && !isGuest && (p?.canEditDueDate ?? p?.canEdit ?? false);
  const canEditPriority =
    !readOnly && !isGuest && (p?.canEditPriority ?? p?.canEdit ?? false);
  const canEditLabels =
    !readOnly && !isGuest && (p?.canEditLabels ?? p?.canEdit ?? false);
  /** Broad edit (legacy) — title/meta fields */
  const canEdit = canEditTitle || canEditDescription;
  const canDelete = !readOnly && !isGuest && (p?.canDelete ?? false);
  const canAssign = !readOnly && !isGuest && (p?.canAssign ?? false);
  const canChecklist =
    !readOnly && (p?.canChecklist ?? (!isGuest && (p?.canEdit ?? false)));
  const canAttach = !readOnly && (p?.canAttach ?? (!isGuest && (p?.canEdit ?? false)));
  const canComment = !readOnly && (p?.canComment ?? true);
  const canSeeViews = !isGuest && (p?.canSeeViews ?? false);
  const role = card?.role;
  const isAssignee = role === 'assignee' || !!card?.isAssignee;
  const isManager =
    role === 'board_admin' ||
    role === 'creator' ||
    role === 'supervisor' ||
    !!p?.canMoveToDone;
  const workflow = card?.workflowStatus || 'ASSIGNED';
  const workTimerActive = isWorkTimerActive(workflow, card?.startedAt);
  const workTimerLabel = useLiveElapsed(card?.startedAt, workTimerActive);
  const checklistDone =
    !card?.checklistItems?.length ||
    card.checklistItems.every((i) => i.isDone);
  const assignmentReady = !!startDate && !!dueDate;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load card');
      const data = json.data as CardDetail;
      setCard(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setDueDate(toDateInputValue(data.dueDate));
      setStartDate(toDateInputValue(data.startDate ?? null));
      setEstimatedHours(
        data.estimatedHours != null ? String(data.estimatedHours) : '',
      );
      setPriority((data.priority as CardPriorityValue) || 'NONE');
      setDueDirty(false);
      setDueSaveReason('');
      setSelectedLabelIds((data.labels || []).map((l) => l.label.id));
      setSupervisorId(data.supervisor?.id || data.supervisorId || '');
      setNoteOpen(
        Object.fromEntries(
          (data.checklistItems || [])
            .filter((i) => !!i.description)
            .map((i) => [i.id, true]),
        ),
      );
      checklistTitleBaseline.current = Object.fromEntries(
        (data.checklistItems || []).map((i) => [i.id, i.title]),
      );

      if (data.workspaceId) {
        const [mRes, lRes] = await Promise.all([
          fetch(`/api/workspaces/${data.workspaceId}/members`),
          fetch(`/api/workspaces/${data.workspaceId}/labels`),
        ]);
        const mJson = await mRes.json();
        const lJson = await lRes.json();
        if (mRes.ok) {
          setMembers(
            (mJson.data || [])
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
        }
        if (lRes.ok) {
          setWorkspaceLabels(
            (lJson.data || []).map((l: { id: string; name: string; color: string }) => ({
              id: l.id,
              name: l.name,
              color: l.color,
            })),
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [boardId, cardId]);

  useEffect(() => {
    if (open) void load();
    else {
      setCard(null);
      setError(null);
      setMentionIds([]);
      setCommentBody('');
    }
  }, [open, load]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionOpen) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => !q || m.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionOpen, mentionQuery, members]);

  function pulseSaved() {
    // Coalesce rapid saves: keep chip visible and only reset dismiss timer
    const HIDE_MS = 2200;
    const now = Date.now();
    if (saveHideTimer.current) clearTimeout(saveHideTimer.current);
    if (!saveToastOpen || now - saveShownAt.current > HIDE_MS) {
      saveShownAt.current = now;
      setSaveToastOpen(true);
    }
    saveHideTimer.current = setTimeout(() => {
      setSaveToastOpen(false);
    }, HIDE_MS);
  }

  async function patchCard(body: Record<string, unknown>) {
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Update failed');
      return false;
    }
    pulseSaved();
    onChanged?.();
    return true;
  }

  async function saveTitle(nextValue?: string) {
    if (!canEditTitle || !card) return;
    const trimmed = (nextValue ?? title).trim();
    if (!trimmed || trimmed === card.title) return;
    if (nextValue !== undefined) setTitle(trimmed);
    const ok = await patchCard({ title: trimmed });
    if (ok) setCard((c) => (c ? { ...c, title: trimmed } : c));
  }

  async function saveDescription() {
    if (!canEditDescription || !card) return;
    if ((card.description || '') === description) return;
    const ok = await patchCard({ description });
    if (ok) setCard((c) => (c ? { ...c, description } : c));
  }

  async function saveDueRange(next: { start: string; end: string }) {
    if (!canEditDueDate) return;
    setStartDate(next.start);
    setDueDate(next.end);
    setDueDirty(true);
  }

  async function commitDueRange() {
    if (!canEditDueDate || !card) return;
    const next = { start: startDate, end: dueDate };
    const isOverdue =
      card.dueDate &&
      new Date(card.dueDate).getTime() < Date.now() &&
      workflow !== 'APPROVED' &&
      (card.delayIncident?.status === 'OPEN' || !card.delayIncident);

    if (isOverdue) {
      if (dueSaveReason.trim().length < 3) {
        setError('When the task is delayed, a reason is required to change dates');
        return;
      }
      setDueSaving(true);
      try {
        const res = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/schedule-adjust`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: dueSaveReason.trim(),
              startDate: next.start || null,
              dueDate: next.end || null,
            }),
          },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to save dates');
        setDueDirty(false);
        setDueSaveReason('');
        await load();
        onChanged?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        setDueSaving(false);
      }
      return;
    }

    setDueSaving(true);
    try {
      if (!next.start || !next.end) {
        if (!next.start && !next.end) {
          const ok = await patchCard({ startDate: null, dueDate: null });
          if (ok) {
            setCard((c) => (c ? { ...c, startDate: null, dueDate: null } : c));
            setDueDirty(false);
          }
        }
        return;
      }
      const ok = await patchCard({
        startDate: next.start,
        dueDate: next.end,
      });
      if (ok) {
        setCard((c) =>
          c
            ? {
                ...c,
                startDate: new Date(`${next.start}T12:00:00.000Z`).toISOString(),
                dueDate: new Date(`${next.end}T12:00:00.000Z`).toISOString(),
              }
            : c,
        );
        setDueDirty(false);
      }
    } finally {
      setDueSaving(false);
    }
  }

  async function saveEstimatedHours(value: string) {
    if (!canEditDueDate) return;
    setEstimatedHours(value);
    const n = value === '' ? null : Number(value);
    if (n != null && (Number.isNaN(n) || n <= 0)) return;
    const ok = await patchCard({ estimatedHours: n });
    if (ok) setCard((c) => (c ? { ...c, estimatedHours: n } : c));
  }

  async function runWorkflow(
    action: 'start' | 'submit' | 'approve' | 'reject',
    body?: Record<string, unknown>,
  ) {
    setWorkflowBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/workflow/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `${action} failed`);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Workflow failed');
    } finally {
      setWorkflowBusy(false);
    }
  }

  async function savePriority(value: CardPriorityValue) {
    if (!canEditPriority) return;
    setPriority(value);
    const ok = await patchCard({ priority: value });
    if (ok) setCard((c) => (c ? { ...c, priority: value } : c));
  }

  async function toggleLabel(labelId: string) {
    if (!canEditLabels) return;
    const next = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter((id) => id !== labelId)
      : [...selectedLabelIds, labelId];
    setSelectedLabelIds(next);
    const ok = await patchCard({ labelIds: next });
    if (ok) await load();
    else setSelectedLabelIds(selectedLabelIds);
  }

  async function deleteCard() {
    if (!canDelete || deleting) return;
    if (!window.confirm(t('boardTask.deleteTask'))) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Delete failed');
        return;
      }
      onDeleted?.();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  async function saveSupervisor(nextId: string) {
    if (!canAssign || !card) return;
    const prev = supervisorId;
    setSupervisorId(nextId);
    const ok = await patchCard({ supervisorId: nextId || null });
    if (!ok) {
      setSupervisorId(prev);
      return;
    }
    const member = members.find((m) => m.userId === nextId);
    setCard((c) =>
      c
        ? {
            ...c,
            supervisorId: nextId || null,
            supervisor: nextId
              ? {
                  id: nextId,
                  name: member?.label || null,
                  email: member?.label || '',
                }
              : null,
          }
        : c,
    );
  }

  async function saveChecklistNote(item: ChecklistItem, description: string) {
    if (!canChecklist) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, description }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || 'Failed');
      return;
    }
    setCard((c) =>
      c
        ? {
            ...c,
            checklistItems: c.checklistItems.map((i) =>
              i.id === item.id ? { ...i, description } : i,
            ),
          }
        : c,
    );
    pulseSaved();
  }

  async function saveChecklistTitle(item: ChecklistItem, title: string) {
    if (!canChecklist) return;
    const next = title.trim();
    const baseline = checklistTitleBaseline.current[item.id] ?? item.title;
    if (!next || next === baseline) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, title: next }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || 'Failed');
      // Revert local title to baseline
      setCard((c) =>
        c
          ? {
              ...c,
              checklistItems: c.checklistItems.map((i) =>
                i.id === item.id ? { ...i, title: baseline } : i,
              ),
            }
          : c,
      );
      return;
    }
    checklistTitleBaseline.current[item.id] = next;
    setCard((c) =>
      c
        ? {
            ...c,
            checklistItems: c.checklistItems.map((i) =>
              i.id === item.id ? { ...i, title: next } : i,
            ),
          }
        : c,
    );
    pulseSaved();
    onChanged?.();
  }

  async function deleteChecklistItem(item: ChecklistItem) {
    if (!canChecklist || isChecklistBookend(item.title)) return;
    const res = await fetch(
      `/api/boards/${boardId}/cards/${cardId}/checklist?itemId=${encodeURIComponent(item.id)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Failed');
      return;
    }
    setCard((c) =>
      c
        ? {
            ...c,
            checklistItems: c.checklistItems.filter((i) => i.id !== item.id),
          }
        : c,
    );
  }

  async function toggleAssignee(userId: string) {
    if (!canAssign || !card) return;
    const assigned = card.assignees?.some((a) => a.userId === userId);
    const res = assigned
      ? await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees?userId=${userId}`, {
          method: 'DELETE',
        })
      : await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Assign failed');
      return;
    }
    await load();
  }

  async function addChecklist(e?: FormEvent) {
    e?.preventDefault();
    if (!canChecklist || !checklistTitle.trim()) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: checklistTitle.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    setChecklistTitle('');
    await load();
  }

  async function reorderChecklist(orderedMiddleIds: string[]) {
    if (!canChecklist || !card) return;
    const start = card.checklistItems.filter((i) => isChecklistStart(i.title));
    const end = card.checklistItems.filter((i) => isChecklistEnd(i.title));
    const byId = new Map(card.checklistItems.map((i) => [i.id, i]));
    const middle = orderedMiddleIds
      .map((id) => byId.get(id))
      .filter(Boolean) as ChecklistItem[];
    const nextItems = [...start, ...middle, ...end];
    setCard((c) => (c ? { ...c, checklistItems: nextItems } : c));
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: orderedMiddleIds }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Failed');
      await load();
      return;
    }
    pulseSaved();
    onChanged?.();
  }

  async function toggleChecklist(item: ChecklistItem) {
    if (!canChecklist) return;
    const markingEnd = isChecklistEnd(item.title) && !item.isDone;
    if (markingEnd) {
      const items = card?.checklistItems || [];
      const middle = items.filter((i) => !isChecklistBookend(i.title));
      if (middle.some((i) => !i.isDone)) {
        setError(t('myTasksPage.finishNeedMilestones'));
        return;
      }
    }
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, isDone: !item.isDone }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || 'Failed');
      return;
    }
    const nextItems = (card?.checklistItems || []).map((i) => {
      if (i.id === item.id) return { ...i, isDone: !i.isDone };
      // Server auto-marks Start when End is checked
      if (markingEnd && isChecklistStart(i.title)) return { ...i, isDone: true };
      return i;
    });
    setCard((c) =>
      c
        ? {
            ...c,
            checklistItems: nextItems,
          }
        : c,
    );
    pulseSaved();
    onChanged?.();
    const allDone = nextItems.every((i) => i.isDone);
    if (markingEnd && allDone && isAssignee) {
      const hasSupervisor = !!(card?.supervisorId || card?.supervisor?.id);
      const finishTo = hasSupervisor ? 'review' : 'done';
      const moved = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/workflow/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: finishTo }),
        },
      );
      if (!moved.ok) {
        const json = await moved.json().catch(() => ({}));
        setError(json.error || 'Failed');
        return;
      }
      onChanged?.();
      onClose();
    }
  }

  async function promoteChecklist(item: ChecklistItem) {
    if (!canChecklist || isGuest) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        promoteToCard: true,
        itemId: item.id,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Promote failed');
      return;
    }
    await load();
  }

  async function onPickFiles(files: FileList | null) {
    if (!canAttach || !files?.length) return;
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        if (file.size > 8 * 1024 * 1024) {
          setError(`File too large: ${file.name}`);
          continue;
        }
        const payload = await readFileAsDataUrl(file);
        const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Upload failed');
          return;
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  }

  function onCommentChange(value: string) {
    setCommentBody(value);
    const cursor = commentRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const at = before.lastIndexOf('@');
    if (at >= 0 && !/\s/.test(before.slice(at + 1))) {
      setMentionOpen(true);
      setMentionQuery(before.slice(at + 1));
    } else {
      setMentionOpen(false);
      setMentionQuery('');
    }
  }

  function insertMention(m: MemberOption) {
    const el = commentRef.current;
    const value = commentBody;
    const cursor = el?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const at = before.lastIndexOf('@');
    const next =
      at >= 0 ? `${before.slice(0, at)}@${m.label} ${after}` : `${value}@${m.label} `;
    setCommentBody(next);
    setMentionIds((prev) => (prev.includes(m.userId) ? prev : [...prev, m.userId]));
    setMentionOpen(false);
    setMentionQuery('');
  }

  async function postComment(e: FormEvent) {
    e.preventDefault();
    if (!canComment || !commentBody.trim()) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: commentBody.trim(),
        mentionIds,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Comment failed');
      return;
    }
    setCommentBody('');
    setMentionIds([]);
    pulseSaved();
    await load();
    onChanged?.();
  }

  async function saveCommentEdit(commentId: string) {
    const next = editingCommentBody.trim();
    if (!next) return;
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, body: next }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    setEditingCommentId(null);
    setEditingCommentBody('');
    setCard((c) =>
      c
        ? {
            ...c,
            comments: c.comments.map((cm) =>
              cm.id === commentId ? { ...cm, body: next } : cm,
            ),
          }
        : c,
    );
    pulseSaved();
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm(t('boardTask.deleteCommentConfirm'))) return;
    const res = await fetch(
      `/api/boards/${boardId}/cards/${cardId}/comments?commentId=${encodeURIComponent(commentId)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Failed');
      return;
    }
    setCard((c) =>
      c
        ? { ...c, comments: c.comments.filter((cm) => cm.id !== commentId) }
        : c,
    );
    pulseSaved();
    onChanged?.();
  }

  if (!open) return null;

  const assignedIds = new Set(card?.assignees?.map((a) => a.userId) || []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={glassStyle(isDark)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm truncate" style={{ color: textSecondary(isDark) }}>
              {card?.list?.title
                ? localizeListTitle(card.list.title, t)
                : t('boardTask.list')}
            </p>
            <AutosaveToast open={saveToastOpen} isDark={isDark} />
          </div>
          <div className="flex items-center gap-1">
            {canDelete && (
              <button
                type="button"
                onClick={() => void deleteCard()}
                disabled={deleting}
                className="p-2 rounded-lg text-red-500"
                aria-label={t('boardTask.deleteTask')}
                title={t('boardTask.deleteTask')}
              >
                <MdDelete size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{ color: textMuted(isDark) }}
              aria-label={t('common.close')}
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              {t('common.loading')}
            </p>
          )}
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {card && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
              <div className="space-y-5 min-w-0">
                <EditableTextField
                  value={title}
                  onChange={setTitle}
                  onCommit={(v) => void saveTitle(v)}
                  disabled={!canEditTitle}
                  size="title"
                  isDark={isDark}
                  aria-label={t('boardTask.taskTitle')}
                  placeholder={t('boardTask.titleRequired')}
                />

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: textMuted(isDark) }}>
                    {t('boardTask.description')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => void saveDescription()}
                    rows={4}
                    disabled={!canEditDescription}
                    className="w-full px-3 py-2 rounded-xl bg-transparent text-sm"
                    style={field}
                    placeholder={t('boardTask.descriptionPlaceholder')}
                  />
                </div>

                <ChecklistEditor
                  isDark={isDark}
                  mode="edit"
                  canEdit={canChecklist}
                  draft={checklistTitle}
                  onDraftChange={setChecklistTitle}
                  onAdd={() => void addChecklist()}
                  items={(card.checklistItems || []).map((item) => ({
                    id: item.id,
                    title: item.title,
                    isDone: item.isDone,
                    description: item.description,
                    linkedCardId: item.linkedCardId,
                  }))}
                  noteOpen={noteOpen}
                  onToggleNote={(id, open) => {
                    setNoteOpen((prev) => ({ ...prev, [id]: open }));
                    if (!open && canChecklist) {
                      const item = card.checklistItems.find((i) => i.id === id);
                      if (item) void saveChecklistNote(item, '');
                    }
                  }}
                  onTitleChange={(id, nextTitle) => {
                    setCard((c) =>
                      c
                        ? {
                            ...c,
                            checklistItems: c.checklistItems.map((i) =>
                              i.id === id ? { ...i, title: nextTitle } : i,
                            ),
                          }
                        : c,
                    );
                  }}
                  onTitleCommit={(id, nextTitle) => {
                    const item = card.checklistItems.find((i) => i.id === id);
                    if (item) void saveChecklistTitle(item, nextTitle);
                  }}
                  onToggleDone={(id) => {
                    const item = card.checklistItems.find((i) => i.id === id);
                    if (item) void toggleChecklist(item);
                  }}
                  onNoteChange={(id, description) => {
                    setCard((c) =>
                      c
                        ? {
                            ...c,
                            checklistItems: c.checklistItems.map((i) =>
                              i.id === id ? { ...i, description } : i,
                            ),
                          }
                        : c,
                    );
                    setNoteOpen((prev) => ({ ...prev, [id]: true }));
                  }}
                  onNoteCommit={(id, description) => {
                    const item = card.checklistItems.find((i) => i.id === id);
                    if (item) void saveChecklistNote(item, description);
                  }}
                  onRemove={(id) => {
                    const item = card.checklistItems.find((i) => i.id === id);
                    if (item) void deleteChecklistItem(item);
                  }}
                  onPromote={(id) => {
                    const item = card.checklistItems.find((i) => i.id === id);
                    if (item) void promoteChecklist(item);
                  }}
                  onReorder={(ids) => void reorderChecklist(ids)}
                  fieldStyle={field}
                />

                <div>
                  <p
                    className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    <MdAttachFile size={14} />
                    {t('boardTask.attachments')}
                  </p>
                  <ul className="space-y-1 mb-2">
                    {(card.attachments || []).map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline-offset-2 hover:underline"
                          style={{ color: textSecondary(isDark) }}
                        >
                          {a.fileName}
                        </a>
                      </li>
                    ))}
                    {(card.attachments || []).length === 0 && (
                      <li className="text-sm" style={{ color: textMuted(isDark) }}>
                        {t('boardTask.noAttachments')}
                      </li>
                    )}
                  </ul>
                  {canAttach && (
                    <label
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
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
                  )}
                </div>

                <div>
                  <p
                    className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    <MdChatBubbleOutline size={14} />
                    {t('boardTask.comments')}
                  </p>
                  <ul className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {(card.comments || []).map((c) => {
                      const mine = c.author.id === myUserId;
                      const editing = editingCommentId === c.id;
                      return (
                        <li
                          key={c.id}
                          className="px-3 py-2 rounded-lg text-sm"
                          style={{ background: surfaceItem(isDark) }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs" style={{ color: textMuted(isDark) }}>
                              {c.author.name || c.author.email}
                            </p>
                            {mine && !editing && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  className="p-1 rounded"
                                  style={{ color: textMuted(isDark) }}
                                  title={t('common.edit')}
                                  aria-label={t('common.edit')}
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingCommentBody(c.body);
                                  }}
                                >
                                  <MdEdit size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded text-red-500"
                                  title={t('common.delete')}
                                  aria-label={t('common.delete')}
                                  onClick={() => void deleteComment(c.id)}
                                >
                                  <MdDelete size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          {editing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentBody}
                                onChange={(e) => setEditingCommentBody(e.target.value)}
                                rows={2}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-transparent text-sm outline-none"
                                style={field}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                                  style={{ background: '#2563EB' }}
                                  onClick={() => void saveCommentEdit(c.id)}
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  type="button"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                  style={{ color: textMuted(isDark) }}
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentBody('');
                                  }}
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ color: textPrimary(isDark) }}>
                              {renderCommentBody(c.body)}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <form onSubmit={postComment} className="relative space-y-2">
                    <textarea
                      ref={commentRef}
                      value={commentBody}
                      onChange={(e) => onCommentChange(e.target.value)}
                      placeholder={t('boardTask.commentPlaceholder')}
                      rows={2}
                      disabled={!canComment}
                      className="w-full px-3 py-2 rounded-lg bg-transparent text-sm disabled:opacity-60"
                      style={field}
                    />
                    {mentionOpen && mentionSuggestions.length > 0 && (
                      <ul
                        className="absolute start-0 end-0 bottom-full mb-1 rounded-xl overflow-hidden z-10"
                        style={{
                          background: isDark ? 'var(--background)' : '#fff',
                          border: `1px solid ${borderSubtle(isDark)}`,
                        }}
                      >
                        {mentionSuggestions.map((m) => (
                          <li key={m.userId}>
                            <button
                              type="button"
                              className="w-full text-start px-3 py-2 text-sm"
                              style={{ color: textPrimary(isDark) }}
                              onClick={() => insertMention(m)}
                            >
                              @{m.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <GlassButton type="submit" className="px-3 py-1.5 rounded-lg text-xs">
                      {t('boardTask.post')}
                    </GlassButton>
                  </form>
                </div>
              </div>

              <aside className="space-y-4">
                <div>
                  <p
                    className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    <MdPersonAdd size={14} />
                    {t('boardTask.assignees')}
                  </p>
                  {canAssign ? (
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {members.map((m) => {
                        const checked = assignedIds.has(m.userId);
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
                                onChange={() => void toggleAssignee(m.userId)}
                              />
                              <span className="truncate">{m.label}</span>
                            </label>
                          </li>
                        );
                      })}
                      {members.length === 0 && (
                        <li className="text-xs" style={{ color: textMuted(isDark) }}>
                          {t('membersPage.noMembers')}
                        </li>
                      )}
                    </ul>
                  ) : (card.assignees?.length ?? 0) === 0 ? (
                    <p className="text-xs" style={{ color: textMuted(isDark) }}>
                      {t('projectsPage.unassigned')}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {card.assignees!.map((a) => (
                        <li
                          key={a.userId}
                          className="text-sm px-2 py-1.5 rounded-lg truncate"
                          style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}
                        >
                          {a.user.name || a.user.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p
                    className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    <MdSupervisorAccount size={14} />
                    {t('boardTask.supervisorOptional')}
                  </p>
                  {canAssign ? (
                    <select
                      value={supervisorId}
                      onChange={(e) => void saveSupervisor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-transparent text-sm"
                      style={field}
                    >
                      <option value="">{t('boardTask.noSupervisor')}</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  ) : card.supervisor ? (
                    <p
                      className="text-sm px-2 py-1.5 rounded-lg truncate"
                      style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}
                    >
                      {card.supervisor.name || card.supervisor.email}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: textMuted(isDark) }}>
                      {t('boardTask.noSupervisor')}
                    </p>
                  )}
                </div>

                <div>
                  <p
                    className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    <MdAccessTime size={14} />
                    {t('boardTask.workStatus')}
                  </p>
                  <div
                    className="rounded-xl px-3 py-2.5 space-y-2"
                    style={{ background: surfaceItem(isDark) }}
                  >
                    <p className="text-sm font-medium" style={{ color: textPrimary(isDark) }}>
                      {workflow === 'ASSIGNED' && t('boardTask.assignedWaiting')}
                      {workflow === 'IN_PROGRESS' && t('myTasksPage.onProcess')}
                      {workflow === 'PENDING_APPROVAL' && t('board.pendingApproval')}
                      {workflow === 'APPROVED' && t('board.approved')}
                      {workflow === 'REJECTED' && t('board.rejectionNote')}
                    </p>
                    {!assignmentReady && (
                      <p className="text-xs" style={{ color: textMuted(isDark) }}>
                        {t('boardTask.managerMustSetDates')}
                      </p>
                    )}
                    {card.estimatedHours != null && card.estimatedHours > 0 && (
                      <p className="text-xs" style={{ color: textSecondary(isDark) }}>
                        {t('boardTask.estimate')}: {formatDurationLabel(card.estimatedHours, t)}
                        <span style={{ color: textMuted(isDark) }}>
                          {' '}
                          {t('boardTask.estimateHours', { n: card.estimatedHours })}
                        </span>
                      </p>
                    )}
                    {card.rejectionNote && workflow === 'REJECTED' && (
                      <p className="text-xs" style={{ color: textSecondary(isDark) }}>
                        {t('boardTask.feedback')}: {card.rejectionNote}
                      </p>
                    )}

                    {isAssignee &&
                      (workflow === 'ASSIGNED' || workflow === 'REJECTED') && (
                        <GlassButton
                          type="button"
                          disabled={workflowBusy || !assignmentReady}
                          onClick={() => void runWorkflow('start')}
                          className="w-full px-3 py-2 rounded-lg text-xs inline-flex items-center justify-center gap-1"
                        >
                          <MdPlayArrow size={16} />
                          {t('boardTask.startWork')}
                        </GlassButton>
                      )}

                    {workTimerActive && (
                      <div
                        className="rounded-xl px-3 py-3 space-y-1"
                        style={{
                          background: isDark
                            ? 'rgba(37,99,235,0.18)'
                            : 'rgba(37,99,235,0.1)',
                          border: '1px solid rgba(37,99,235,0.35)',
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wide inline-flex items-center gap-1"
                          style={{ color: '#60a5fa' }}
                        >
                          <MdAccessTime size={12} />
                          {t('boardTask.workStatus')}
                        </p>
                        <p
                          className="text-2xl font-mono font-bold tabular-nums"
                          style={{ color: textPrimary(isDark) }}
                        >
                          {workTimerLabel}
                        </p>
                        <p className="text-[10px]" style={{ color: textMuted(isDark) }}>
                          {t('boardTask.runningSinceStart')}
                        </p>
                      </div>
                    )}

                    <CardSchedulePanel
                      boardId={boardId}
                      cardId={cardId}
                      isDark={isDark}
                      isAssignee={!!isAssignee}
                      isManager={!!isManager}
                      workflowStatus={workflow}
                      dueDate={card.dueDate}
                      startDate={card.startDate ?? null}
                      estimatedHours={card.estimatedHours ?? null}
                      extensionRequests={card.extensionRequests || []}
                      scheduleChanges={card.scheduleChanges || []}
                      delayIncident={card.delayIncident ?? null}
                      onChanged={() => void load()}
                      onError={(msg) => setError(msg)}
                    />

                    {isAssignee && workflow === 'IN_PROGRESS' && (
                      <GlassButton
                        type="button"
                        disabled={workflowBusy || !checklistDone}
                        onClick={() => void runWorkflow('submit')}
                        className="w-full px-3 py-2 rounded-lg text-xs"
                      >
                        {checklistDone
                          ? t('billing.submit')
                          : t('boardTask.checklist')}
                      </GlassButton>
                    )}

                    {isManager && workflow === 'PENDING_APPROVAL' && (
                      <div className="space-y-2 pt-1">
                        <p
                          className="text-[11px] font-medium uppercase tracking-wide"
                          style={{ color: textMuted(isDark) }}
                        >
                          {t('boardTask.evalTitle')}
                        </p>
                        {(
                          [
                            ['quality', 'evalQuality'],
                            ['timeliness', 'evalTimeliness'],
                            ['communication', 'evalCommunication'],
                            ['initiative', 'evalInitiative'],
                            ['collaboration', 'evalCollaboration'],
                            ['overall', 'evalOverall'],
                          ] as const
                        ).map(([key, labelKey]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between gap-2 text-xs"
                            style={{ color: textSecondary(isDark) }}
                          >
                            <span>{t(`boardTask.${labelKey}`)}</span>
                            <select
                              value={evalForm[key]}
                              onChange={(e) =>
                                setEvalForm((f) => ({
                                  ...f,
                                  [key]: Number(e.target.value),
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-transparent"
                              style={field}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                        <textarea
                          value={evalForm.strengths}
                          onChange={(e) =>
                            setEvalForm((f) => ({ ...f, strengths: e.target.value }))
                          }
                          placeholder={t('boardTask.strengths')}
                          rows={2}
                          className="w-full px-2 py-1.5 rounded-lg bg-transparent text-xs resize-none"
                          style={field}
                        />
                        <textarea
                          value={evalForm.improvements}
                          onChange={(e) =>
                            setEvalForm((f) => ({
                              ...f,
                              improvements: e.target.value,
                            }))
                          }
                          placeholder={t('boardTask.improvements')}
                          rows={2}
                          className="w-full px-2 py-1.5 rounded-lg bg-transparent text-xs resize-none"
                          style={field}
                        />
                        <textarea
                          value={evalForm.notes}
                          onChange={(e) =>
                            setEvalForm((f) => ({ ...f, notes: e.target.value }))
                          }
                          placeholder={t('boardTask.notes')}
                          rows={2}
                          className="w-full px-2 py-1.5 rounded-lg bg-transparent text-xs resize-none"
                          style={field}
                        />
                        <GlassButton
                          type="button"
                          disabled={workflowBusy}
                          onClick={() =>
                            void runWorkflow('approve', {
                              quality: evalForm.quality,
                              timeliness: evalForm.timeliness,
                              communication: evalForm.communication,
                              initiative: evalForm.initiative,
                              collaboration: evalForm.collaboration,
                              overall: evalForm.overall,
                              strengths: evalForm.strengths || null,
                              improvements: evalForm.improvements || null,
                              notes: evalForm.notes || null,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg text-xs"
                        >
                          {t('board.approveSave')}
                        </GlassButton>
                        <input
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder={t('board.rejectionNotePlaceholder')}
                          className="w-full px-2 py-1.5 rounded-lg bg-transparent text-xs"
                          style={field}
                        />
                        <GlassButton
                          type="button"
                          disabled={workflowBusy || !rejectNote.trim()}
                          onClick={() =>
                            void runWorkflow('reject', { note: rejectNote.trim() })
                          }
                          className="w-full px-3 py-2 rounded-lg text-xs"
                        >
                          {t('common.reject')}
                        </GlassButton>
                      </div>
                    )}

                    {card.evaluation && workflow === 'APPROVED' && (
                      <div
                        className="text-xs space-y-1 pt-1"
                        style={{ color: textSecondary(isDark) }}
                      >
                        <p>
                          {t('boardTask.evalOverall')} {card.evaluation.overall}/5 ·{' '}
                          {t('boardTask.evalQuality')} {card.evaluation.quality} ·{' '}
                          {t('boardTask.evalTimeliness')} {card.evaluation.timeliness}
                        </p>
                        {card.evaluation.strengths && (
                          <p>
                            {t('boardTask.strengths')}: {card.evaluation.strengths}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    {t('boardTask.dueDate')}
                  </label>
                  <AppDateRangePicker
                    value={{ start: startDate, end: dueDate }}
                    onChange={(r) => void saveDueRange(r)}
                    disabled={!canEditDueDate}
                    isDark={isDark}
                    placeholder={t('boardTask.dueRangePlaceholder')}
                  />
                  {canEditDueDate && dueDirty && (
                    <div className="mt-2 space-y-2">
                      {card.dueDate &&
                        new Date(card.dueDate).getTime() < Date.now() &&
                        workflow !== 'APPROVED' && (
                          <textarea
                            value={dueSaveReason}
                            onChange={(e) => setDueSaveReason(e.target.value)}
                            placeholder={t('boardTask.adjustSchedule')}
                            rows={2}
                            className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none bg-transparent"
                            style={field}
                          />
                        )}
                      <GlassButton
                        type="button"
                        disabled={dueSaving}
                        onClick={() => void commitDueRange()}
                        className="w-full px-3 py-2 rounded-xl text-xs"
                      >
                        {dueSaving ? t('common.loading') : t('boardTask.save')}
                      </GlassButton>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: textMuted(isDark) }}
                  >
                    {t('boardTask.estimatedTime')}{' '}
                    <span className="font-normal">({t('boardTask.estimatedOptional')})</span>
                  </label>
                  <AppDurationPicker
                    value={estimatedHours}
                    onChange={setEstimatedHours}
                    onCommit={(v) => void saveEstimatedHours(v)}
                    disabled={!canEditDueDate}
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
                    disabled={!canEditPriority}
                    onChange={(e) => void savePriority(e.target.value as CardPriorityValue)}
                    className="w-full px-3 py-2 rounded-xl bg-transparent text-sm"
                    style={field}
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
                    {workspaceLabels.map((l) => {
                      const on = selectedLabelIds.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          disabled={!canEditLabels}
                          onClick={() => void toggleLabel(l.id)}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full disabled:opacity-60"
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
                    {workspaceLabels.length === 0 && (
                      <p className="text-xs" style={{ color: textMuted(isDark) }}>
                        {t('common.noResults')}
                      </p>
                    )}
                  </div>
                </div>

                {canSeeViews && (
                  <div>
                    <p
                      className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                      style={{ color: textMuted(isDark) }}
                    >
                      <MdVisibility size={14} />
                      {t('boardTask.seenBy')}
                    </p>
                    {(card.views?.length ?? 0) === 0 ? (
                      <p className="text-xs" style={{ color: textMuted(isDark) }}>
                        {t('boardTask.noViewsYet')}
                      </p>
                    ) : (
                      <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                        {card.views!.map((v) => (
                          <li
                            key={v.userId}
                            className="px-2 py-1.5 rounded-lg text-xs"
                            style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}
                          >
                            <p className="font-medium truncate" style={{ color: textPrimary(isDark) }}>
                              {v.user.name || v.user.email}
                            </p>
                            <p style={{ color: textMuted(isDark) }}>
                              {t('boardTask.lastSeen', {
                                when: new Date(v.lastSeenAt).toLocaleString(),
                              })}
                              {v.seeCount > 1 ? ` · ${v.seeCount}×` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {!isGuest && workTimerActive && (
                  <div>
                    <p
                      className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
                      style={{ color: textMuted(isDark) }}
                    >
                      <MdAccessTime size={14} />
                      {t('boardTask.elapsed')}
                    </p>
                    <WorkTimerBadge
                      startedAt={card?.startedAt}
                      workflowStatus={workflow}
                      size="lg"
                      hideWhenInactive={false}
                    />
                    <p className="text-xs mt-2" style={{ color: textMuted(isDark) }}>
                      {t('boardTask.liveFromStart')}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
