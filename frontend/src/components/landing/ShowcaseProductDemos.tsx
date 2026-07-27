'use client';

import { useEffect, useState } from 'react';
import {
  MdAdd,
  MdAttachFile,
  MdBarChart,
  MdCallEnd,
  MdCelebration,
  MdCircle,
  MdClose,
  MdEvent,
  MdLink,
  MdMail,
  MdMic,
  MdMicOff,
  MdPeople,
  MdPlace,
  MdRefresh,
  MdSearch,
  MdScreenShare,
  MdSend,
  MdTag,
  MdTrendingDown,
  MdVideocam,
  MdWarning,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  DEMO_PEOPLE,
  type DemoPresence,
} from './showcase-seed';
import {
  demoChrome,
  localizedCalEvents,
  localizedChat,
  localizedPeople,
  localizedPresence,
  localizedWorkTrends,
} from './showcase-locale';
import { demoTone as tone, DemoAvatar, SHOWCASE_SCROLL } from './demo-ui';
import {
  glassStyle,
  hexToRgba,
  surfaceItem,
  tableRowBg,
} from '@/components/SafeDashboard/theme';

function kindMeta(lang: Parameters<typeof demoChrome>[0]) {
  const c = demoChrome(lang);
  return {
    MEETING: { label: c.meeting, icon: MdVideocam },
    CEREMONY: { label: c.ceremony, icon: MdCelebration },
    REMINDER: { label: c.reminder, icon: MdEvent },
    OTHER: { label: c.event, icon: MdEvent },
    TASK: { label: c.task, icon: MdEvent },
  } as const;
}

function modeLabel(lang: Parameters<typeof demoChrome>[0]) {
  const c = demoChrome(lang);
  return {
    IN_APP: c.inAppMeet,
    IN_PERSON: c.inPerson,
    LINK: c.externalLink,
  } as Record<string, string>;
}

function signalMeta(lang: Parameters<typeof demoChrome>[0]) {
  const c = demoChrome(lang);
  return {
    ok: { label: c.ok, color: '#22c55e' },
    watch: { label: c.watch, color: '#f59e0b' },
    weak_estimate: { label: c.weakEstimate, color: '#ef4444' },
  };
}

export function DemoChatMeetings({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const chatSeed = localizedChat(lang);
  const people = localizedPeople(lang);
  const t = tone(isDark);
  const [room, setRoom] = useState('r2');
  const [messages, setMessages] = useState(chatSeed.messages);
  const [text, setText] = useState('');
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [unread, setUnread] = useState(() => Object.fromEntries(chatSeed.rooms.map((r) => [r.id, r.unread])));
  const [sideQ, setSideQ] = useState('');

  useEffect(() => {
    const seed = localizedChat(lang);
    setMessages(seed.messages);
    setUnread(Object.fromEntries(seed.rooms.map((r) => [r.id, r.unread])));
  }, [lang]);

  const active = chatSeed.rooms.find((r) => r.id === room);
  const visible = messages.filter((m) => m.room === room);
  const channels = chatSeed.rooms.filter((r) => r.type === 'channel');
  const dms = chatSeed.rooms.filter((r) => r.type === 'dm');
  const accent = active?.type === 'dm' ? '#06b6d4' : '#8b5cf6';

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        room,
        from: ui.you,
        initials: 'YO',
        color: '#3B82F6',
        text: body,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        me: true,
      },
    ]);
    setText('');
  };

  const selectRoom = (id: string) => {
    setRoom(id);
    setUnread((u) => ({ ...u, [id]: 0 }));
  };

  return (
    <div
      className="h-full grid grid-cols-1 sm:grid-cols-[minmax(160px,38%)_1fr] lg:grid-cols-[280px_1fr] min-h-0 overflow-hidden"
      style={{ background: t.canvas }}
    >
      <aside
        className={`flex flex-col min-h-0 overflow-hidden max-h-[42%] sm:max-h-none ${SHOWCASE_SCROLL}`}
        style={{ borderRight: `1px solid ${t.border}`, background: t.canvas }}
      >
        <div className="p-2 flex gap-1 flex-shrink-0">
          {[ui.chats, ui.letters, ui.saved].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className="flex-1 rounded-xl px-1 py-1.5 text-[10px] font-bold truncate"
              style={{
                background: i === 0 ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)') : 'transparent',
                color: i === 0 ? '#a78bfa' : t.muted,
                border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.35)' : 'transparent'}`,
              }}
            >
              <span className="sm:hidden">{tab.slice(0, 1)}</span>
              <span className="hidden sm:inline">{tab}</span>
            </button>
          ))}
        </div>
        <div className="px-2 pb-2 flex-shrink-0">
          <div className="relative">
            <MdSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
            <input
              value={sideQ}
              onChange={(e) => setSideQ(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجوی گفتگوها…' : 'Search chats…'}
              className="w-full rounded-xl pl-8 pr-2 py-2 text-[11px] outline-none bg-transparent"
              style={{ border: `1px solid ${t.border}`, color: t.primary }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-3 min-h-0">
          <div>
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>
                Channels
              </p>
              <MdAdd size={14} style={{ color: t.muted }} />
            </div>
            {channels
              .filter((r) => !sideQ || r.name.includes(sideQ.toLowerCase()))
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRoom(r.id)}
                  className="w-full flex items-center gap-2 rounded-xl px-2 py-2 text-left mb-0.5"
                  style={{
                    background: room === r.id ? (isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)') : 'transparent',
                    border: `1px solid ${room === r.id ? 'rgba(139,92,246,0.3)' : 'transparent'}`,
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
                  >
                    <MdTag size={14} />
                  </span>
                  <span className="text-[12px] font-semibold flex-1 truncate" style={{ color: t.primary }}>
                    {r.name}
                  </span>
                  {(unread[r.id] || 0) > 0 && (
                    <span className="text-[9px] font-bold px-1.5 rounded-full text-white" style={{ background: '#8b5cf6' }}>
                      {unread[r.id]}
                    </span>
                  )}
                </button>
              ))}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider px-1 mb-1" style={{ color: t.muted }}>
              Direct
            </p>
            {dms.map((r) => {
              const person = people.find((p) => p.id === r.personId);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRoom(r.id)}
                  className="w-full flex items-center gap-2 rounded-xl px-2 py-2 text-left mb-0.5"
                  style={{
                    background: room === r.id ? (isDark ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.1)') : 'transparent',
                    border: `1px solid ${room === r.id ? 'rgba(6,182,212,0.3)' : 'transparent'}`,
                  }}
                >
                  <DemoAvatar person={person} size={28} online={person?.presence === 'available'} />
                  <span className="text-[12px] font-semibold flex-1 truncate" style={{ color: t.primary }}>
                    {r.name}
                  </span>
                  {(unread[r.id] || 0) > 0 && (
                    <span className="text-[9px] font-bold px-1.5 rounded-full text-white" style={{ background: '#06b6d4' }}>
                      {unread[r.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider px-1 mb-1" style={{ color: t.muted }}>
              Team members
            </p>
            {DEMO_PEOPLE.filter((p) => p.role !== 'Guest').map((p, i) => {
              const lp = people.find((x) => x.id === p.id) || p;
              const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'];
              const c = colors[i % colors.length];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const existing = dms.find((d) => d.personId === p.id);
                    if (existing) selectRoom(existing.id);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-2 py-2 text-left mb-0.5"
                  style={{ border: `1px solid ${t.border}`, opacity: p.presence === 'offline' ? 0.78 : 1 }}
                >
                  <DemoAvatar person={lp} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold truncate" style={{ color: t.primary }}>
                      {lp.name}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: t.muted }}>
                      {lp.role} · {lp.dept}
                    </p>
                  </div>
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                    style={{ background: hexToRgba(c, 0.15), color: c }}
                  >
                    Working · {3 + i}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-h-0 relative overflow-hidden">
        <div
          className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
          style={{
            borderBottom: `1px solid ${t.border}`,
            background: `linear-gradient(90deg, ${hexToRgba(accent, 0.18)}, transparent 70%)`,
          }}
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: hexToRgba(accent, 0.25), color: accent }}
          >
            {active?.type === 'dm' ? <MdPeople size={18} /> : <MdTag size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: t.primary }}>
              {active?.type === 'channel' ? `# ${active.name}` : active?.name}
            </p>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {active?.members} members · Sara is typing…
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInCall(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <MdVideocam size={15} /> Meet
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 ${SHOWCASE_SCROLL}`}>
          {visible.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.me ? 'flex-row-reverse' : ''}`}>
              <DemoAvatar initials={m.initials} size={28} />
              <div
                className="max-w-[78%] rounded-2xl px-3 py-2"
                style={{
                  background: m.me ? hexToRgba(accent, isDark ? 0.28 : 0.14) : surfaceItem(isDark),
                  border: `1px solid ${m.me ? hexToRgba(accent, 0.25) : t.border}`,
                }}
              >
                {!m.me && (
                  <p className="text-[9px] font-bold mb-0.5" style={{ color: t.muted }}>
                    {m.from}
                  </p>
                )}
                <p className="text-[12px] leading-snug" style={{ color: t.primary }}>
                  {m.text}
                </p>
                <p className="text-[9px] mt-1 text-right" style={{ color: t.muted }}>
                  {m.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 flex gap-2 flex-shrink-0 items-end" style={{ borderTop: `1px solid ${t.border}` }}>
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ border: `1px solid ${t.border}`, color: t.muted }}
          >
            <MdAttachFile size={16} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={ui.messagePlaceholder}
            className="flex-1 rounded-xl px-3 py-2.5 text-[12px] outline-none bg-transparent"
            style={{ color: t.primary, border: `1px solid ${t.border}` }}
          />
          <button
            type="button"
            onClick={send}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: accent }}
          >
            <MdSend size={18} />
          </button>
        </div>

        {inCall && (
          <div className="absolute inset-0 z-20 flex flex-col" style={{ background: '#0B1220' }}>
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[12px] font-bold text-white/90 flex-1">Enterhub Meet · HD</p>
              <span className="text-[10px] text-white/50">{people.slice(0, 4).length} {ui.people.toLowerCase()}</span>
              <button
                type="button"
                className="text-[10px] font-bold px-2 py-1 rounded-lg text-white/80"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Copy link
              </button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 p-3">
              {people.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl flex flex-col items-center justify-center gap-2 relative"
                  style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {camOff && p.id === 'p1' ? (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: p.color }}
                    >
                      {p.initials}
                    </div>
                  ) : (
                    <DemoAvatar person={p} size={52} />
                  )}
                  <p className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-black/50 text-white/90">
                    {p.name.split(' ')[0]}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 pb-4">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white"
                style={{ background: muted ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
              >
                {muted ? <MdMicOff size={20} /> : <MdMic size={20} />}
              </button>
              <button
                type="button"
                onClick={() => setCamOff((c) => !c)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10"
              >
                <MdVideocam size={20} />
              </button>
              <button type="button" className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10">
                <MdScreenShare size={20} />
              </button>
              <span className="text-[10px] text-white/40 px-2">1080p</span>
              <button
                type="button"
                onClick={() => setInCall(false)}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white"
              >
                <MdCallEnd size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DemoCalendar({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const kinds = kindMeta(lang);
  const modes = modeLabel(lang);
  const weekdays = [ui.mon, ui.tue, ui.wed, ui.thu, ui.fri, ui.sat, ui.sun];
  const navButtons = [ui.prev, ui.today, ui.next] as const;
  const t = tone(isDark);
  const [day, setDay] = useState(21);
  const [events, setEvents] = useState(() => localizedCalEvents(lang));
  const dayEvents = events.filter((e) => e.day === day).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = events.filter((e) => e.day >= day).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)).slice(0, 5);

  useEffect(() => {
    setEvents(localizedCalEvents(lang));
  }, [lang]);

  const dotsFor = (d: number) => events.filter((e) => e.day === d).slice(0, 4);

  return (
    <div className={`h-full overflow-y-auto min-h-0 ${SHOWCASE_SCROLL}`} style={{ background: t.canvas }}>
      <div className="px-4 pt-3 pb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: t.muted }}>
            Workspaces / Calendar
          </p>
          <h3 className="text-base font-bold" style={{ color: t.primary }}>
            Calendar
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setEvents((prev) => [
              ...prev,
              {
                id: `ev${Date.now()}`,
                day,
                title: 'Team huddle',
                kind: 'MEETING',
                mode: 'IN_APP',
                color: '#8b5cf6',
                time: '15:00',
                end: '15:30',
                zone: 'Enterhub Meet',
                desc: 'Quick sync — seeded locally in this demo.',
                attendees: ['SM'],
                priority: 'Normal',
              },
            ]);
          }}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white"
          style={{ background: '#2563EB' }}
        >
          <MdAdd size={14} /> Schedule Event
        </button>
      </div>

      <div className="px-3 pb-3 grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-[18px] p-3" style={{ background: 'transparent', border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold" style={{ color: t.primary }}>
              July 2026
            </h4>
            <div className="flex gap-1">
              {navButtons.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => label === ui.today && setDay(21)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ border: `1px solid ${t.border}`, color: t.secondary }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold py-1" style={{ color: t.muted }}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const dots = dotsFor(d);
              const selected = d === day;
              const isToday = d === 21;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className="aspect-square rounded-xl text-[11px] font-semibold relative flex flex-col items-center justify-start pt-1.5"
                  style={{
                    background: selected
                      ? hexToRgba('#2563EB', isDark ? 0.28 : 0.12)
                      : 'transparent',
                    color: t.primary,
                    border: `1px solid ${selected ? '#2563EB' : t.border}`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                    style={{
                      background: isToday ? '#2563EB' : 'transparent',
                      color: isToday ? '#fff' : undefined,
                    }}
                  >
                    {d}
                  </span>
                  <span className="flex gap-0.5 mt-0.5 absolute bottom-1">
                    {dots.map((e) => (
                      <span key={e.id} className="w-1 h-1 rounded-full" style={{ background: e.color }} />
                    ))}
                    {events.filter((e) => e.day === d).length > 4 && (
                      <span className="text-[7px] leading-none" style={{ color: t.muted }}>
                        +
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[18px] p-3" style={{ background: 'transparent', border: `1px solid ${t.border}` }}>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: t.primary }}>
                Tue, Jul {day}
              </p>
              <span className="text-[10px]" style={{ color: t.muted }}>
                {dayEvents.length} scheduled
              </span>
            </div>
            {dayEvents.length === 0 ? (
              <div className="py-8 text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ border: `1px dashed ${t.border}`, color: t.muted }}
                >
                  <MdEvent size={22} />
                </div>
                <p className="text-[12px]" style={{ color: t.muted }}>
                  No events scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {dayEvents.map((e) => {
                  const meta = kinds[e.kind as keyof typeof kinds] || kinds.OTHER;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl p-3"
                      style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}` }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: hexToRgba(e.color, 0.18), color: e.color }}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[12px] font-bold" style={{ color: t.primary }}>
                              {e.title}
                            </p>
                            {e.priority && (
                              <span
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background:
                                    e.priority === 'High' || (e.priority as string) === 'بالا'
                                      ? 'rgba(239,68,68,0.15)'
                                      : t.soft,
                                  color:
                                    e.priority === 'High' || (e.priority as string) === 'بالا'
                                      ? '#ef4444'
                                      : t.muted,
                                }}
                              >
                                {e.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] mt-0.5 inline-flex items-center gap-1 flex-wrap" style={{ color: t.muted }}>
                            <span className="inline-flex items-center gap-0.5" style={{ color: e.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                              {meta.label}
                            </span>
                            · {e.time}
                            {e.end ? `–${e.end}` : ''} · {modes[e.mode] || e.mode}
                          </p>
                          {e.zone && (
                            <p className="text-[10px] mt-1 inline-flex items-center gap-1" style={{ color: t.secondary }}>
                              {e.mode === 'LINK' ? <MdLink size={12} /> : <MdPlace size={12} />}
                              {e.zone}
                            </p>
                          )}
                          {e.desc && (
                            <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: t.secondary }}>
                              {e.desc}
                            </p>
                          )}
                          {e.attendees && e.attendees.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {e.attendees.slice(0, 5).map((ini) => (
                                <DemoAvatar key={ini} initials={ini} size={20} />
                              ))}
                              {e.attendees.length > 5 && (
                                <span className="text-[9px]" style={{ color: t.muted }}>
                                  +{e.attendees.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvents((prev) => prev.filter((x) => x.id !== e.id))}
                          style={{ color: t.muted }}
                        >
                          <MdClose size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[18px] p-3" style={{ background: 'transparent', border: `1px solid ${t.border}` }}>
            <p className="text-xs font-bold mb-2" style={{ color: t.primary }}>
              {ui.upcoming}
            </p>
            <div className="space-y-2">
              {upcoming.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setDay(e.day)}
                  className="w-full flex items-center gap-2 text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}` }}
                  >
                    <span className="text-[8px] font-bold" style={{ color: t.muted }}>
                      JUL
                    </span>
                    <span className="text-sm font-bold leading-none" style={{ color: t.primary }}>
                      {e.day}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: t.primary }}>
                      {e.title}
                    </p>
                    <p className="text-[9px]" style={{ color: t.muted }}>
                      {e.time} · {kinds[e.kind as keyof typeof kinds]?.label || e.kind}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DemoTeamGuests({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const presenceLabels = localizedPresence(lang);
  const t = tone(isDark);
  const [people, setPeople] = useState(() => localizedPeople(lang));
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | DemoPresence>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setPeople(localizedPeople(lang));
  }, [lang]);

  const filtered = people.filter((p) => {
    const presence = p.presence || (p.online ? 'available' : 'offline');
    if (filter !== 'all' && presence !== filter) return false;
    if (q && !`${p.name} ${p.email} ${p.dept}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const available = people.filter((p) => p.presence === 'available').length;

  const filters: { id: 'all' | DemoPresence; label: string }[] = [
    { id: 'all', label: ui.all },
    { id: 'available', label: presenceLabels.available.label },
    { id: 'meeting', label: presenceLabels.meeting.label },
    { id: 'away', label: presenceLabels.away.label },
    { id: 'leave', label: presenceLabels.leave.label },
    { id: 'offline', label: presenceLabels.offline.label },
  ];

  return (
    <div className={`h-full overflow-y-auto min-h-0 p-4 space-y-4 ${SHOWCASE_SCROLL}`} style={{ background: t.canvas }}>
      <div>
        <p className="text-[10px] font-medium mb-0.5" style={{ color: t.muted }}>
          Apps / Team
        </p>
        <h3 className="text-base font-bold" style={{ color: t.primary }}>
          Team directory
        </h3>
        <p className="text-[11px] mt-0.5" style={{ color: t.secondary }}>
          {people.length} members · {available} available — click a person for analytics
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] outline-none"
            style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}`, color: t.primary }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold"
              style={{
                background: filter === f.id ? (isDark ? '#1E293B' : '#fff') : surfaceItem(isDark),
                color: filter === f.id ? t.primary : t.muted,
                border: `1px solid ${t.border}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const presence = p.presence || (p.online ? 'available' : 'offline');
          const meta = presenceLabels[presence];
          const isH = hovered === p.id;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-2xl p-4 transition-all duration-200 cursor-default"
              style={{
                background: surfaceItem(isDark),
                border: `1px solid ${isH ? hexToRgba('#2563EB', isDark ? 0.55 : 0.35) : t.border}`,
                boxShadow: isH
                  ? isDark
                    ? `0 0 0 1px ${hexToRgba('#2563EB', 0.25)}, 0 12px 28px rgba(0,0,0,0.35)`
                    : '0 8px 24px rgba(15,23,42,0.1)'
                  : 'none',
                transform: isH ? 'translateY(-2px)' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <DemoAvatar person={p} size={48} />
                  <MdCircle
                    size={12}
                    className="absolute -bottom-0.5 -right-0.5"
                    style={{ color: meta.color }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate" style={{ color: t.primary }}>
                    {p.name}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: t.muted }}>
                    {p.title || p.dept}
                  </p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="text-[11px] mt-1 inline-flex items-center gap-1 truncate" style={{ color: t.secondary }}>
                    <MdMail size={12} />
                    {p.email}
                  </p>
                  <p
                    className="text-[10px] mt-2 inline-flex items-center gap-1"
                    style={{ color: isH ? '#2563EB' : t.muted }}
                  >
                    <MdBarChart size={12} />
                    {p.role} · View analytics
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center py-10 text-sm" style={{ color: t.muted }}>
            No members match
          </p>
        )}
      </div>
    </div>
  );
}

export function DemoWorkTrends({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const trends = localizedWorkTrends(lang);
  const signals = signalMeta(lang);
  const t = tone(isDark);
  const [year, setYear] = useState(2026);
  const [tab, setTab] = useState<'members' | 'creators'>('members');
  const glass = glassStyle(isDark);
  const employees = trends.employees;
  const creators = trends.creators;

  return (
    <div className={`h-full overflow-y-auto min-h-0 px-4 py-4 space-y-4 ${SHOWCASE_SCROLL}`} style={{ background: t.canvas }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: t.primary }}>
            Work trends
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>
            Delays, extensions, and estimate quality — no payroll, only patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-[12px] outline-none bg-transparent"
            style={{ border: `1px solid ${t.border}`, color: t.primary }}
          >
            {[2026, 2025, 2024].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="px-3 py-2 rounded-xl text-[12px] inline-flex items-center gap-1 font-semibold"
            style={{ border: `1px solid ${t.border}`, color: t.secondary }}
          >
            <MdRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="inline-flex p-1 rounded-2xl" style={{ background: t.soft, border: `1px solid ${t.border}` }}>
        {(
          [
            { id: 'members' as const, label: 'All team members' },
            { id: 'creators' as const, label: 'Managers / creators' },
          ] as const
        ).map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{
              background: tab === x.id ? (isDark ? '#1E293B' : '#fff') : 'transparent',
              color: tab === x.id ? t.primary : t.muted,
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'members' ? (
        <section className="rounded-2xl p-4 overflow-x-auto" style={glass}>
          <h4 className="text-sm font-semibold mb-1 inline-flex items-center gap-2" style={{ color: t.primary }}>
            <MdTrendingDown size={18} /> All team members
          </h4>
          <p className="text-[10px] mb-3" style={{ color: t.muted }}>
            Late score: −1 each time a manager marks a delayed task as late. Excused = delay with a reason — no score hit.
          </p>
          <table className="w-full text-left text-[11px] min-w-[680px]">
            <thead>
              <tr>
                {['Person', 'Late score', 'Marked late', 'Excused', 'On time', 'Late %', 'Time requests', 'Approved', 'Extra hours', 'Extra days'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-[9px] font-bold uppercase tracking-wide py-2 pr-3"
                      style={{ color: t.muted, borderBottom: `1px solid ${t.border}` }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {employees.map((row, i) => (
                <tr key={row.id} style={{ background: tableRowBg(isDark, i) }}>
                  <td className="py-2.5 pr-3 font-semibold" style={{ color: t.primary, borderBottom: `1px solid ${t.border}` }}>
                    {row.name}
                  </td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums" style={{ color: row.lateScore < 0 ? '#ef4444' : t.secondary, borderBottom: `1px solid ${t.border}` }}>
                    {row.lateScore}
                  </td>
                  {[row.markedLate, row.excused, row.onTime, `${row.latePct}%`, row.requests, row.approved, row.extraHours, row.extraDays].map(
                    (v, j) => (
                      <td key={j} className="py-2.5 pr-3 tabular-nums" style={{ color: t.secondary, borderBottom: `1px solid ${t.border}` }}>
                        {v}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="rounded-2xl p-4 overflow-x-auto" style={glass}>
          <h4 className="text-sm font-semibold mb-1 inline-flex items-center gap-2" style={{ color: t.primary }}>
            <MdWarning size={18} /> Managers / creators
          </h4>
          <p className="text-[10px] mb-3" style={{ color: t.muted }}>
            Signal flags creators whose tasks need frequent extensions or get charged delays.
          </p>
          <table className="w-full text-left text-[11px] min-w-[620px]">
            <thead>
              <tr>
                {['Creator', 'Tasks', 'Extensions', 'Approved', '+Hours', '+Days', 'Charged delays', 'Signal'].map((h) => (
                  <th
                    key={h}
                    className="text-[9px] font-bold uppercase tracking-wide py-2 pr-3"
                    style={{ color: t.muted, borderBottom: `1px solid ${t.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creators.map((row, i) => {
                const sig = signals[row.signal];
                return (
                  <tr key={row.id} style={{ background: tableRowBg(isDark, i) }}>
                    <td className="py-2.5 pr-3 font-semibold" style={{ color: t.primary, borderBottom: `1px solid ${t.border}` }}>
                      {row.name}
                    </td>
                    {[row.tasks, row.extensions, row.approved, row.extraHours, row.extraDays, row.charged].map((v, j) => (
                      <td key={j} className="py-2.5 pr-3 tabular-nums" style={{ color: t.secondary, borderBottom: `1px solid ${t.border}` }}>
                        {v}
                      </td>
                    ))}
                    <td className="py-2.5 pr-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded-lg"
                        style={{ background: hexToRgba(sig.color, 0.15), color: sig.color }}
                      >
                        {String('signalLabel' in row ? row.signalLabel : sig.label)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
