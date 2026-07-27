import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveHomeDashboard } from "@/lib/dashboard-role";

/** GET /api/auth/callback-home — post Google OAuth landing */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pendingOnboarding: true },
  });
  if (user?.pendingOnboarding) redirect("/onboarding/company");

  const home = await resolveHomeDashboard({
    userId: session.user.id,
    isSuperAdmin: Boolean(session.user.isSuperAdmin),
  });
  redirect(home.homePath);
}
