'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { CheckCircle, Info, AlertTriangle, AlertCircle, X, ArrowRight, Bell } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import GlassButton from './GlassButton';

interface Props {
  isDark: boolean;
}

type Variant = 'success' | 'info' | 'warning' | 'error';

const ALERTS: Record<Variant, { color: string; Icon: React.ElementType; label: string; title: string; message: string }> = {
  success: { color: '#10b981', Icon: CheckCircle, label: 'Success', title: 'Inspection passed', message: 'Facility Alpha cleared the quarterly safety audit with a 98% score.' },
  info: { color: '#0ea5e9', Icon: Info, label: 'Info', title: 'Scheduled maintenance', message: 'A system update is planned for Sunday, 02:00–04:00 UTC.' },
  warning: { color: '#f59e0b', Icon: AlertTriangle, label: 'Warning', title: 'PPE compliance gap', message: 'Three workers on Floor 2 were flagged for missing protective equipment.' },
  error: { color: '#ef4444', Icon: AlertCircle, label: 'Critical', title: 'Gas leak detected', message: 'Sensor 12 in Storage Room 3 reports abnormal readings. Evacuate the area.' },
};

const ORDER: Variant[] = ['success', 'info', 'warning', 'error'];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

// Calm icon tile: no looping motion — just a gentle scale when its row is hovered.
function AlertIcon({ v, solid, size = 36 }: { v: Variant; solid?: boolean; size?: number }) {
  const { primaryColor } = useTheme();
  const a = ALERTS[v];
  const color = a.color;
  const Icon = a.Icon;
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-110"
      style={{ width: size, height: size, background: solid ? 'rgba(255,255,255,0.18)' : `${color}1f`, color: solid ? '#ffffff' : color }}
    >
      <Icon size={Math.round(size * 0.47)} />
    </div>
  );
}

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-9">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>{desc}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </motion.section>
  );
}

export default function SafeAlerts({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const alertColor = (v: Variant) => ALERTS[v].color;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [softVisible, setSoftVisible] = useState<Variant[]>(ORDER);
  const [showBanner, setShowBanner] = useState(true);

  // Live demo: triggered alerts that slide in and auto-dismiss (no perpetual motion).
  const [live, setLive] = useState<{ id: number; v: Variant }[]>([]);
  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const triggerLive = () => {
    const id = ++idRef.current;
    const v = ORDER[(id - 1) % ORDER.length];
    setLive((prev) => [{ id, v }, ...prev].slice(0, 4));
    const t = setTimeout(() => setLive((prev) => prev.filter((x) => x.id !== id)), 4500);
    timers.current.push(t);
  };
  const removeLive = (id: number) => setLive((prev) => prev.filter((x) => x.id !== id));

  // Gentle, slow row-hover lift (smooth, not springy/jumpy).
  const hoverLift = { y: -2, transition: { duration: 0.25, ease: 'easeOut' } } as const;

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Base UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Alerts</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Contextual feedback messages for typical user actions, in the four severity levels.</p>
      </motion.div>

      <div className="max-w-3xl">

        {/* ── Featured critical banner ── */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              variants={item}
              layout
              exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-2xl p-5 mb-9 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{
                ...glassStyle(isDark),
                background: `linear-gradient(120deg, ${ALERTS.error.color}24, ${ALERTS.error.color}08)`,
                borderColor: `${ALERTS.error.color}40`,
              }}
            >
              {/* soft decorative glow */}
              <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: `${ALERTS.error.color}22`, filter: 'blur(40px)' }} />

              <AlertIcon v="error" size={44} />

              <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ALERTS.error.color, boxShadow: `0 0 8px ${ALERTS.error.color}` }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ALERTS.error.color }}>Critical</span>
                </div>
                <p className="text-base font-bold" style={{ color: pri }}>Gas leak detected in Storage Room 3</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>Sensor 12 is reporting abnormal readings. Evacuate the area and dispatch the response team immediately.</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 relative">
                <GlassButton variant="danger" hoverVariant="danger" style={{ padding: '9px 16px', borderRadius: '10px' }}>
                  Acknowledge
                </GlassButton>
                <button
                  aria-label="Dismiss"
                  onClick={() => setShowBanner(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: mut }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1 ── Soft / dismissible ── */}
        <Section title="Soft alerts" desc="Tinted, dismissible alerts. Close one and use Reset to bring them all back." isDark={isDark}>
          <AnimatePresence mode="popLayout">
            {softVisible.map((v) => {
              const a = ALERTS[v];
              return (
                <motion.div
                  key={v}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  whileHover={hoverLift}
                  className="group flex items-start gap-3.5 p-4 rounded-xl"
                  style={{ background: `${alertColor(v)}14`, border: `1px solid ${alertColor(v)}33` }}
                >
                  <AlertIcon v={v} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: pri }}>{a.title}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${alertColor(v)}22`, color: alertColor(v) }}>{a.label}</span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>{a.message}</p>
                  </div>
                  <button
                    aria-label="Dismiss"
                    onClick={() => setSoftVisible((prev) => prev.filter((x) => x !== v))}
                    className="p-1 rounded-md transition-colors flex-shrink-0"
                    style={{ color: mut }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {softVisible.length < ORDER.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassButton onClick={() => setSoftVisible(ORDER)} style={{ padding: '7px 14px', borderRadius: '10px' }}>
                Reset alerts
              </GlassButton>
            </motion.div>
          )}
        </Section>

        {/* 2 ── Bordered (left-accent) ── */}
        <Section title="Bordered alerts" desc="A solid accent bar keeps the severity scannable at a glance." isDark={isDark}>
          {ORDER.map((v) => {
            const a = ALERTS[v];
            return (
              <motion.div
                key={v}
                whileHover={hoverLift}
                className="group relative flex items-start gap-3.5 p-4 pl-5 rounded-xl overflow-hidden"
                style={glassStyle(isDark)}
              >
                <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: alertColor(v) }} />
                <AlertIcon v={v} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold" style={{ color: pri }}>{a.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>{a.message}</p>
                </div>
              </motion.div>
            );
          })}
        </Section>

        {/* 3 ── Solid ── */}
        <Section title="Solid alerts" desc="Filled, high-emphasis alerts for messages that must not be missed." isDark={isDark}>
          {ORDER.map((v) => {
            const a = ALERTS[v];
            return (
              <motion.div
                key={v}
                whileHover={hoverLift}
                className="group flex items-start gap-3.5 p-4 rounded-xl"
                style={{ background: alertColor(v) }}
              >
                <AlertIcon v={v} solid />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{a.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>{a.message}</p>
                </div>
              </motion.div>
            );
          })}
        </Section>

        {/* 4 ── With actions ── */}
        <Section title="Alert with actions" desc="Pair a message with the next step the user can take." isDark={isDark}>
          <motion.div
            whileHover={hoverLift}
            className="group relative flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 pl-5 rounded-xl overflow-hidden"
            style={glassStyle(isDark)}
          >
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: ALERTS.warning.color }} />
            <AlertIcon v="warning" />
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold" style={{ color: pri }}>Audit due in 3 days</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>The Sector 4 compliance audit is approaching its deadline. Review the checklist to stay on track.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: sec }}
                onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = sec; }}
              >
                Dismiss
              </button>
              <GlassButton style={{ padding: '8px 14px', borderRadius: '10px' }}>Review checklist</GlassButton>
            </div>
          </motion.div>
        </Section>

        {/* 5 ── Additional content ── */}
        <Section title="Additional content" desc="Alerts can carry a heading, supporting copy, a list, and their own actions." isDark={isDark}>
          <motion.div
            whileHover={hoverLift}
            className="group rounded-xl p-5"
            style={{ background: `${ALERTS.success.color}14`, border: `1px solid ${ALERTS.success.color}33` }}
          >
            <div className="flex items-start gap-3.5">
              <AlertIcon v="success" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: pri }}>Audit completed successfully</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>All 42 checkpoints in Facility Alpha passed inspection. A detailed report has been generated and shared with the compliance team.</p>
                <ul className="text-xs mt-3 space-y-1.5" style={{ color: sec }}>
                  {['Fire suppression systems verified', 'Emergency exits unobstructed', 'PPE compliance at 100%'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: ALERTS.success.color }} /> {t}
                    </li>
                  ))}
                </ul>
                <div className="h-px my-4" style={{ background: `${ALERTS.success.color}33` }} />
                <div className="flex items-center gap-2">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-transform active:scale-95" style={{ background: ALERTS.success.color }}>
                    View report
                  </button>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: ALERTS.success.color }}>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* 6 ── Label, icon & arrow ── */}
        <Section title="Label, icon & arrow" desc="Compact, clickable alerts that lead somewhere — the arrow nudges on hover." isDark={isDark}>
          {ORDER.map((v) => {
            const a = ALERTS[v];
            return (
              <motion.button
                key={v}
                whileHover={hoverLift}
                className="group flex items-center gap-3 p-3 rounded-xl text-left w-full"
                style={{ background: `${alertColor(v)}14`, border: `1px solid ${alertColor(v)}33` }}
              >
                <AlertIcon v={v} size={32} />
                <span className="flex-1 min-w-0 text-sm font-semibold truncate" style={{ color: pri }}>{a.title}</span>
                <ArrowRight size={16} style={{ color: alertColor(v) }} className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>
            );
          })}
        </Section>

        {/* 7 ── Rounded label ── */}
        <Section title="Rounded label" desc="Pill-shaped alerts for short, inline status messages." isDark={isDark}>
          <div className="flex flex-wrap gap-2.5">
            {ORDER.map((v) => {
              const a = ALERTS[v];
              const Icon = a.Icon;
              return (
                <motion.div
                  key={v}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="group inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full"
                  style={{ background: `${alertColor(v)}14`, border: `1px solid ${alertColor(v)}33` }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${alertColor(v)}26`, color: alertColor(v) }}>
                    <Icon size={13} />
                  </span>
                  <span className="text-xs font-semibold" style={{ color: pri }}>{a.label}: {a.title}</span>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* 8 ── Top border & outline ── */}
        <Section title="Top border & outline" desc="An outlined card with a coloured top bar for a lighter, framed look." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ORDER.map((v) => {
              const a = ALERTS[v];
              return (
                <motion.div
                  key={v}
                  whileHover={hoverLift}
                  className="group relative rounded-xl p-4 pt-5 overflow-hidden"
                  style={{ background: 'transparent', border: `1px solid ${border}` }}
                >
                  <span className="absolute top-0 left-0 right-0 h-1" style={{ background: alertColor(v) }} />
                  <div className="flex items-start gap-3">
                    <AlertIcon v={v} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: pri }}>{a.title}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>{a.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* 9 ── Outline ── */}
        <Section title="Outline" desc="Border-only alerts that stay quiet until they're needed." isDark={isDark}>
          {ORDER.map((v) => {
            const a = ALERTS[v];
            return (
              <motion.div
                key={v}
                whileHover={hoverLift}
                className="group flex items-start gap-3.5 p-4 rounded-xl"
                style={{ background: 'transparent', border: `1px solid ${alertColor(v)}` }}
              >
                <AlertIcon v={v} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold" style={{ color: pri }}>{a.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: sec }}>{a.message}</p>
                </div>
              </motion.div>
            );
          })}
        </Section>

        {/* 10 ── Live alert example ── */}
        <Section title="Live alert example" desc="Trigger a real-time alert — it slides in, stacks, and dismisses itself after a few seconds." isDark={isDark}>
          <div className="flex items-center gap-3">
            <GlassButton onClick={triggerLive} style={{ padding: '9px 16px', borderRadius: '10px' }}>
              <Bell size={15} /> Trigger live alert
            </GlassButton>
            {live.length > 0 && (
              <button
                onClick={() => setLive([])}
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: mut }}
                onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {live.map(({ id, v }) => {
                const a = ALERTS[v];
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, x: 40, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="group flex items-start gap-3.5 p-4 rounded-xl"
                    style={{ ...glassStyle(isDark), borderColor: `${alertColor(v)}55` }}
                  >
                    <AlertIcon v={v} size={32} />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold" style={{ color: pri }}>{a.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: sec }}>{a.message}</p>
                    </div>
                    <button
                      aria-label="Dismiss"
                      onClick={() => removeLive(id)}
                      className="p-1 rounded-md transition-colors flex-shrink-0"
                      style={{ color: mut }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {live.length === 0 && (
              <p className="text-xs" style={{ color: mut }}>No live alerts yet — press the button to simulate one.</p>
            )}
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
