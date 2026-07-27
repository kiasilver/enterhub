'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import CustomSelect from '@/components/SafeDashboard/CustomSelect';

type Message = {
  id: string;
  body: string;
  authorRole: string;
  createdAt: string;
  author?: { name: string | null; email: string };
};

export default function SuperAdminTicketPage() {
  const params = useParams();
  const id = String(params.ticketId);
  const { theme, primaryColor } = useTheme();
  const isDark = theme === 'dark';
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);

  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [userLabel, setUserLabel] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/superadmin/tickets/${id}`);
    const json = await res.json();
    if (!res.ok) return;
    setSubject(json.data.subject);
    setStatus(json.data.status);
    setPriority(json.data.priority);
    setUserLabel(json.data.user?.name || json.data.user?.email || '');
    setMessages(json.data.messages || []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const es = new EventSource(`/api/account/tickets/${id}/stream`);
    es.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data) as Message;
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      } catch {
        /* ignore */
      }
    });
    es.addEventListener('status', (ev) => {
      try {
        const p = JSON.parse(ev.data) as { status?: string; priority?: string };
        if (p.status) setStatus(p.status);
        if (p.priority) setPriority(p.priority);
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function patchMeta() {
    await fetch(`/api/superadmin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, priority }),
    });
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/superadmin/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setReply('');
        setMessages((prev) =>
          prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data],
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <Link href="/superadmin/support" className="text-xs font-semibold" style={{ color: primaryColor }}>
        ← Support inbox
      </Link>
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ ...glassStyle(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: pri }}>
            {subject || 'Ticket'}
          </h1>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {userLabel}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={[
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In progress' },
              { value: 'WAITING', label: 'Waiting' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
            isDark={isDark}
            className="w-full"
          />
          <CustomSelect
            value={priority}
            onChange={setPriority}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
            isDark={isDark}
            className="w-full"
          />
        </div>
        <GlassButton
          type="button"
          onClick={() => void patchMeta()}
          style={{ padding: '8px 14px', borderRadius: 12 }}
        >
          Update status
        </GlassButton>

        <div
          className="rounded-xl p-3 space-y-3 max-h-[420px] overflow-auto min-h-[240px]"
          style={{ background: surfaceItem(isDark) }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className="px-3 py-2.5 rounded-xl max-w-[92%]"
              style={{
                marginLeft: m.authorRole === 'SUPERADMIN' ? 'auto' : 0,
                background:
                  m.authorRole === 'SUPERADMIN'
                    ? `rgba(var(--primary-rgb),0.18)`
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
              }}
            >
              <p className="text-[10px] font-bold mb-1" style={{ color: mut }}>
                {m.authorRole === 'SUPERADMIN'
                  ? 'You (Support)'
                  : m.author?.name || m.author?.email || 'User'}{' '}
                · {new Date(m.createdAt).toLocaleString()}
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: pri }}>
                {m.body}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => void sendReply(e)} className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to user…"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border outline-none"
            style={{
              borderColor: borderSubtle(isDark),
              background: isDark ? 'rgba(0,0,0,0.25)' : '#fff',
              color: pri,
            }}
          />
          <GlassButton
            type="submit"
            disabled={busy || !reply.trim()}
            style={{ padding: '8px 16px', borderRadius: 12 }}
          >
            Send
          </GlassButton>
        </form>
      </div>
    </div>
  );
}
