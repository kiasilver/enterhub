import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { getPlatformSettings } from "@/lib/platform-settings";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

export async function GET() {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [settings, methods] = await Promise.all([
    getPlatformSettings(),
    prisma.paymentMethod.findMany(),
  ]);
  return NextResponse.json({
    data: {
      settings,
      methods,
      env: {
        smsirConfigured: Boolean(process.env.SMSIR_API_KEY?.trim()),
        smtpConfigured: Boolean(process.env.SMTP_HOST?.trim()),
        googleConfigured: Boolean(
          process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
        ),
        zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID || null,
      },
    },
  });
}

const patchSchema = z.object({
  smsOtpEnabled: z.boolean().optional(),
  emailVerifyEnabled: z.boolean().optional(),
  googleAuthEnabled: z.boolean().optional(),
  smsirTemplateId: z.number().int().nullable().optional(),
  zarinpalMerchantId: z.string().nullable().optional(),
  zarinpalSandbox: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  plansCatalogJson: z.unknown().optional(),
  c2cEnabled: z.boolean().optional(),
  zarinpalEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const {
    c2cEnabled,
    zarinpalEnabled,
    plansCatalogJson,
    ...rest
  } = parsed.data;

  const settingsPatch: Prisma.PlatformSettingsUpdateInput = {
    ...rest,
    ...(plansCatalogJson !== undefined
      ? { plansCatalogJson: plansCatalogJson as Prisma.InputJsonValue }
      : {}),
  };

  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...(settingsPatch as Prisma.PlatformSettingsCreateInput) },
    update: settingsPatch,
  });

  if (c2cEnabled != null) {
    await prisma.paymentMethod.upsert({
      where: { kind: "C2C" },
      create: { kind: "C2C", enabled: c2cEnabled },
      update: { enabled: c2cEnabled },
    });
  }
  if (zarinpalEnabled != null) {
    await prisma.paymentMethod.upsert({
      where: { kind: "ZARINPAL" },
      create: { kind: "ZARINPAL", enabled: zarinpalEnabled },
      update: { enabled: zarinpalEnabled },
    });
  }

  return NextResponse.json({ data: settings });
}
