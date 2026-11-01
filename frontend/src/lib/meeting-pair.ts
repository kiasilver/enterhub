export function pairMeetingId(userA: string, userB: string) {
  return `p2p_${[userA, userB].sort().join('_')}`;
}

export function isGroupMeetingId(meetingId: string) {
  return meetingId.startsWith('grp_');
}

export function groupMeetingId(seed?: string) {
  const extra = seed?.replace(/[^a-zA-Z0-9]/g, '').slice(-10) || '';
  return `grp_${extra}${extra ? '_' : ''}${Date.now().toString(36)}`;
}

export function groupMeetingIdForRoom(roomId: string) {
  return `grp_room_${roomId}`;
}

export function formatCallClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
