import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string; purchaseId: string }> };

/** POST multipart: receiptImage + optional bankCardId, amountClaimed, note */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, purchaseId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:billing"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const purchase = await prisma.planPurchaseRequest.findFirst({
    where: { id: purchaseId, workspaceId },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("receipt") as File | null;
  const bankCardId = String(form.get("bankCardId") || "") || null;
  const amountClaimed = Number(form.get("amountClaimed") || purchase.amount);
  const note = String(form.get("note") || "") || null;
  const paidAtRaw = String(form.get("paidAtClaimed") || "");
  const paidAtClaimed = paidAtRaw ? new Date(paidAtRaw) : new Date();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Receipt image required" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const dir = path.join(process.cwd(), "public", "uploads", "c2c");
  await mkdir(dir, { recursive: true });
  const fname = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, fname), buf);
  const receiptImageUrl = `/uploads/c2c/${fname}`;

  const receipt = await prisma.c2CReceipt.upsert({
    where: { requestId: purchaseId },
    create: {
      requestId: purchaseId,
      bankCardId,
      amountClaimed,
      paidAtClaimed,
      receiptImageUrl,
      note,
    },
    update: {
      bankCardId,
      amountClaimed,
      paidAtClaimed,
      receiptImageUrl,
      note,
    },
  });

  await prisma.planPurchaseRequest.update({
    where: { id: purchaseId },
    data: { status: "PENDING_REVIEW" },
  });

  return NextResponse.json({ data: receipt });
}
