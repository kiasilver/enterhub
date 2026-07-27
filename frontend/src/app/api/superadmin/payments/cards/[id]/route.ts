import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string }> };

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

const patchSchema = z.object({
  holderName: z.string().min(2).max(120).optional(),
  bankName: z.string().min(2).max(80).optional(),
  cardNumber: z.string().min(12).max(24).optional(),
  iban: z.string().max(34).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.cardNumber) {
    const digits = parsed.data.cardNumber.replace(/\D/g, "");
    data.cardNumber = digits;
    data.last4 = digits.slice(-4);
  }
  const card = await prisma.bankCard.update({ where: { id }, data });
  return NextResponse.json({ data: card });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await prisma.bankCard.delete({ where: { id } });
  return NextResponse.json({ data: { ok: true } });
}
