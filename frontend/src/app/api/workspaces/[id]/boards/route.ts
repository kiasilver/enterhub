import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { emitToBoardRoom } from "@/lib/socket-emit";
import {
  backfillBoardDepartments,
  canAccessDepartment,
  ensureWorkspaceDepartments,
  listAccessibleDepartmentIds,
  departmentIcon,
} from "@/lib/departments";

const createBoardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
  departmentId: z.string().min(1).optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

const COVER_PALETTE = [
  "#2563EB",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#64748B",
];

function listBucket(title: string): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

function coverColor(boardId: string, background: string | null): string {
  if (background && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(background.trim())) {
    return background.trim();
  }
  if (background && background.startsWith("http")) {
    return COVER_PALETTE[0];
  }
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) hash = (hash * 31 + boardId.charCodeAt(i)) | 0;
  return COVER_PALETTE[Math.abs(hash) % COVER_PALETTE.length];
}

function healthFromStats(
  overdue: number,
  open: number,
  completionPct: number,
): "on_track" | "at_risk" | "off_track" {
  if (open === 0 || completionPct >= 100) return "on_track";
  if (overdue === 0) return "on_track";
  const ratio = overdue / Math.max(open, 1);
  if (ratio >= 0.35 || overdue >= 5) return "off_track";
  return "at_risk";
}

/** GET /api/workspaces/[id]/boards */
export async function GET(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;
  const userId = session.user.id;
  const url = new URL(req.url);
  const archivedOnly = url.searchParams.get("archived") === "1";

  if (!(await isWorkspaceMember(userId, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [isManager, canAudit, canLead, accessible] = await Promise.all([
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "workspace:audit"),
    hasPermission(userId, workspaceId, "board:settings"),
    listAccessibleDepartmentIds(userId, workspaceId),
  ]);
  const fullAccess = isManager || canAudit || canLead || accessible === "all";

  await ensureWorkspaceDepartments(workspaceId);
  await backfillBoardDepartments(workspaceId);

  const deptRows = await prisma.department.findMany({
    where: {
      workspaceId,
      ...(accessible === "all" ? {} : { id: { in: accessible } }),
    },
    orderBy: { order: "asc" },
  });

  const boards = await prisma.board.findMany({
    where: {
      workspaceId,
      archivedAt: archivedOnly ? { not: null } : null,
      ...(fullAccess
        ? {}
        : {
            OR: [
              ...(accessible.length
                ? [{ departmentId: { in: accessible as string[] } }]
                : []),
              { departmentId: null, visibility: { in: ["WORKSPACE", "PUBLIC"] as const } },
              { guests: { some: { userId } } },
            ],
          }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      department: { select: { id: true, key: true, name: true, color: true, icon: true } },
      _count: { select: { lists: true, guests: true } },
      guests: {
        take: 12,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      lists: {
        where: { archivedAt: null },
        select: {
          title: true,
          cards: {
            where: { archivedAt: null },
            select: {
              id: true,
              dueDate: true,
              assignees: {
                take: 8,
                select: {
                  user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const now = Date.now();
  const managerOptions = new Map<
    string,
    { id: string; name: string; email: string; avatarUrl: string | null }
  >();

  const data = boards.map((b) => {
    let open = 0;
    let done = 0;
    let overdue = 0;
    let todo = 0;
    let progress = 0;
    let review = 0;
    let latestDue: Date | null = null;
    const memberMap = new Map<
      string,
      { id: string; name: string; email: string; avatarUrl: string | null }
    >();

    for (const l of b.lists) {
      const bucket = listBucket(l.title);
      for (const c of l.cards) {
        for (const a of c.assignees) {
          if (!memberMap.has(a.user.id)) {
            memberMap.set(a.user.id, {
              id: a.user.id,
              name: a.user.name || a.user.email,
              email: a.user.email,
              avatarUrl: a.user.avatarUrl,
            });
          }
        }
        if (bucket === "done") {
          done += 1;
        } else {
          open += 1;
          if (bucket === "todo") todo += 1;
          else if (bucket === "progress") progress += 1;
          else if (bucket === "review") review += 1;
          if (c.dueDate && c.dueDate.getTime() < now) overdue += 1;
          if (c.dueDate && (!latestDue || c.dueDate > latestDue)) latestDue = c.dueDate;
        }
      }
    }

    for (const g of b.guests) {
      if (!memberMap.has(g.user.id)) {
        memberMap.set(g.user.id, {
          id: g.user.id,
          name: g.user.name || g.user.email,
          email: g.user.email,
          avatarUrl: g.user.avatarUrl,
        });
      }
    }

    const members = [...memberMap.values()];
    const writeGuest = b.guests.find((g) => g.accessLevel !== "READ_ONLY");
    const manager = writeGuest
      ? {
          id: writeGuest.user.id,
          name: writeGuest.user.name || writeGuest.user.email,
          email: writeGuest.user.email,
          avatarUrl: writeGuest.user.avatarUrl,
        }
      : members[0] || null;

    if (manager) managerOptions.set(manager.id, manager);

    const total = open + done;
    const completionPct = total ? Math.round((done / total) * 100) : 0;
    const health = healthFromStats(overdue, open, completionPct);
    const status =
      total === 0
        ? "empty"
        : health === "off_track"
          ? "at_risk"
          : completionPct >= 100
            ? "completed"
            : progress > 0 || review > 0 || open > 0
              ? "in_progress"
              : "not_started";

    const departmentKey = b.department?.key ?? null;
    const departmentLabel = b.department?.name ?? "General";
    const departmentId = b.department?.id ?? null;

    return {
      id: b.id,
      name: b.name,
      description: b.description,
      visibility: b.visibility,
      defaultView: b.defaultView,
      background: b.background,
      coverColor: coverColor(b.id, b.background || b.department?.color || null),
      coverImage:
        b.background && b.background.startsWith("http") ? b.background : null,
      icon: b.department?.icon || (departmentKey ? departmentIcon(departmentKey) : "business"),
      departmentId,
      departmentKey,
      departmentLabel,
      departmentColor: b.department?.color ?? null,
      updatedAt: b.updatedAt,
      archivedAt: b.archivedAt,
      listCount: b._count.lists,
      guestCount: b._count.guests,
      cardCount: total,
      open,
      done,
      overdue,
      todo,
      progress,
      review,
      completionPct,
      status,
      health,
      latestDue: latestDue?.toISOString() ?? null,
      manager,
      members: members.slice(0, 8),
      memberCount: members.length,
    };
  });

  const folders = [
    ...deptRows.map((d) => ({
      id: d.id,
      key: d.key,
      label: d.name,
      color: d.color,
      icon: d.icon || departmentIcon(d.key),
    })),
    {
      id: null as string | null,
      key: "general",
      label: "General",
      color: "#6B7280",
      icon: "business",
    },
  ];

  return NextResponse.json({
    data,
    meta: {
      departments: folders,
      managers: [...managerOptions.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      archivedOnly,
    },
  });
}

/** POST /api/workspaces/[id]/boards */
export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id: workspaceId } = await context.params;
  const userId = session.user.id;

  if (!(await hasPermission(userId, workspaceId, "board:create"))) {
    return NextResponse.json(
      { error: "Forbidden: missing permission board:create" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, status: true },
  });
  if (!workspace || workspace.status !== "ACTIVE") {
    return NextResponse.json({ error: "Workspace not available" }, { status: 404 });
  }

  let departmentId = parsed.data.departmentId ?? null;
  let background: string | null = null;
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, workspaceId, archivedAt: null },
      select: { id: true, color: true },
    });
    if (!dept) {
      return NextResponse.json(
        { error: "Department not found or disabled" },
        { status: 400 },
      );
    }
    if (!(await canAccessDepartment(userId, workspaceId, departmentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    background = dept.color || null;
  } else {
    departmentId = null;
  }

  const board = await prisma.board.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      description: parsed.data.description,
      visibility: parsed.data.visibility ?? "WORKSPACE",
      departmentId,
      background,
      lists: {
        create: [
          { title: "To Do", order: 0 },
          { title: "In Progress", order: 1 },
          { title: "Done", order: 2 },
        ],
      },
    },
  });

  await AuditLogger.fromRequest(req, {
    userId,
    workspaceId,
    boardId: board.id,
    action: "board.create",
    metadata: { name: board.name },
    severity: "info",
  });

  emitToBoardRoom(board.id, "card-updated", { type: "board.created", boardId: board.id });

  return NextResponse.json({ data: board }, { status: 201 });
}
