import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";

const MAX_BYTES = 4 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extFromName(name: string) {
  const raw = (name.split(".").pop() || "").toLowerCase();
  if (raw === "jpeg") return "jpg";
  if (raw === "jpg" || raw === "png" || raw === "webp" || raw === "gif") return raw;
  return null;
}

async function removeStoredAvatar(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/avatars/")) return;
  const abs = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  await unlink(abs).catch(() => undefined);
}

/** POST /api/account/avatar — multipart `file` */
export async function POST(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size < 8) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  }

  const mime = (file.type || "").toLowerCase();
  const ext = MIME_EXT[mime] || extFromName(file.name);
  if (!ext) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WEBP, or GIF" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const fname = `${session.user.id}-${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, fname), buf);
  const avatarUrl = `/uploads/avatars/${fname}`;

  const prev = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
    select: {
      id: true,
      avatarUrl: true,
      name: true,
      firstName: true,
      lastName: true,
    },
  });

  await removeStoredAvatar(prev?.avatarUrl);

  return NextResponse.json({ data: user });
}

/** DELETE /api/account/avatar — revert to initials */
export async function DELETE() {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prev = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: null },
    select: { id: true, avatarUrl: true },
  });

  await removeStoredAvatar(prev?.avatarUrl);

  return NextResponse.json({ data: user });
}
