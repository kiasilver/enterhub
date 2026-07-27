import { prisma } from "@/lib/prisma";
import type { DepartmentKey } from "@/lib/enterprise-positions";
import { hasPermission } from "@/lib/rbac";
import {
  DEPT_COLORS,
  DEPT_ICONS,
  departmentLabel,
  departmentColor,
  departmentIcon,
} from "@/lib/department-meta";

export {
  DEPT_COLORS,
  DEPT_ICONS,
  departmentLabel,
  departmentColor,
  departmentIcon,
} from "@/lib/department-meta";

/** Ensure Department rows exist for workspace JSON department keys. */
export async function ensureWorkspaceDepartments(
  workspaceId: string,
  keys?: string[],
) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { departments: true },
  });
  const fromJson = Array.isArray(ws?.departments)
    ? (ws!.departments as string[])
    : [];
  const wanted = keys?.length ? keys : fromJson;
  if (!wanted.length) return [];

  const created = [];
  let order = 0;
  for (const key of wanted) {
    const name = departmentLabel(key);
    let row = await prisma.department.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      create: {
        workspaceId,
        key,
        name,
        color: departmentColor(key),
        icon: departmentIcon(key),
        order: order++,
      },
      update: { name, color: departmentColor(key) },
    });
    if (!row.icon || (row.icon === "business" && departmentIcon(key) !== "business")) {
      row = await prisma.department.update({
        where: { id: row.id },
        data: { icon: departmentIcon(key) },
      });
    }
    created.push(row);
  }
  return created;
}

/** Attach boards missing departmentId using name heuristics, then return map. */
export async function backfillBoardDepartments(workspaceId: string) {
  const depts = await prisma.department.findMany({ where: { workspaceId } });
  if (!depts.length) return;

  const boards = await prisma.board.findMany({
    where: { workspaceId, departmentId: null, archivedAt: null },
    select: { id: true, name: true },
  });

  for (const b of boards) {
    const lower = b.name.toLowerCase();
    const match =
      depts.find((d) => lower.includes(d.key)) ||
      depts.find((d) => {
        const first = d.name.toLowerCase().split(/[\s/]/)[0];
        return first && lower.includes(first);
      });
    if (match) {
      await prisma.board.update({
        where: { id: b.id },
        data: { departmentId: match.id },
      });
    }
  }
}

export async function isWorkspaceAdmin(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const [members, settings, audit] = await Promise.all([
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "board:settings"),
    hasPermission(userId, workspaceId, "workspace:audit"),
  ]);
  return members || settings || audit;
}

/** Create / edit / disable / delete any department (org-level access). */
export async function canManageDepartments(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  if (await isWorkspaceAdmin(userId, workspaceId)) return true;
  return hasPermission(userId, workspaceId, "department:manage");
}

export async function getDepartmentMembership(
  userId: string,
  departmentId: string,
) {
  return prisma.departmentMember.findUnique({
    where: { departmentId_userId: { departmentId, userId } },
  });
}

export async function isDepartmentSupervisor(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const m = await getDepartmentMembership(userId, departmentId);
  return m?.role === "SUPERVISOR" || m?.role === "MANAGER";
}

export async function isDepartmentManagerRole(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const m = await getDepartmentMembership(userId, departmentId);
  return m?.role === "MANAGER";
}

export async function isDepartmentMember(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const m = await getDepartmentMembership(userId, departmentId);
  return !!m;
}

/** User can see boards in this department. */
export async function canAccessDepartment(
  userId: string,
  workspaceId: string,
  departmentId: string,
): Promise<boolean> {
  if (await isWorkspaceAdmin(userId, workspaceId)) return true;
  return isDepartmentMember(userId, departmentId);
}

/** Supervisor or manager of the board's department (or workspace admin). */
export async function isBoardDepartmentSupervisor(
  userId: string,
  boardId: string,
): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true, departmentId: true },
  });
  if (!board) return false;
  if (await isWorkspaceAdmin(userId, board.workspaceId)) return true;
  if (!board.departmentId) return false;
  return isDepartmentSupervisor(userId, board.departmentId);
}

export async function listAccessibleDepartmentIds(
  userId: string,
  workspaceId: string,
): Promise<string[] | "all"> {
  if (await canManageDepartments(userId, workspaceId)) return "all";
  const rows = await prisma.departmentMember.findMany({
    where: { userId, department: { workspaceId } },
    select: { departmentId: true },
  });
  return rows.map((r) => r.departmentId);
}

export async function seedDepartmentsWithBoards(
  workspaceId: string,
  departments: DepartmentKey[],
) {
  const depts = await ensureWorkspaceDepartments(workspaceId, departments);
  const boards = [];
  for (const d of depts) {
    const existing = await prisma.board.findFirst({
      where: { workspaceId, departmentId: d.id },
    });
    if (existing) {
      boards.push(existing);
      continue;
    }
    const board = await prisma.board.create({
      data: {
        workspaceId,
        departmentId: d.id,
        name: `${d.name} Board`,
        description: `Starter board for ${d.name}`,
        visibility: "WORKSPACE",
        background: d.color,
        lists: {
          create: [
            { title: "To Do", order: 0 },
            { title: "In Progress", order: 1 },
            { title: "Done", order: 2 },
          ],
        },
      },
    });
    boards.push(board);
  }
  return { departments: depts, boards };
}
