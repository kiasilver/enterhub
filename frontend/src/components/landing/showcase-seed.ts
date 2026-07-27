export type DemoPresence = 'available' | 'meeting' | 'away' | 'leave' | 'offline';

export type DemoPerson = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  email: string;
  online?: boolean;
  presence?: DemoPresence;
  title?: string;
  dept?: string;
  /** CDN portrait — randomuser.me */
  avatar: string;
};

export const PRESENCE_DEMO: Record<DemoPresence, { label: string; color: string }> = {
  available: { label: 'Available', color: '#22c55e' },
  meeting: { label: 'In a meeting', color: '#8b5cf6' },
  away: { label: 'Away', color: '#f59e0b' },
  leave: { label: 'On leave', color: '#06b6d4' },
  offline: { label: 'Offline', color: '#94a3b8' },
};

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: 'p1', name: 'Sara Mohammadi', initials: 'SM', color: '#2563EB', role: 'Manager', email: 'sara@novabuild.io', online: true, presence: 'available', title: 'Eng Manager', dept: 'Engineering', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 'p2', name: 'Arman Rezaei', initials: 'AR', color: '#8B5CF6', role: 'Supervisor', email: 'arman@novabuild.io', online: true, presence: 'meeting', title: 'Tech Lead', dept: 'Engineering', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'p3', name: 'Leila Karimi', initials: 'LK', color: '#22C55E', role: 'Member', email: 'leila@novabuild.io', online: false, presence: 'away', title: 'Product Designer', dept: 'Product', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 'p4', name: 'Nima Ahmadi', initials: 'NA', color: '#F59E0B', role: 'Member', email: 'nima@novabuild.io', online: true, presence: 'available', title: 'Ops Specialist', dept: 'Operations', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 'p5', name: 'Mira Guest', initials: 'MG', color: '#64748B', role: 'Guest', email: 'mira@partner.co', online: false, presence: 'offline', title: 'Partner', dept: '—', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 'p6', name: 'Omid Farzad', initials: 'OF', color: '#EC4899', role: 'Admin', email: 'omid@novabuild.io', online: true, presence: 'available', title: 'Finance Lead', dept: 'Finance', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
];

export function personByInitials(initials: string): DemoPerson | undefined {
  return DEMO_PEOPLE.find((p) => p.initials === initials);
}

export type BoardCard = {
  id: string;
  title: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  due: string;
  labels: string[];
  assignees: string[];
  checks: { done: number; total: number };
  comments: number;
  files: number;
};

export type BoardColId = 'todo' | 'progress' | 'review' | 'done';

export const INITIAL_BOARD: Record<BoardColId, BoardCard[]> = {
  todo: [
    { id: 'c1', title: 'Wireframe checkout flow', priority: 'HIGH', due: '28 Jul', labels: ['Design', 'UX'], assignees: ['SM', 'AR'], checks: { done: 1, total: 4 }, comments: 3, files: 2 },
    { id: 'c2', title: 'API contract for invoices', priority: 'MEDIUM', due: '30 Jul', labels: ['Backend'], assignees: ['NA'], checks: { done: 0, total: 3 }, comments: 1, files: 0 },
    { id: 'c6', title: 'Empty states for guests', priority: 'LOW', due: '02 Aug', labels: ['Frontend'], assignees: ['LK'], checks: { done: 0, total: 2 }, comments: 0, files: 1 },
  ],
  progress: [
    { id: 'c3', title: 'Kanban drag polish', priority: 'URGENT', due: '27 Jul', labels: ['Frontend'], assignees: ['LK', 'SM'], checks: { done: 3, total: 5 }, comments: 5, files: 1 },
    { id: 'c7', title: 'Presence heartbeat', priority: 'HIGH', due: '28 Jul', labels: ['Realtime'], assignees: ['AR'], checks: { done: 2, total: 4 }, comments: 2, files: 0 },
  ],
  review: [
    { id: 'c4', title: 'Department invite emails', priority: 'HIGH', due: '26 Jul', labels: ['Ops'], assignees: ['AR'], checks: { done: 4, total: 4 }, comments: 2, files: 0 },
  ],
  done: [
    { id: 'c5', title: 'SSO session hardening', priority: 'LOW', due: '24 Jul', labels: ['Security'], assignees: ['NA', 'LK'], checks: { done: 6, total: 6 }, comments: 4, files: 3 },
    { id: 'c8', title: 'Logo assets in public/', priority: 'MEDIUM', due: '23 Jul', labels: ['Brand'], assignees: ['SM'], checks: { done: 2, total: 2 }, comments: 1, files: 4 },
  ],
};

export const BOARD_META: { id: BoardColId; title: string; accent: string }[] = [
  { id: 'todo', title: 'To Do', accent: '#3B82F6' },
  { id: 'progress', title: 'On Process', accent: '#F59E0B' },
  { id: 'review', title: 'On Review', accent: '#F43F5E' },
  { id: 'done', title: 'Completed', accent: '#22C55E' },
];

export type ListTask = {
  id: string;
  title: string;
  board: string;
  status: 'todo' | 'progress' | 'review' | 'done';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  due: string;
  bucket: 'overdue' | 'today' | 'week' | 'later';
  milestones: { id: string; label: string; done: boolean }[];
};

export const INITIAL_MY_TASKS: ListTask[] = [
  { id: 't1', title: 'Review PR #482', board: 'Platform', status: 'todo', priority: 'HIGH', due: 'Today 14:00', bucket: 'today', milestones: [{ id: 'm1', label: 'Read diff', done: false }, { id: 'm2', label: 'Leave notes', done: false }] },
  { id: 't2', title: 'Update billing copy', board: 'Growth', status: 'todo', priority: 'MEDIUM', due: 'Tomorrow', bucket: 'week', milestones: [{ id: 'm1', label: 'Draft', done: false }, { id: 'm2', label: 'Legal check', done: false }] },
  { id: 't3', title: 'Seed demo workspace', board: 'Enterhub', status: 'progress', priority: 'URGENT', due: 'Today 18:00', bucket: 'today', milestones: [{ id: 'm1', label: 'Seed boards', done: true }, { id: 'm2', label: 'Seed analytics', done: false }] },
  { id: 't4', title: 'Meeting overlay QA', board: 'Realtime', status: 'review', priority: 'HIGH', due: 'Yesterday', bucket: 'overdue', milestones: [{ id: 'm1', label: 'AV test', done: true }, { id: 'm2', label: 'Share screen', done: true }] },
  { id: 't5', title: 'Calendar ICS import', board: 'Platform', status: 'progress', priority: 'MEDIUM', due: 'Fri', bucket: 'week', milestones: [{ id: 'm1', label: 'Parse ICS', done: true }, { id: 'm2', label: 'UI polish', done: false }] },
  { id: 't6', title: 'Guest ACL audit', board: 'Security', status: 'todo', priority: 'LOW', due: 'Next week', bucket: 'later', milestones: [{ id: 'm1', label: 'Matrix', done: false }] },
  { id: 't7', title: 'Dept performance export', board: 'Analytics', status: 'done', priority: 'MEDIUM', due: 'Mon', bucket: 'later', milestones: [{ id: 'm1', label: 'CSV', done: true }, { id: 'm2', label: 'Sheets', done: true }] },
  { id: 't8', title: 'Fix mention notifications', board: 'Chat', status: 'review', priority: 'URGENT', due: 'Today 12:00', bucket: 'today', milestones: [{ id: 'm1', label: 'Reproduce', done: true }, { id: 'm2', label: 'Patch', done: true }] },
];

export const DEMO_DEPARTMENTS = [
  { id: 'd1', name: 'Engineering', key: 'ENG', managers: ['Sara Mohammadi'], supervisors: ['Arman Rezaei'], members: 12, boards: 8, open: 18, done: 42, overdue: 4, donePct: 72, color: '#3B82F6' },
  { id: 'd2', name: 'Product', key: 'PRD', managers: ['Leila Karimi'], supervisors: [], members: 6, boards: 4, open: 9, done: 22, overdue: 2, donePct: 64, color: '#8B5CF6' },
  { id: 'd3', name: 'Operations', key: 'OPS', managers: ['Nima Ahmadi'], supervisors: ['Arman Rezaei'], members: 9, boards: 5, open: 14, done: 31, overdue: 5, donePct: 58, color: '#22C55E' },
  { id: 'd4', name: 'Finance', key: 'FIN', managers: ['Omid Farzad'], supervisors: [], members: 4, boards: 2, open: 3, done: 19, overdue: 0, donePct: 81, color: '#F59E0B' },
];

export const DEMO_ANALYTICS = {
  kpis: [
    { label: 'On-time rate', value: '86%', delta: '+4.2%', good: true },
    { label: 'Open delays', value: '12', delta: '-3', good: true },
    { label: 'Extensions', value: '9', delta: '+1', good: false },
    { label: 'Lead balance', value: '74%', delta: 'OK', good: true },
    { label: 'Tasks done', value: '248', delta: '+31', good: true },
    { label: 'Avg cycle', value: '3.4d', delta: '-0.6d', good: true },
  ],
  bars: [
    { name: 'Eng', delay: 18, done: 72, review: 14 },
    { name: 'Prod', delay: 9, done: 41, review: 8 },
    { name: 'Ops', delay: 14, done: 55, review: 11 },
    { name: 'Fin', delay: 4, done: 28, review: 3 },
  ],
  weekly: [
    { day: 'Mon', completed: 18, delayed: 4 },
    { day: 'Tue', completed: 22, delayed: 3 },
    { day: 'Wed', completed: 19, delayed: 5 },
    { day: 'Thu', completed: 27, delayed: 2 },
    { day: 'Fri', completed: 24, delayed: 3 },
    { day: 'Sat', completed: 8, delayed: 1 },
    { day: 'Sun', completed: 5, delayed: 0 },
  ],
  statusMix: [
    { name: 'Done', value: 42, color: '#22C55E' },
    { name: 'Progress', value: 28, color: '#F59E0B' },
    { name: 'Review', value: 18, color: '#F43F5E' },
    { name: 'To Do', value: 12, color: '#3B82F6' },
  ],
  employees: [
    { id: 'p1', name: 'Sara Mohammadi', initials: 'SM', delayRate: 8, onTime: 92, score: 4.6 },
    { id: 'p2', name: 'Arman Rezaei', initials: 'AR', delayRate: 14, onTime: 81, score: 4.2 },
    { id: 'p3', name: 'Leila Karimi', initials: 'LK', delayRate: 6, onTime: 94, score: 4.8 },
    { id: 'p4', name: 'Nima Ahmadi', initials: 'NA', delayRate: 19, onTime: 74, score: 3.9 },
  ],
  lead: [
    { id: 'p1', name: 'Sara M.', tasks: 14, load: 92 },
    { id: 'p2', name: 'Arman R.', tasks: 11, load: 78 },
    { id: 'p3', name: 'Leila K.', tasks: 7, load: 54 },
    { id: 'p4', name: 'Nima A.', tasks: 9, load: 61 },
  ],
};

export const DEMO_CHAT_SEED = {
  rooms: [
    { id: 'r1', name: 'general', unread: 0, type: 'channel' as const, members: 24 },
    { id: 'r2', name: 'engineering', unread: 3, type: 'channel' as const, members: 12 },
    { id: 'r3', name: 'product', unread: 0, type: 'channel' as const, members: 8 },
    { id: 'r4', name: 'Sara Mohammadi', unread: 1, type: 'dm' as const, members: 2, personId: 'p1' },
    { id: 'r5', name: 'Arman Rezaei', unread: 0, type: 'dm' as const, members: 2, personId: 'p2' },
  ],
  messages: [
    { id: 'm1', room: 'r2', from: 'Arman Rezaei', initials: 'AR', color: '#8B5CF6', text: 'Standup in 10 — joining from the board room.', time: '09:12', me: false },
    { id: 'm2', room: 'r2', from: 'You', initials: 'YO', color: '#3B82F6', text: 'Starting an HD meeting — screen share on 1080p.', time: '09:14', me: true },
    { id: 'm3', room: 'r2', from: 'Leila Karimi', initials: 'LK', color: '#22C55E', text: 'On my way. Sharing the kanban for Sprint 24.', time: '09:15', me: false },
    { id: 'm4', room: 'r2', from: 'Nima Ahmadi', initials: 'NA', color: '#F59E0B', text: 'PR #482 is ready for review when you are.', time: '09:18', me: false },
    { id: 'm5', room: 'r4', from: 'Sara Mohammadi', initials: 'SM', color: '#2563EB', text: 'Can you join the Q3 review at 10?', time: '08:55', me: false },
    { id: 'm6', room: 'r1', from: 'Omid Farzad', initials: 'OF', color: '#EC4899', text: 'Company anniversary party is on the calendar — Jul 27.', time: 'Yesterday', me: false },
  ],
};

export const DEMO_MAIL = [
  { id: 'e1', from: 'Sara Mohammadi', subject: 'Q3 board priorities', preview: 'Can we lock the Sprint 24 scope before Thursday standup?', time: '08:40', unread: true, folder: 'inbox' },
  { id: 'e2', from: 'Billing', subject: 'Base plan renewal', preview: 'Your yearly Base plan renews on Aug 12 — seats: 10.', time: 'Yesterday', unread: true, folder: 'inbox' },
  { id: 'e3', from: 'Arman Rezaei', subject: 'Guest access for Mira', preview: 'Shared the Platform board — she needs comment-only.', time: 'Mon', unread: false, folder: 'inbox' },
  { id: 'e4', from: 'You', subject: 'Re: Dept analytics export', preview: 'Exported CSV + Sheets for Ops — attached.', time: 'Sun', unread: false, folder: 'sent' },
];

export type DemoCalKind = 'MEETING' | 'CEREMONY' | 'REMINDER' | 'OTHER' | 'TASK';
export type DemoCalMode = 'IN_APP' | 'IN_PERSON' | 'LINK';

export const DEMO_CAL_EVENTS: {
  id: string;
  day: number;
  title: string;
  kind: DemoCalKind;
  mode: DemoCalMode;
  color: string;
  time: string;
  end?: string;
  zone?: string;
  desc?: string;
  attendees?: string[];
  priority?: 'High' | 'Normal' | 'Low';
}[] = [
  { id: 'ev1', day: 21, title: 'Product review', kind: 'MEETING', mode: 'IN_APP', color: '#8b5cf6', time: '10:00', end: '10:45', zone: 'Enterhub Meet', desc: 'Sprint 24 scope lock with Product + Eng leads.', attendees: ['SM', 'LK', 'AR'], priority: 'High' },
  { id: 'ev2', day: 21, title: 'PR #482 review block', kind: 'TASK', mode: 'IN_APP', color: '#3b82f6', time: '14:00', end: '15:00', zone: 'Platform board', desc: 'Due on Platform · assigned to you.', attendees: ['NA'], priority: 'High' },
  { id: 'ev3', day: 21, title: 'Design critique', kind: 'MEETING', mode: 'IN_PERSON', color: '#8b5cf6', time: '16:30', end: '17:15', zone: 'Floor 3 · Studio', desc: 'Walk through checkout wireframes.', attendees: ['LK', 'SM'], priority: 'Normal' },
  { id: 'ev4', day: 22, title: 'Client site visit', kind: 'MEETING', mode: 'IN_PERSON', color: '#8b5cf6', time: '11:30', end: '13:00', zone: 'Nova HQ · Gate B', desc: 'Ops walkthrough with Mira (guest).', attendees: ['NA', 'MG'], priority: 'High' },
  { id: 'ev5', day: 24, title: 'Board deadline', kind: 'TASK', mode: 'IN_APP', color: '#3b82f6', time: '18:00', zone: 'Growth board', desc: 'Invoice API contract due.', priority: 'High' },
  { id: 'ev6', day: 25, title: 'Submit Q3 expense reports', kind: 'REMINDER', mode: 'IN_APP', color: '#f59e0b', time: '09:00', zone: 'Finance', desc: 'Soft reminder — no meeting.', priority: 'Low' },
  { id: 'ev7', day: 27, title: 'Company anniversary', kind: 'CEREMONY', mode: 'IN_PERSON', color: '#ec4899', time: '16:00', end: '19:00', zone: 'Rooftop terrace', desc: 'Celebration · cake, awards, and guest partners.', attendees: ['SM', 'AR', 'LK', 'NA', 'OF', 'MG'], priority: 'Normal' },
  { id: 'ev8', day: 27, title: 'All-hands livestream', kind: 'MEETING', mode: 'LINK', color: '#8b5cf6', time: '15:00', end: '15:45', zone: 'meet.enterhub.app/allhands', desc: 'Join via external link if you cannot attend in person.', attendees: ['OF'], priority: 'Normal' },
  { id: 'ev9', day: 29, title: 'Lead sync', kind: 'MEETING', mode: 'IN_APP', color: '#8b5cf6', time: '09:30', end: '10:00', zone: 'Enterhub Meet', desc: 'Rebalance overloaded assignees.', attendees: ['SM', 'AR'], priority: 'High' },
];

export const DEMO_SHEETS_LOG = [
  { id: 's1', name: 'Engineering Board Export', when: '2h ago', dir: 'export' as const },
  { id: 's2', name: 'My Tasks — July', when: 'Yesterday', dir: 'export' as const },
  { id: 's3', name: 'Import · Backlog Sheet', when: '3 days ago', dir: 'import' as const },
];

export const DEMO_TRENDS = [
  { month: 'Feb', delay: 22, extension: 10 },
  { month: 'Mar', delay: 19, extension: 12 },
  { month: 'Apr', delay: 17, extension: 9 },
  { month: 'May', delay: 14, extension: 11 },
  { month: 'Jun', delay: 12, extension: 8 },
  { month: 'Jul', delay: 10, extension: 7 },
];

/** Mirrors WorkTrendsClient tables */
export const DEMO_WORK_TRENDS = {
  employees: [
    { id: 'p1', name: 'Sara Mohammadi', lateScore: -1, markedLate: 1, excused: 2, onTime: 48, latePct: 2, requests: 3, approved: 3, extraHours: 6, extraDays: 1 },
    { id: 'p2', name: 'Arman Rezaei', lateScore: -3, markedLate: 3, excused: 1, onTime: 39, latePct: 7, requests: 5, approved: 4, extraHours: 12, extraDays: 2 },
    { id: 'p3', name: 'Leila Karimi', lateScore: 0, markedLate: 0, excused: 1, onTime: 44, latePct: 0, requests: 2, approved: 2, extraHours: 4, extraDays: 0 },
    { id: 'p4', name: 'Nima Ahmadi', lateScore: -5, markedLate: 5, excused: 3, onTime: 28, latePct: 14, requests: 8, approved: 5, extraHours: 18, extraDays: 3 },
    { id: 'p6', name: 'Omid Farzad', lateScore: 0, markedLate: 0, excused: 0, onTime: 21, latePct: 0, requests: 1, approved: 1, extraHours: 2, extraDays: 0 },
  ],
  creators: [
    { id: 'p1', name: 'Sara Mohammadi', tasks: 86, extensions: 9, approved: 7, extraHours: 14, extraDays: 2, charged: 2, signal: 'ok' as const },
    { id: 'p2', name: 'Arman Rezaei', tasks: 64, extensions: 18, approved: 11, extraHours: 28, extraDays: 5, charged: 6, signal: 'watch' as const },
    { id: 'p6', name: 'Omid Farzad', tasks: 22, extensions: 12, approved: 4, extraHours: 20, extraDays: 6, charged: 8, signal: 'weak_estimate' as const },
  ],
};

export const DEMO_CHECKLIST_CARDS = [
  { id: 'ck1', title: 'Ship landing showcase', status: 'progress', priority: 'HIGH' as const },
  { id: 'ck2', title: 'Approve invite emails', status: 'review', priority: 'URGENT' as const },
  { id: 'ck3', title: 'SSO hardening follow-up', status: 'todo', priority: 'MEDIUM' as const },
];

export const DEMO_RBAC_MATRIX = [
  { role: 'Owner', flags: [true, true, true, true, true, true] },
  { role: 'Admin', flags: [true, true, true, true, true, false] },
  { role: 'Manager', flags: [true, true, true, false, true, false] },
  { role: 'Member', flags: [true, true, false, false, false, false] },
  { role: 'Guest', flags: [true, false, false, false, false, false] },
];

export const RBAC_COLS = ['Boards', 'Chat', 'Members', 'Billing', 'Analytics', 'Transfer'];

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: 'Urgent', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  HIGH: { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  MEDIUM: { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  LOW: { label: 'Low', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
};
