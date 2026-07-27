import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogInput {
  userId?: string | null;
  workspaceId?: string | null;
  boardId?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: AuditSeverity;
}

/**
 * Reusable audit writer for security + product trails.
 * Always best-effort: logging failure must not break the primary mutation.
 */
export class AuditLogger {
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: input.userId ?? null,
          workspaceId: input.workspaceId ?? null,
          boardId: input.boardId ?? null,
          action: input.action,
          metadata: input.metadata ?? undefined,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          severity: input.severity ?? "info",
        },
      });
    } catch (err) {
      console.error("[AuditLogger] failed to write ActivityLog", err);
    }
  }

  static fromRequest(
    req: Request,
    partial: Omit<AuditLogInput, "ipAddress" | "userAgent">
  ): Promise<void> {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent");
    return AuditLogger.log({ ...partial, ipAddress: ip, userAgent });
  }
}
