export type DeptMember = {
  userId: string;
  role: 'MANAGER' | 'SUPERVISOR' | 'MEMBER';
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
};

export type DeptPerson = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type DeptRichCard = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  startDate?: string | null;
  priority: string;
  workflowStatus: string;
  startedAt?: string | null;
  estimatedHours?: number | null;
  listId: string;
  listTitle: string;
  assignees: DeptPerson[];
  supervisor?: DeptPerson | null;
  createdBy?: DeptPerson | null;
  labels: { id: string; name: string; color: string }[];
  checklist: {
    done: number;
    total: number;
    progressPct: number;
    items: { id: string; title: string; isDone: boolean; description?: string | null }[];
  };
  commentCount?: number;
  attachmentCount?: number;
};

export type DeptProject = {
  id: string;
  name: string;
  isGeneral?: boolean;
  coverColor: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  visibility?: string;
  completionPct: number;
  cardCount: number;
  doneCount?: number;
  cards: DeptRichCard[];
  canDelete?: boolean;
};

export type DeptData = {
  id: string;
  key: string;
  name: string;
  color: string;
  icon?: string;
  archivedAt?: string | null;
  members: DeptMember[];
  projects: DeptProject[];
  canManageMembers: boolean;
  canManage?: boolean;
  canCreateBoard?: boolean;
  canCreateTask?: boolean;
};
