/** Meetings / live stream run on live.ireg for every workspace member. */
export type MeetingPlanTier = 'FREE' | 'PRO' | 'ENTERPRISE' | string;

export function canUseMeetings(_planTier?: MeetingPlanTier | null): boolean {
  return true;
}

export type ScreenShareQuality = '720p' | '1080p';

export const SCREEN_SHARE_CONSTRAINTS: Record<
  ScreenShareQuality,
  MediaTrackConstraints
> = {
  '720p': {
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
  '1080p': {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
  },
};

export function meetingRoomId(workspaceId: string, chatRoomId: string) {
  return `meet_${workspaceId}_${chatRoomId}`;
}
