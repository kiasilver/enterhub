import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Shell/OS may already export DATABASE_URL (e.g. SQLAlchemy
 * postgresql+psycopg2://…/trading_bot). Next.js does not override that with
 * frontend/.env — so we read the project file and prefer it in development.
 */
function loadProjectDatabaseUrl(): string | undefined {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    try {
      const text = readFileSync(path, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const m = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
        if (!m) continue;
        let v = m[1].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (v) return v;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function normalizeDatabaseUrl(raw: string): string {
  let url = raw.trim();
  // SQLAlchemy / async drivers → Prisma
  url = url.replace(/^postgres(ql)?\+\w+:\/\//i, "postgresql://");
  if (url.startsWith("postgres://")) {
    url = `postgresql://${url.slice("postgres://".length)}`;
  }
  return url;
}

/** Bracket access avoids Turbopack compile-time inlining of an empty DATABASE_URL. */
function databaseUrl(): string {
  const fromFile = loadProjectDatabaseUrl();
  const fromEnv = process.env["DATABASE_URL"] || process.env["ENTERHUB_DATABASE_URL"];
  // Prefer project .env when shell URL is missing, non-postgres, or SQLAlchemy-style
  const shellLooksForeign =
    !fromEnv ||
    fromEnv.includes("+psycopg") ||
    fromEnv.includes("+asyncpg") ||
    fromEnv.includes("trading_bot");

  const chosen = (shellLooksForeign && fromFile ? fromFile : fromEnv || fromFile) || "";
  const url = normalizeDatabaseUrl(chosen);

  if (!url || !url.startsWith("postgresql://")) {
    throw new Error(
      "DATABASE_URL must be set to a postgresql:// connection string in frontend/.env (shell env may be overriding it)"
    );
  }

  // Keep process.env in sync for Prisma / other libs
  process.env["DATABASE_URL"] = url;
  return url;
}

function createPrisma() {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
