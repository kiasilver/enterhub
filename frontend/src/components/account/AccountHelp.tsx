'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import CustomSelect from '@/components/SafeDashboard/CustomSelect';
import { accountFadeUp } from '@/components/account/AccountShell';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: { body: string; createdAt: string }[];
};

type Message = {
  id: string;
  body: string;
  authorRole: string;
  createdAt: string;
  author?: { name: string | null; email: string };
};

function localizeTicketStatus(
  status: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  switch (status) {
    case 'OPEN':
      return t('account.statusOpen');
    case 'IN_PROGRESS':
      return t('account.statusInProgress');
    case 'WAITING':
      return t('account.statusWaiting');
    case 'RESOLVED':
      return t('account.statusResolved');
    case 'CLOSED':
      return t('account.statusClosed');
    default:
      return status;
  }
}

export function AccountHelp({
  isDark,
  workspaceId,
}: {
  isDark: boolean;
  workspaceId: string;
}) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const card = {
    ...glassStyle(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
  };
  const inputBg = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)';

  const faqs = useMemo(
    () => [
      { q: t('account.faqInviteQ'), a: t('account.faqInviteA') },
      { q: t('account.faqBillingQ'), a: t('account.faqBillingA') },
      { q: t('account.faqStatusQ'), a: t('account.faqStatusA') },
    ],
    [t],
  );

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticketStatus, setTicketStatus] = useState<string>('OPEN');
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    body: '',
    priority: 'MEDIUM',
  });
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadTickets = useCallback(async () => {
    const res = await fetch('/api/account/tickets');
    const json = await res.json();
    if (res.ok) setTickets(json.data || []);
  }, []);

  const loadTicket = useCallback(async (id: string) => {
    const res = await fetch(`/api/account/tickets/${id}`);
    const json = await res.json();
    if (res.ok) {
      setMessages(json.data.messages || []);
      setTicketStatus(json.data.status);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!activeId) return;
    void loadTicket(activeId);

    const es = new EventSource(`/api/account/tickets/${activeId}/stream`);
    es.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data) as Message;
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
        void loadTickets();
      } catch {
        /* ignore */
      }
    });
    es.addEventListener('status', (ev) => {
      try {
        const p = JSON.parse(ev.data) as { status?: string };
        if (p.status) setTicketStatus(p.status);
        void loadTickets();
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  }, [activeId, loadTicket, loadTickets]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          workspaceId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      setCompose(false);
      setForm({ subject: '', category: 'general', body: '', priority: 'MEDIUM' });
      await loadTickets();
      setActiveId(json.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/account/tickets/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      setReply('');
      setMessages((prev) =>
        prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-3" style={card}>
        <h3 className="text-base font-bold" style={{ color: pri }}>
          {t('account.faqTitle')}
        </h3>
        <ul className="space-y-3">
          {faqs.map((f) => (
            <li key={f.q} className="px-3 py-2.5 rounded-xl" style={{ background: surfaceItem(isDark) }}>
              <p className="text-sm font-semibold" style={{ color: pri }}>
                {f.q}
              </p>
              <p className="text-xs mt-1" style={{ color: mut }}>
                {f.a}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs" style={{ color: sec }}>
          {t('account.billingLinkPrefix')}{' '}
          <Link
            href={`/workspace/${workspaceId}/settings/billing`}
            className="font-semibold underline"
            style={{ color: primaryColor }}
          >
            {t('account.billingLink')}
          </Link>
        </p>
      </motion.div>

      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold" style={{ color: pri }}>
              {t('account.supportTickets')}
            </h3>
            <p className="text-xs mt-1" style={{ color: mut }}>
              {t('account.supportTicketsHint')}
            </p>
          </div>
          <GlassButton
            type="button"
            onClick={() => {
              setCompose(true);
              setActiveId(null);
            }}
            style={{ padding: '8px 14px', borderRadius: 12 }}
          >
            {t('account.newTicket')}
          </GlassButton>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {compose && (
          <form onSubmit={(e) => void createTicket(e)} className="space-y-3 p-3 rounded-xl" style={{ background: surfaceItem(isDark) }}>
            <input
              required
              placeholder={t('account.subject')}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={{ borderColor: borderSubtle(isDark), background: inputBg, color: pri }}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <CustomSelect
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                options={[
                  { value: 'general', label: t('account.categoryGeneral') },
                  { value: 'account', label: t('account.categoryAccount') },
                  { value: 'technical', label: t('account.categoryTechnical') },
                  { value: 'security', label: t('account.categorySecurity') },
                ]}
                isDark={isDark}
                className="w-full"
              />
              <CustomSelect
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                options={[
                  { value: 'LOW', label: t('account.priorityLow') },
                  { value: 'MEDIUM', label: t('account.priorityMedium') },
                  { value: 'HIGH', label: t('account.priorityHigh') },
                  { value: 'URGENT', label: t('account.priorityUrgent') },
                ]}
                isDark={isDark}
                className="w-full"
              />
            </div>
            <textarea
              required
              rows={4}
              placeholder={t('account.describeIssue')}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none resize-none"
              style={{ borderColor: borderSubtle(isDark), background: inputBg, color: pri }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompose(false)}
                className="px-3 py-2 text-sm font-semibold"
                style={{ color: sec }}
              >
                {t('common.cancel')}
              </button>
              <GlassButton type="submit" disabled={busy} style={{ padding: '8px 16px', borderRadius: 12 }}>
                {busy ? t('account.sending') : t('account.submitTicket')}
              </GlassButton>
            </div>
          </form>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[min(520px,60vh)]">
          <ul className="space-y-1.5 max-h-[min(560px,65vh)] overflow-auto">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(ticket.id);
                    setCompose(false);
                  }}
                  className="w-full text-start px-3 py-2.5 rounded-xl"
                  style={{
                    background:
                      activeId === ticket.id
                        ? `rgba(var(--primary-rgb),0.12)`
                        : surfaceItem(isDark),
                    border: `1px solid ${
                      activeId === ticket.id ? primaryColor : borderSubtle(isDark)
                    }`,
                  }}
                >
                  <p className="text-sm font-semibold truncate" style={{ color: pri }}>
                    {ticket.subject}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: mut }}>
                    {localizeTicketStatus(ticket.status, t)} ·{' '}
                    {t('account.msgsCount', { n: ticket._count?.messages || 0 })}
                  </p>
                </button>
              </li>
            ))}
            {tickets.length === 0 && !compose && (
              <p className="text-xs px-2" style={{ color: mut }}>
                {t('account.noTicketsYet')}
              </p>
            )}
          </ul>

          <div
            className="rounded-xl flex flex-col min-h-[min(520px,60vh)]"
            style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
          >
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: mut }}>
                {t('account.selectOrCreateTicket')}
              </div>
            ) : (
              <>
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
                >
                  <p className="text-sm font-bold" style={{ color: pri }}>
                    {t('account.liveSupport')}
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: `rgba(var(--primary-rgb),0.15)`, color: primaryColor }}
                  >
                    {localizeTicketStatus(ticketStatus, t)}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[200px] max-h-[min(420px,50vh)]">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="px-3 py-2.5 rounded-xl max-w-[90%]"
                      style={{
                        marginInlineStart: m.authorRole === 'USER' ? 'auto' : 0,
                        background:
                          m.authorRole === 'SUPERADMIN'
                            ? `rgba(var(--primary-rgb),0.15)`
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                      }}
                    >
                      <p className="text-[10px] font-bold mb-1" style={{ color: mut }}>
                        {m.authorRole === 'SUPERADMIN'
                          ? t('account.supportRole')
                          : m.author?.name || t('account.you')}{' '}
                        · {new Date(m.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: pri }}>
                        {m.body}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                {ticketStatus !== 'CLOSED' && (
                  <form
                    onSubmit={(e) => void sendReply(e)}
                    className="p-3 flex gap-2"
                    style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}
                  >
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={t('account.replyPlaceholder')}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
                      style={{
                        borderColor: borderSubtle(isDark),
                        background: inputBg,
                        color: pri,
                      }}
                    />
                    <GlassButton
                      type="submit"
                      disabled={busy || !reply.trim()}
                      style={{ padding: '8px 14px', borderRadius: 12 }}
                    >
                      {t('account.send')}
                    </GlassButton>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
