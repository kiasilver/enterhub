'use client';

import { type FormEvent, type CSSProperties } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  MdArrowUpward,
  MdCheckBox,
  MdClose,
  MdDelete,
  MdDragIndicator,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { EditableTextField } from '@/components/ui/EditableTextField';
import {
  isChecklistBookend,
  isChecklistEnd,
  isChecklistStart,
} from '@/lib/checklist-defaults';
import { localizeChecklistTitle } from '@/lib/list-i18n';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

function CircleCheck({
  checked,
  disabled,
  onChange,
  isDark,
  dimmed,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  isDark: boolean;
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onChange?.();
      }}
      className="h-4 w-4 rounded-full border flex-shrink-0 inline-flex items-center justify-center transition-colors disabled:cursor-default"
      style={{
        borderColor: checked ? '#22c55e' : borderSubtle(isDark),
        background: checked ? '#22c55e' : 'transparent',
        color: '#fff',
        opacity: dimmed ? 0.4 : 1,
      }}
      aria-pressed={checked}
    >
      {checked ? <span className="text-[9px] font-bold leading-none">✓</span> : null}
    </button>
  );
}

export type ChecklistEditorRow = {
  id: string;
  title: string;
  isDone?: boolean;
  description?: string | null;
  linkedCardId?: string | null;
};

type Props = {
  isDark: boolean;
  mode: 'create' | 'edit';
  items: ChecklistEditorRow[];
  canEdit: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void | Promise<void>;
  onTitleChange?: (id: string, title: string) => void;
  onTitleCommit?: (id: string, title: string) => void | Promise<void>;
  onToggleDone?: (id: string) => void | Promise<void>;
  noteOpen: Record<string, boolean>;
  onToggleNote: (id: string, open: boolean) => void;
  onNoteChange?: (id: string, description: string) => void;
  onNoteCommit?: (id: string, description: string) => void | Promise<void>;
  onRemove?: (id: string) => void | Promise<void>;
  onPromote?: (id: string) => void | Promise<void>;
  /** Reorder middle items (ids in new order, Start/End excluded) */
  onReorder?: (orderedMiddleIds: string[]) => void | Promise<void>;
  fieldStyle: CSSProperties;
};

function AddRow({
  canEdit,
  draft,
  onDraftChange,
  onAdd,
  fieldStyle,
  isDark,
  t,
}: {
  canEdit: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void | Promise<void>;
  fieldStyle: CSSProperties;
  isDark: boolean;
  t: (key: string) => string;
}) {
  if (!canEdit) return null;

  function handleAdd(e?: FormEvent) {
    e?.preventDefault();
    if (!draft.trim()) return;
    void onAdd();
  }

  return (
    <div className="flex gap-2 py-0.5">
      <input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={t('boardTask.addChecklistItem')}
        className="flex-1 px-3 py-2 rounded-xl bg-transparent text-sm outline-none"
        style={{
          ...fieldStyle,
          border: `1.5px dashed ${borderSubtle(isDark)}`,
        }}
      />
      <button
        type="button"
        onClick={() => handleAdd()}
        className="px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
        style={{
          border: `1px solid ${borderSubtle(isDark)}`,
          color: textSecondary(isDark),
          background: surfaceItem(isDark),
        }}
      >
        {t('boardTask.add')}
      </button>
    </div>
  );
}

/**
 * Shared checklist — add always sits just before End; middle items
 * are numbered and drag-reorderable.
 */
export function ChecklistEditor({
  isDark,
  mode,
  items,
  canEdit,
  draft,
  onDraftChange,
  onAdd,
  onTitleChange,
  onTitleCommit,
  onToggleDone,
  noteOpen,
  onToggleNote,
  onNoteChange,
  onNoteCommit,
  onRemove,
  onPromote,
  onReorder,
  fieldStyle,
}: Props) {
  const { t } = useLang();
  const done = items.filter((i) => i.isDone).length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  const startItem = items.find((i) => isChecklistStart(i.title)) || null;
  const endItem = items.find((i) => isChecklistEnd(i.title)) || null;
  const middle = items.filter((i) => !isChecklistBookend(i.title));
  const canDrag = canEdit && !!onReorder && middle.length > 1;
  const milestonesDone = middle.length === 0 || middle.every((i) => i.isDone);
  /** End unlocks once every middle checklist item is done (Start is synced on End). */
  const endUnlocked = mode === 'edit' && milestonesDone;

  function onDragEnd(result: DropResult) {
    if (!onReorder || !result.destination) return;
    if (result.source.index === result.destination.index) return;
    const next = [...middle];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    void onReorder(next.map((i) => i.id));
  }

  function renderBookend(item: ChecklistEditorRow) {
    const done = Boolean(item.isDone);
    const createMuted = mode === 'create';
    const isEnd = isChecklistEnd(item.title);
    const endLocked = isEnd && !done && !endUnlocked;
    const checkDisabled =
      mode === 'create' || !canEdit || (isEnd && endLocked);
    return (
      <div
        key={item.id}
        className="rounded-xl overflow-hidden"
        title={
          endLocked
            ? t('myTasksPage.finishNeedMilestones')
            : undefined
        }
        style={{
          background: done
            ? 'rgba(34,197,94,0.14)'
            : endUnlocked && isEnd
              ? isDark
                ? 'rgba(34,197,94,0.08)'
                : 'rgba(34,197,94,0.06)'
              : isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.03)',
          outline: done
            ? '1px solid rgba(34,197,94,0.35)'
            : endUnlocked && isEnd
              ? '1px solid rgba(34,197,94,0.4)'
              : `1px dashed ${borderSubtle(isDark)}`,
          opacity: createMuted ? 0.62 : endLocked ? 0.55 : done ? 1 : 0.85,
        }}
      >
        <div className="flex items-center gap-2 px-2.5 py-2">
          <CircleCheck
            checked={done}
            disabled={checkDisabled}
            dimmed={mode === 'create' || endLocked || (!done && !endUnlocked && isEnd)}
            isDark={isDark}
            onChange={() => void onToggleDone?.(item.id)}
          />
          <span
            className="flex-1 text-sm min-w-0 truncate"
            style={{
              color: done
                ? '#16A34A'
                : endUnlocked && isEnd
                  ? '#16A34A'
                  : textMuted(isDark),
              textDecoration: done ? 'line-through' : undefined,
              fontWeight: 600,
            }}
          >
            {localizeChecklistTitle(item.title, t)}
          </span>
          {endLocked ? (
            <span className="text-[10px] shrink-0" style={{ color: textMuted(isDark) }}>
              {t('myTasksPage.finishNeedMilestones')}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderMiddle(
    item: ChecklistEditorRow,
    index: number,
    drag?: {
      innerRef: (el: HTMLElement | null) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draggableProps: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dragHandleProps: any;
      isDragging: boolean;
    },
  ) {
    const showNote = !!noteOpen[item.id] || !!item.description;
    const titleEditable = canEdit;

    return (
      <div
        key={item.id}
        ref={drag?.innerRef}
        {...(drag?.draggableProps || {})}
        className="rounded-xl overflow-hidden"
        style={{
          ...(drag?.draggableProps?.style || {}),
          background: surfaceItem(isDark),
          outline: `1px solid ${borderSubtle(isDark)}`,
          boxShadow: drag?.isDragging
            ? isDark
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(0,0,0,0.12)'
            : undefined,
        }}
      >
        <div className="flex items-center gap-2 px-2.5 py-2">
          {canDrag ? (
            <button
              type="button"
              className="p-0.5 rounded cursor-grab active:cursor-grabbing shrink-0"
              style={{ color: textMuted(isDark) }}
              aria-label={t('boardTask.reorderChecklist')}
              {...(drag?.dragHandleProps || {})}
            >
              <MdDragIndicator size={16} />
            </button>
          ) : null}

          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold inline-flex items-center justify-center shrink-0 tabular-nums"
            style={{
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: textMuted(isDark),
            }}
          >
            {index + 1}
          </span>

          <CircleCheck
            checked={Boolean(item.isDone)}
            disabled={mode === 'create' || !canEdit}
            dimmed={mode === 'create'}
            isDark={isDark}
            onChange={() => void onToggleDone?.(item.id)}
          />

          {titleEditable ? (
            <EditableTextField
              value={item.title}
              onChange={(v) => onTitleChange?.(item.id, v)}
              onCommit={(v) => void onTitleCommit?.(item.id, v)}
              isDark={isDark}
              size="body"
              className="flex-1 min-w-0 pe-6"
              aria-label={t('boardTask.renameChecklistItem')}
            />
          ) : (
            <span
              className="flex-1 text-sm min-w-0 truncate"
              style={{
                color: textPrimary(isDark),
                textDecoration: item.isDone ? 'line-through' : undefined,
                opacity: item.isDone ? 0.6 : 1,
              }}
            >
              {localizeChecklistTitle(item.title, t)}
            </span>
          )}

          <label
            className="inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer shrink-0 select-none"
            style={{
              color: showNote ? textPrimary(isDark) : textMuted(isDark),
              opacity: canEdit || item.description ? 1 : 0.55,
            }}
          >
            <input
              type="checkbox"
              checked={showNote}
              disabled={!canEdit && !item.description}
              onChange={() => {
                const next = !showNote;
                onToggleNote(item.id, next);
                if (!next && canEdit) {
                  void onNoteCommit?.(item.id, '');
                }
              }}
            />
            {t('boardTask.checklistNote')}
          </label>

          {mode === 'edit' &&
            canEdit &&
            !item.linkedCardId &&
            onPromote && (
              <button
                type="button"
                title={t('boardTask.promoteToCard')}
                className="p-1 rounded"
                style={{ color: textMuted(isDark) }}
                onClick={() => void onPromote(item.id)}
              >
                <MdArrowUpward size={14} />
              </button>
            )}

          {canEdit && onRemove && (
            <button
              type="button"
              title={t('boardTask.deleteChecklistItem')}
              aria-label={t('boardTask.deleteChecklistItem')}
              className="p-1 rounded"
              style={{ color: textMuted(isDark) }}
              onClick={() => void onRemove(item.id)}
            >
              {mode === 'edit' ? <MdDelete size={14} /> : <MdClose size={14} />}
            </button>
          )}
        </div>

        {showNote &&
          (item.description && !canEdit ? (
            <p
              className="px-3 pb-2 text-xs whitespace-pre-wrap"
              style={{ color: textSecondary(isDark) }}
            >
              {item.description}
            </p>
          ) : canEdit ? (
            <textarea
              value={item.description || ''}
              onChange={(e) => onNoteChange?.(item.id, e.target.value)}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next === (item.description || '').trim()) return;
                void onNoteCommit?.(item.id, next);
              }}
              rows={2}
              maxLength={2000}
              placeholder={t('boardTask.checklistNotePlaceholder')}
              className="mx-2.5 mb-2.5 w-[calc(100%-1.25rem)] px-2.5 py-1.5 rounded-lg text-xs outline-none resize-none bg-transparent"
              style={fieldStyle}
            />
          ) : null)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p
          className="text-xs font-medium inline-flex items-center gap-1.5"
          style={{ color: textMuted(isDark) }}
        >
          <MdCheckBox size={14} />
          {t('boardTask.checklist')}
          {items.length > 0
            ? mode === 'edit'
              ? ` · ${progress}%`
              : ` · ${items.length}`
            : ''}
        </p>
      </div>

      <div className="space-y-1.5">
        {startItem && renderBookend(startItem)}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="checklist-middle" isDropDisabled={!canDrag}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-1.5"
              >
                {middle.map((item, index) =>
                  canDrag ? (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(drag, snap) =>
                        renderMiddle(item, index, {
                          innerRef: drag.innerRef,
                          draggableProps: drag.draggableProps,
                          dragHandleProps: drag.dragHandleProps,
                          isDragging: snap.isDragging,
                        })
                      }
                    </Draggable>
                  ) : (
                    renderMiddle(item, index)
                  ),
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Always just before End so new items land above End of task */}
        {canEdit && (
          <AddRow
            canEdit={canEdit}
            draft={draft}
            onDraftChange={onDraftChange}
            onAdd={onAdd}
            fieldStyle={fieldStyle}
            isDark={isDark}
            t={t}
          />
        )}

        {endItem && renderBookend(endItem)}
      </div>
    </div>
  );
}
