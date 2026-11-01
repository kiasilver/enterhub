'use client';

import { AnimatePresence, motion } from 'motion/react';
import { MdCheck } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { hexToRgba } from '@/components/SafeDashboard/theme';

/**
 * Coalesced autosave chip for modal headers — Priority-pill look,
 * smooth enter/exit. Parent should call `pulse()` on each successful save;
 * rapid saves only extend the visible window (no spam re-animation).
 */
export function AutosaveToast({
  open,
  isDark,
}: {
  open: boolean;
  isDark: boolean;
}) {
  const { t } = useLang();
  const accent = '#16A34A';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="autosave-toast"
          initial={{ opacity: 0, y: -10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.6 }}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 pointer-events-none"
          style={{
            color: accent,
            background: isDark
              ? hexToRgba(accent, 0.18)
              : hexToRgba(accent, 0.12),
            border: `1px solid ${hexToRgba(accent, isDark ? 0.4 : 0.28)}`,
            boxShadow: isDark
              ? '0 4px 14px rgba(0,0,0,0.25)'
              : '0 4px 12px rgba(22,163,74,0.12)',
          }}
          role="status"
          aria-live="polite"
        >
          <MdCheck size={14} />
          {t('common.saved')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
