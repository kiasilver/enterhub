import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { assertStorageAvailable } from "@/lib/storage-quota";
import { fileCategory } from "@/lib/file-category";

type Ctx = { params: Promise<{ id: string }> };

async function galleryAccess(userId: string, workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!ws) return null;
  const isOwner = ws.ownerId === userId;
  const [canMembers, canAudit, canUpdate] = await Promise.all([
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "workspace:audit"),
    hasPermission(userId, workspaceId, "workspace:update"),
  ]);
  /** Access matrix: managers / owners see all uploads (chat, cards, etc.) */
  const seeAll = isOwner || canMembers || canAudit;
  const canDeleteAny = isOwner || canMembers || canUpdate;
  return { isOwner, seeAll, canDeleteAny };
}

/**
 * GET /api/workspaces/[id]/media
 * Query: q, category (image|video|pdf|document|audio|other|all), imagesOnly=1
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const access = await galleryAccess(session.user.id, workspaceId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const category = (url.searchParams.get("category") || "all").toLowerCase();
  const imagesOnly = url.searchParams.get("imagesOnly") === "1";

  const ownFilter = access.seeAll ? {} : { uploadedById: session.user.id };

  const [mediaRows, attachmentRows] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: { workspaceId, deletedAt: null, ...ownFilter },
      orderBy: { createdAt: "desc" },
      take: 400,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.attachment.findMany({
      where: {
        deletedAt: null,
        card: { list: { board: { workspaceId } } },
        ...ownFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 400,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        card: {
          select: {
            id: true,
            title: true,
            list: { select: { board: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
  ]);

  type Item = {
    id: string;
    kind: "media" | "attachment";
    fileName: string;
    fileUrl: string;
    mimeType: string | null;
    sizeBytes: number;
    source: string;
    category: string;
    createdAt: Date;
    uploader: { id: string; name: string | null; email: string; avatarUrl?: string | null };
    boardName?: string;
    boardId?: string;
    cardTitle?: string;
    canDelete: boolean;
  };

  let items: Item[] = [
    ...mediaRows.map((m) => ({
      id: m.id,
      kind: "media" as const,
      fileName: m.fileName,
      fileUrl: m.fileUrl,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      source: m.source,
      category: fileCategory(m.mimeType, m.fileName),
      createdAt: m.createdAt,
      uploader: m.uploadedBy,
      canDelete: access.canDeleteAny || m.uploadedById === session.user!.id,
    })),
    ...attachmentRows.map((a) => ({
      id: a.id,
      kind: "attachment" as const,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes || 0,
      source: "CARD",
      category: fileCategory(a.mimeType, a.fileName),
      createdAt: a.createdAt,
      uploader: a.uploadedBy,
      boardName: a.card.list.board.name,
      boardId: a.card.list.board.id,
      cardTitle: a.card.title,
      canDelete: access.canDeleteAny || a.uploadedById === session.user!.id,
    })),
  ];

  items.sort((a, b) => +b.createdAt - +a.createdAt);

  if (imagesOnly || category === "image") {
    items = items.filter((i) => i.category === "image");
  } else if (category !== "all") {
    items = items.filter((i) => i.category === category);
  }

  if (q) {
    items = items.filter((i) => {
      const hay = [
        i.fileName,
        i.uploader.name || "",
        i.uploader.email,
        i.boardName || "",
        i.cardTitle || "",
        i.source,
        i.mimeType || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const counts = {
    all: items.length,
    image: 0,
    video: 0,
    pdf: 0,
    document: 0,
    audio: 0,
    other: 0,
  };
  // counts should be on unfiltered-by-category set — recompute from full before category filter
  const forCounts = [
    ...mediaRows.map((m) => fileCategory(m.mimeType, m.fileName)),
    ...attachmentRows.map((a) => fileCategory(a.mimeType, a.fileName)),
  ];
  const fullCounts = {
    all: forCounts.length,
    image: forCounts.filter((c) => c === "image").length,
    video: forCounts.filter((c) => c === "video").length,
    pdf: forCounts.filter((c) => c === "pdf").length,
    document: forCounts.filter((c) => c === "document").length,
    audio: forCounts.filter((c) => c === "audio").length,
    other: forCounts.filter((c) => c === "other").length,
  };
  void counts;

  return NextResponse.json({
    data: {
      scope: access.seeAll ? "workspace" : "mine",
      canDeleteAny: access.canDeleteAny,
      counts: fullCounts,
      items: items.slice(0, 300),
    },
  });
}

const uploadSchema = z.object({
  fileName: z.string().min(1).max(240),
  fileUrl: z.string().min(1).max(8_000_000),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024),
  source: z.enum(["CHAT", "CARD", "UPLOAD"]).default("UPLOAD"),
  sourceRef: z.string().max(120).optional().nullable(),
});

/** POST — register any file type into workspace cloud gallery */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const check = await assertStorageAvailable(workspaceId, parsed.data.sizeBytes);
  if (!check.ok) {
    return NextResponse.json(
      {
        error: check.error,
        code: "STORAGE_FULL",
        remainingBytes: check.remainingBytes,
      },
      { status: 413 }
    );
  }

  const row = await prisma.mediaAsset.create({
    data: {
      workspaceId,
      uploadedById: session.user.id,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      mimeType: parsed.data.mimeType || "application/octet-stream",
      sizeBytes: parsed.data.sizeBytes,
      source: parsed.data.source,
      sourceRef: parsed.data.sourceRef || null,
    },
  });

  return NextResponse.json(
    {
      data: {
        ...row,
        category: fileCategory(row.mimeType, row.fileName),
      },
    },
    { status: 201 }
  );
}
