import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { maskCard } from "@/lib/billing-apply";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

/** GET — public active cards (masked) for checkout; SA sees full list */
export async function GET() {
  const session = await auth();
  const isSa = requireSa(session);
  const cards = await prisma.bankCard.findMany({
    where: isSa ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({
    data: cards.map((c) => ({
      id: c.id,
      holderName: c.holderName,
      bankName: c.bankName,
      last4: c.last4,
      iban: isSa ? c.iban : null,
      cardNumber: isSa ? c.cardNumber : maskCard(c.cardNumber),
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    })),
  });
}

const createSchema = z.object({
  holderName: z.string().min(2).max(120),
  bankName: z.string().min(2).max(80),
  cardNumber: z.string().min(12).max(24),
  iban: z.string().max(34).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** POST — SA create card */
export async function POST(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const digits = parsed.data.cardNumber.replace(/\D/g, "");
  const card = await prisma.bankCard.create({
    data: {
      holderName: parsed.data.holderName,
      bankName: parsed.data.bankName,
      cardNumber: digits,
      last4: digits.slice(-4),
      iban: parsed.data.iban || null,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });
  return NextResponse.json({ data: card }, { status: 201 });
}
