'use client';

import { motion, type Variants } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  glassStyle,
} from '@/components/SafeDashboard/theme';
import { PRESENCE_META, type PresenceStatus } from '@/lib/presence';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { AccountAvatar } from '@/components/account/AccountAvatar';

export const accountContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const accountFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

export type AccountTab = 'profile' | 'settings' | 'notifications' | 'help';

export function AccountShell({
  isDark,
  active,
  onTab,
  displayName,
  email,
  subtitle,
  avatarUrl,
  presenceStatus = 'available',
  onAvatarChange,
  children,
}: {
  isDark: boolean;
  active: AccountTab;
  onTab: (tab: AccountTab) => void;
  displayName: string;
  email?: string;
  subtitle?: string;
  avatarUrl?: string | null;
  presenceStatus?: PresenceStatus | 'offline';
  onAvatarChange?: (url: string | null) => void;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const tabs: { id: AccountTab; label: string }[] = [
    { id: 'profile', label: t('account.profile') },
    { id: 'settings', label: t('account.settingsTab') },
    { id: 'notifications', label: t('account.notificationsTab') },
    { id: 'help', label: t('account.helpTab') },
  ];
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const dot =
    presenceStatus === 'offline'
      ? '#94a3b8'
      : PRESENCE_META[presenceStatus]?.color || '#22c55e';

  return (
    <div
      className="h-full w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 xs:px-4 sm:px-6 3xl:px-8 py-5 sm:py-7 pb-12"
      style={{ scrollbarWidth: 'thin' }}
    >
      <motion.div
        className="w-full max-w-5xl 3xl:max-w-6xl mx-auto space-y-5 min-w-0"
        variants={accountContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={accountFadeUp}
          className="relative rounded-3xl overflow-hidden"
          style={glassStyle(isDark)}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(75% 130% at 0% 0%, ${primaryColor}30, transparent 55%), radial-gradient(65% 120% at 100% 0%, ${primaryColor}1c, transparent 50%)`,
            }}
          />
          <div className="relative px-4 sm:px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <AccountAvatar
              isDark={isDark}
              avatarUrl={avatarUrl}
              initials={initials || '?'}
              presenceColor={dot}
              onChanged={(url) => onAvatarChange?.(url)}
            />
            <div className="flex-1 min-w-0">
              <h2
                className="text-xl font-bold truncate"
                style={{ color: pri, letterSpacing: '-0.01em' }}
              >
                {displayName}
              </h2>
              <p className="text-[13px] font-medium mt-1 truncate" style={{ color: sec }}>
                {subtitle || email || t('topbar.account')}
              </p>
            </div>
          </div>

          <div
            className="relative flex items-center gap-0.5 px-3 overflow-x-auto no-scrollbar"
            style={{ borderTop: `1px solid ${border}` }}
          >
            {tabs.map((tab) => {
              const on = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTab(tab.id)}
                  className="relative px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors"
                  style={{ color: on ? pri : mut }}
                >
                  {tab.label}
                  {on && (
                    <motion.span
                      layoutId="ws-account-tab-underline"
                      className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full"
                      style={{ background: primaryColor }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {children}
      </motion.div>
    </div>
  );
}
