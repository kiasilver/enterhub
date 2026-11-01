'use client';

import { motion } from 'motion/react';
import { MdCheckCircle, MdFlag } from 'react-icons/md';
import { hexToRgba } from '@/components/SafeDashboard/theme';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Props = {
  isDark: boolean;
  blocked: 'done' | 'milestones' | 'notStarted' | null;
  onFinish: () => void;
};

export function MyTasksEndOfTask({ isDark, blocked, onFinish }: Props) {
  const { t } = useLang();
  if (blocked === 'done') return null;

  const ready = blocked == null;
  const hint =
    blocked === 'notStarted'
      ? t('myTasksPage.finishNeedStart')
      : blocked === 'milestones'
        ? t('myTasksPage.finishNeedMilestones')
        : t('boardTask.endOfTask');

  return (
    <motion.button
      type="button"
      disabled={!ready}
      title={hint}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (ready) onFinish();
      }}
      whileTap={ready ? { scale: 0.97 } : undefined}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold tracking-wide disabled:cursor-not-allowed"
      style={{
        background: ready
          ? isDark
            ? hexToRgba('#22C55E', 0.2)
            : hexToRgba('#22C55E', 0.12)
          : isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(15,23,42,0.04)',
        color: ready ? '#16A34A' : isDark ? '#64748B' : '#94A3B8',
        border: `1px solid ${
          ready ? hexToRgba('#22C55E', 0.45) : hexToRgba('#94A3B8', 0.25)
        }`,
        opacity: ready ? 1 : 0.7,
      }}
    >
      {ready ? <MdCheckCircle size={15} /> : <MdFlag size={14} />}
      {t('boardTask.endOfTask')}
    </motion.button>
  );
}
