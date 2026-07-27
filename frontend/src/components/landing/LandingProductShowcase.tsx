'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MdAnalytics,
  MdAssignment,
  MdBusiness,
  MdChat,
  MdEvent,
  MdGroups,
  MdInsights,
  MdMeetingRoom,
  MdSyncAlt,
  MdTaskAlt,
  MdViewKanban,
  MdVpnKey,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { landingSurface, landingText } from './landing-theme';
import {
  DemoAnalytics,
  DemoCalendar,
  DemoChatMeetings,
  DemoChecklists,
  DemoDepartments,
  DemoMessaging,
  DemoMyTasks,
  DemoProjects,
  DemoSecurity,
  DemoSheets,
  DemoTeamGuests,
  DemoWorkTrends,
} from './ShowcaseDemos';

export type ShowcaseId =
  | 'projects'
  | 'my-tasks'
  | 'departments'
  | 'analytics'
  | 'chat'
  | 'calendar'
  | 'sheets'
  | 'team'
  | 'messaging'
  | 'trends'
  | 'checklists'
  | 'security';

type FeatureMsgKey =
  | 'projects'
  | 'myTasks'
  | 'departments'
  | 'analytics'
  | 'chat'
  | 'calendar'
  | 'sheets'
  | 'team'
  | 'messaging'
  | 'trends'
  | 'checklists'
  | 'security';

const FEATURES: {
  id: ShowcaseId;
  msgKey: FeatureMsgKey;
  Icon: typeof MdViewKanban;
}[] = [
  { id: 'projects', msgKey: 'projects', Icon: MdViewKanban },
  { id: 'my-tasks', msgKey: 'myTasks', Icon: MdTaskAlt },
  { id: 'departments', msgKey: 'departments', Icon: MdBusiness },
  { id: 'analytics', msgKey: 'analytics', Icon: MdAnalytics },
  { id: 'chat', msgKey: 'chat', Icon: MdMeetingRoom },
  { id: 'calendar', msgKey: 'calendar', Icon: MdEvent },
  { id: 'sheets', msgKey: 'sheets', Icon: MdSyncAlt },
  { id: 'team', msgKey: 'team', Icon: MdGroups },
  { id: 'messaging', msgKey: 'messaging', Icon: MdChat },
  { id: 'trends', msgKey: 'trends', Icon: MdInsights },
  { id: 'checklists', msgKey: 'checklists', Icon: MdAssignment },
  { id: 'security', msgKey: 'security', Icon: MdVpnKey },
];

function DemoFor({ id, isDark }: { id: ShowcaseId; isDark: boolean }) {
  switch (id) {
    case 'projects':
      return <DemoProjects isDark={isDark} />;
    case 'my-tasks':
      return <DemoMyTasks isDark={isDark} />;
    case 'departments':
      return <DemoDepartments isDark={isDark} />;
    case 'analytics':
      return <DemoAnalytics isDark={isDark} />;
    case 'chat':
      return <DemoChatMeetings isDark={isDark} />;
    case 'calendar':
      return <DemoCalendar isDark={isDark} />;
    case 'sheets':
      return <DemoSheets isDark={isDark} />;
    case 'team':
      return <DemoTeamGuests isDark={isDark} />;
    case 'messaging':
      return <DemoMessaging isDark={isDark} />;
    case 'trends':
      return <DemoWorkTrends isDark={isDark} />;
    case 'checklists':
      return <DemoChecklists isDark={isDark} />;
    case 'security':
      return <DemoSecurity isDark={isDark} />;
    default:
      return null;
  }
}

/** Per-feature chrome so the stage itself changes, not only the inner panel */
function StageChrome({
  id,
  isDark,
  children,
}: {
  id: ShowcaseId;
  isDark: boolean;
  children: React.ReactNode;
}) {
  const base = isDark ? '#0F172A' : '#F1F5F9';
  // Only kanban demos need overflow-visible for drag clones; others clip to the rounded stage
  const allowBleed = id === 'projects' || id === 'my-tasks';
  const shell = `h-full min-h-[400px] xs:min-h-[460px] sm:min-h-[560px] relative eh-showcase-stage ${
    allowBleed ? 'overflow-x-auto overflow-y-visible' : 'overflow-hidden'
  }`;

  return (
    <div className={shell} style={{ background: base }}>
      {children}
    </div>
  );
}

export function LandingProductShowcase({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t } = useLang();
  const [active, setActive] = useState<ShowcaseId>('projects');
  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0];
  const title = t(`showcase.features.${current.msgKey}.title`);
  const desc = t(`showcase.features.${current.msgKey}.desc`);
  const layout = t(`showcase.features.${current.msgKey}.layout`);

  return (
    <section id="features" className="scroll-mt-28 pt-24 sm:pt-32 pb-8 sm:pb-12">
      <div className="text-center mb-10 sm:mb-14 mt-2 sm:mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: colors.accent }}>
          {t('showcase.eyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.primary }}>
          {t('showcase.title')}
        </h2>
        <p className="text-base sm:text-lg max-w-2xl mx-auto px-2" style={{ color: colors.secondary }}>
          {t('showcase.subtitle')}
        </p>
      </div>

      {/* Horizontal feature strip — different from vertical list */}
      <div className="mb-4 -mx-1 px-1 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {FEATURES.map(({ id, msgKey, Icon }) => {
            const selected = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[12px] font-semibold min-h-[44px] transition-all duration-200"
                style={{
                  background: selected ? (isDark ? '#fff' : '#0a0a0a') : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: selected ? (isDark ? '#0a0a0a' : '#fff') : colors.secondary,
                  border: `1px solid ${selected ? 'transparent' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <Icon size={16} />
                {t(`showcase.features.${msgKey}.title`)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`rounded-2xl sm:rounded-3xl backdrop-blur-xl min-w-0 ${
          active === 'projects' || active === 'my-tasks' ? 'overflow-x-auto overflow-y-visible' : 'overflow-hidden'
        }`}
        style={{
          ...landingSurface(isDark),
          background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
        }}
      >
        {/* Meta bar changes copy per feature */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background:
              active === 'chat'
                ? isDark
                  ? '#020617'
                  : '#0F172A'
                : isDark
                  ? 'rgba(15,23,42,0.95)'
                  : 'rgba(248,250,252,0.95)',
          }}
        >
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/90" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-bold truncate"
              style={{ color: active === 'chat' ? '#F8FAFC' : colors.primary }}
            >
              {title}
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: active === 'chat' ? 'rgba(255,255,255,0.5)' : colors.muted }}
            >
              {layout} · {desc}
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{
              background: 'rgba(34,197,94,0.15)',
              color: '#22C55E',
            }}
          >
            {t('showcase.tryIt')}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22 }}
          >
            <StageChrome id={active} isDark={isDark}>
              <DemoFor id={active} isDark={isDark} />
            </StageChrome>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
