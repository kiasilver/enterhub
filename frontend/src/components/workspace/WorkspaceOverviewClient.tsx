'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import SafeStatsRow from '@/components/SafeDashboard/SafeStatsRow';
import SafeActivityFeed from '@/components/SafeDashboard/SafeActivityFeed';

export function WorkspaceOverviewClient({
  boardCount,
  memberCount,
}: {
  boardCount: number;
  memberCount: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  void boardCount;
  void memberCount;
  return (
    <div className="space-y-4 -mx-2">
      <SafeStatsRow isDark={isDark} />
      <div className="max-h-64 overflow-auto rounded-2xl">
        <SafeActivityFeed isDark={isDark} />
      </div>
    </div>
  );
}
