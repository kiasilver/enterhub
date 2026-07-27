'use client';

import { useState } from 'react';
import {
  MdAccessTime,
  MdCheck,
  MdClose,
  MdSchedule,
  MdWarning,
} from 'react-icons/md';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  hexToRgba,
} from '@/components/SafeDashboard/theme';
import { formatDurationLabel } from '@/components/ui/AppDurationPicker';
import { AppDateRangePicker } from '@/components/ui/AppDateRangePicker';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Person = { id: string; name: string | null; email: string };

export type ExtensionRequestRow = {
  id: string;
  amount: number;
  unit: 'HOURS' | 'DAYS';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewNote?: string | null;
  proposedDueDate?: string | null;
  proposedEstimatedHours?: number | null;
  createdAt: string;
  requestedBy: Person;
  reviewedBy?: Person | null;
};

export type ScheduleChangeRow = {
  id: string;
  source: 'EXTENSION_APPROVED' | 'MANAGER_ADJUST' | 'DELAY_RESCHEDULE';
  prevDueDate?: string | null;
  newDueDate?: string | null;
  prevEstimatedHours?: number | null;
  newEstimatedHours?: number | null;
  addedDays: number;
  addedHours: number;
  reason: string;
  createdAt: string;
  changedBy: Person;
};

export type DelayIncidentRow = {
  id: string;
  status: 'OPEN' | 'CHARGED' | 'WAIVED';
  overdueAt: string;
  daysLate?: number | null;
  waiveReason?: string | null;
  chargedBy?: Person | null;
  waivedBy?: Person | null;
};

type Props = {
  boardId: string;
  cardId: string;
  isDark: boolean;
  isAssignee: boolean;
  isManager: boolean;
  workflowStatus: string;
  dueDate: string | null;
  startDate?: string | null;
  estimatedHours: number | null;
  extensionRequests: ExtensionRequestRow[];
  scheduleChanges: ScheduleChangeRow[];
  delayIncident: DelayIncidentRow | null;
  onChanged: () => void;
  onError: (msg: string) => void;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CardSchedulePanel({
  boardId,
  cardId,
  isDark,
  isAssignee,
  isManager,
  workflowStatus,
  dueDate,
  startDate = null,
  estimatedHours,
  extensionRequests,
  scheduleChanges,
  delayIncident,
  onChanged,
  onError,
}: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [extAmount, setExtAmount] = useState('1');
  const [extUnit, setExtUnit] = useState<'HOURS' | 'DAYS'>('DAYS');
  const [extReason, setExtReason] = useState('');
  const [showExtForm, setShowExtForm] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [showWaive, setShowWaive] = useState(false);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustDays, setAdjustDays] = useState('1');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDelayReschedule, setShowDelayReschedule] = useState(false);
  const [delayRange, setDelayRange] = useState({ start: '', end: '' });
  const [delayReason, setDelayReason] = useState('');

  const now = Date.now();
  const dueMs = dueDate ? new Date(dueDate).getTime() : null;
  const beforeDue = dueMs != null && dueMs > now;
  const overdue =
    dueMs != null &&
    dueMs < now &&
    workflowStatus !== 'APPROVED';
  const canRequestExt =
    isAssignee &&
    beforeDue &&
    (workflowStatus === 'ASSIGNED' ||
      workflowStatus === 'IN_PROGRESS' ||
      workflowStatus === 'REJECTED') &&
    !extensionRequests.some((r) => r.status === 'PENDING');

  const pending = extensionRequests.filter((r) => r.status === 'PENDING');
  const field = {
    background: surfaceItem(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  };

  async function api(path: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Request failed');
      onChanged();
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Request failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {overdue && (
        <div
          className="rounded-xl px-3 py-2.5 space-y-2"
          style={{
            background: hexToRgba('#EF4444', isDark ? 0.15 : 0.08),
            border: `1px solid ${hexToRgba('#EF4444', 0.35)}`,
          }}
        >
          <p
            className="text-xs font-semibold inline-flex items-center gap-1.5"
            style={{ color: '#f87171' }}
          >
            <MdWarning size={14} />
            {t('boardTask.delayedPastDue')}
            {delayIncident?.daysLate != null && (
              <span className="font-normal opacity-80">
                · {t('boardTask.daysLate', { n: Number(delayIncident.daysLate).toFixed(1) })}
              </span>
            )}
          </p>
          <p className="text-[11px]" style={{ color: textSecondary(isDark) }}>
            {t('boardTask.latePenaltyHint')}
          </p>
          {delayIncident?.status === 'OPEN' && isManager && (
            <div className="flex flex-wrap gap-2">
              <GlassButton
                type="button"
                disabled={busy || !delayIncident}
                onClick={() =>
                  void api(
                    `/api/boards/${boardId}/cards/${cardId}/delay-incidents/${delayIncident!.id}/charge`,
                  )
                }
                className="px-3 py-1.5 rounded-lg text-xs"
              >
                {t('boardTask.markLate')}
              </GlassButton>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowWaive((v) => !v);
                  setShowDelayReschedule(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  border: `1px solid ${borderSubtle(isDark)}`,
                  color: textSecondary(isDark),
                }}
              >
                {t('boardTask.excuseEllipsis')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowDelayReschedule((v) => !v);
                  setShowWaive(false);
                  const toInput = (iso: string | null | undefined) =>
                    iso ? iso.slice(0, 10) : '';
                  setDelayRange({
                    start: toInput(startDate),
                    end: toInput(dueDate),
                  });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  border: `1px solid ${hexToRgba('#2563EB', 0.4)}`,
                  color: '#60a5fa',
                }}
              >
                {t('boardTask.changeDatesEllipsis')}
              </button>
            </div>
          )}
          {showWaive && delayIncident?.status === 'OPEN' && isManager && (
            <div className="space-y-2">
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder={t('boardTask.waivePlaceholder')}
                rows={2}
                className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none bg-transparent"
                style={field}
              />
              <GlassButton
                type="button"
                disabled={busy || waiveReason.trim().length < 3}
                onClick={async () => {
                  const ok = await api(
                    `/api/boards/${boardId}/cards/${cardId}/delay-incidents/${delayIncident!.id}/waive`,
                    { waiveReason: waiveReason.trim() },
                  );
                  if (ok) {
                    setShowWaive(false);
                    setWaiveReason('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs"
              >
                {t('boardTask.saveExcuse')}
              </GlassButton>
            </div>
          )}
          {showDelayReschedule &&
            delayIncident?.status === 'OPEN' &&
            isManager && (
              <div className="space-y-2">
                <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                  {t('boardTask.newDateRangeHint')}
                </p>
                <AppDateRangePicker
                  value={delayRange}
                  onChange={setDelayRange}
                  isDark={isDark}
                  placeholder={t('boardTask.dueRangePlaceholder')}
                />
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder={t('boardTask.changeDeadlinePlaceholder')}
                  rows={2}
                  className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none bg-transparent"
                  style={field}
                />
                <GlassButton
                  type="button"
                  disabled={
                    busy ||
                    !delayRange.start ||
                    !delayRange.end ||
                    delayReason.trim().length < 3
                  }
                  onClick={async () => {
                    const ok = await api(
                      `/api/boards/${boardId}/cards/${cardId}/schedule-adjust`,
                      {
                        reason: delayReason.trim(),
                        startDate: delayRange.start,
                        dueDate: delayRange.end,
                        estimatedHours: estimatedHours,
                      },
                    );
                    if (ok) {
                      setShowDelayReschedule(false);
                      setDelayReason('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs"
                >
                  {t('boardTask.saveNewDates')}
                </GlassButton>
              </div>
            )}
          {delayIncident?.status === 'CHARGED' && (
            <p className="text-xs" style={{ color: textSecondary(isDark) }}>
              {t('boardTask.markedLate')}
              {delayIncident.chargedBy
                ? ` ${t('boardTask.byUser', {
                    name:
                      delayIncident.chargedBy.name || delayIncident.chargedBy.email,
                  })}`
                : ''}{' '}
              {t('boardTask.scoreHit')}
            </p>
          )}
          {delayIncident?.status === 'WAIVED' && (
            <p className="text-xs" style={{ color: textSecondary(isDark) }}>
              {t('boardTask.excused')}
              {delayIncident.waivedBy
                ? ` ${t('boardTask.byUser', {
                    name:
                      delayIncident.waivedBy.name || delayIncident.waivedBy.email,
                  })}`
                : ''}
              {delayIncident.waiveReason
                ? `: ${delayIncident.waiveReason}`
                : ''}{' '}
              {t('boardTask.noScoreHit')}
            </p>
          )}
        </div>
      )}

      {(canRequestExt || pending.length > 0 || isManager) && (
        <div
          className="rounded-xl px-3 py-2.5 space-y-2"
          style={{ background: surfaceItem(isDark) }}
        >
          <p
            className="text-xs font-medium inline-flex items-center gap-1.5"
            style={{ color: textMuted(isDark) }}
          >
            <MdSchedule size={14} />
            {t('boardTask.scheduleExtensions')}
          </p>

          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-lg px-2.5 py-2 space-y-1.5"
              style={{
                border: `1px solid ${hexToRgba('#F59E0B', 0.4)}`,
                background: hexToRgba('#F59E0B', isDark ? 0.1 : 0.06),
              }}
            >
              <p className="text-xs font-medium" style={{ color: textPrimary(isDark) }}>
                {t('boardTask.pendingAmount', {
                  amount: r.amount,
                  unit:
                    r.unit === 'HOURS' ? t('boardTask.hours') : t('boardTask.days'),
                })}
              </p>
              <p className="text-[11px]" style={{ color: textSecondary(isDark) }}>
                {r.requestedBy.name || r.requestedBy.email}: {r.reason}
              </p>
              {isManager && (
                <div className="flex gap-2 pt-1">
                  <GlassButton
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void api(
                        `/api/boards/${boardId}/cards/${cardId}/extension-requests/${r.id}/approve`,
                        {},
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1"
                  >
                    <MdCheck size={12} /> {t('boardTask.accept')}
                  </GlassButton>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void api(
                        `/api/boards/${boardId}/cards/${cardId}/extension-requests/${r.id}/reject`,
                        {},
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1"
                    style={{
                      border: `1px solid ${borderSubtle(isDark)}`,
                      color: textSecondary(isDark),
                    }}
                  >
                    <MdClose size={12} /> {t('boardTask.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}

          {canRequestExt && (
            <>
              {!showExtForm ? (
                <button
                  type="button"
                  onClick={() => setShowExtForm(true)}
                  className="text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: '#60a5fa' }}
                >
                  {t('boardTask.requestMoreTime')}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={extAmount}
                      onChange={(e) => setExtAmount(e.target.value)}
                      className="w-20 rounded-lg px-2 py-1.5 text-xs outline-none bg-transparent"
                      style={field}
                    />
                    <select
                      value={extUnit}
                      onChange={(e) =>
                        setExtUnit(e.target.value as 'HOURS' | 'DAYS')
                      }
                      className="rounded-lg px-2 py-1.5 text-xs outline-none bg-transparent"
                      style={field}
                    >
                      <option value="DAYS">{t('boardTask.daysUnit')}</option>
                      <option value="HOURS">{t('boardTask.hoursUnit')}</option>
                    </select>
                  </div>
                  <textarea
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    placeholder={t('boardTask.needMoreTimePlaceholder')}
                    rows={2}
                    className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none bg-transparent"
                    style={field}
                  />
                  <div className="flex gap-2">
                    <GlassButton
                      type="button"
                      disabled={
                        busy ||
                        Number(extAmount) <= 0 ||
                        extReason.trim().length < 3
                      }
                      onClick={async () => {
                        const ok = await api(
                          `/api/boards/${boardId}/cards/${cardId}/extension-requests`,
                          {
                            amount: Number(extAmount),
                            unit: extUnit,
                            reason: extReason.trim(),
                          },
                        );
                        if (ok) {
                          setShowExtForm(false);
                          setExtReason('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs"
                    >
                      {t('boardTask.submitRequest')}
                    </GlassButton>
                    <button
                      type="button"
                      onClick={() => setShowExtForm(false)}
                      className="text-xs"
                      style={{ color: textMuted(isDark) }}
                    >
                      {t('kanban.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isManager && (
            <>
              {!showAdjust ? (
                <button
                  type="button"
                  onClick={() => setShowAdjust(true)}
                  className="text-xs font-medium block"
                  style={{ color: textMuted(isDark) }}
                >
                  {t('boardTask.adjustScheduleEllipsis')}
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px]" style={{ color: textMuted(isDark) }}>
                    {t('boardTask.adjustDaysHint')}
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={adjustDays}
                      onChange={(e) => setAdjustDays(e.target.value)}
                      className="w-16 rounded-lg px-2 py-1.5 text-xs outline-none bg-transparent"
                      style={field}
                    />
                    <span className="text-xs" style={{ color: textSecondary(isDark) }}>
                      {t('boardTask.extraDays')}
                    </span>
                  </div>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder={t('boardTask.reasonAuditPlaceholder')}
                    rows={2}
                    className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none bg-transparent"
                    style={field}
                  />
                  <GlassButton
                    type="button"
                    disabled={
                      busy ||
                      Number(adjustDays) <= 0 ||
                      adjustReason.trim().length < 3 ||
                      !dueDate
                    }
                    onClick={async () => {
                      const base = dueDate ? new Date(dueDate) : new Date();
                      base.setUTCDate(
                        base.getUTCDate() + Math.ceil(Number(adjustDays)),
                      );
                      const ok = await api(
                        `/api/boards/${boardId}/cards/${cardId}/schedule-adjust`,
                        {
                          reason: adjustReason.trim(),
                          dueDate: base.toISOString(),
                          estimatedHours: estimatedHours,
                        },
                      );
                      if (ok) {
                        setShowAdjust(false);
                        setAdjustReason('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs"
                  >
                    {t('boardTask.applyAdjustment')}
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {scheduleChanges.length > 0 && (
        <div className="space-y-1.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: textMuted(isDark) }}
          >
            {t('boardTask.scheduleHistory')}
          </p>
          <ul className="space-y-1.5">
            {scheduleChanges.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="rounded-lg px-2.5 py-2 text-[11px]"
                style={{
                  background: surfaceItem(isDark),
                  color: textSecondary(isDark),
                }}
              >
                <span className="font-medium" style={{ color: textPrimary(isDark) }}>
                  {c.source === 'EXTENSION_APPROVED'
                    ? t('boardTask.extension')
                    : c.source === 'DELAY_RESCHEDULE'
                      ? t('boardTask.delayReschedule')
                      : t('boardTask.managerAdjust')}
                </span>
                {c.addedDays > 0 && (
                  <span>
                    {' '}
                    · +{c.addedDays.toFixed(c.addedDays % 1 ? 1 : 0)}{' '}
                    {t('boardTask.days')}
                  </span>
                )}
                {c.addedHours > 0 && (
                  <span>
                    {' '}
                    · +{formatDurationLabel(c.addedHours) || `${c.addedHours} h`}
                  </span>
                )}
                <div className="mt-0.5 opacity-80">
                  {fmtDate(c.prevDueDate)} → {fmtDate(c.newDueDate)}
                </div>
                <div className="mt-0.5">{c.reason}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 opacity-70">
                  <MdAccessTime size={10} />
                  {fmtDate(c.createdAt)} ·{' '}
                  {c.changedBy.name || c.changedBy.email}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
