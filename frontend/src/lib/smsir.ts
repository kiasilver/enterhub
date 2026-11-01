/**
 * sms.ir Verify API — OTP / high-priority template SMS.
 * Docs: POST https://api.sms.ir/v1/send/verify  (header x-api-key)
 * Runtime: PlatformSettings (admin OTP panel) first, then process.env.
 */

import { prisma } from "@/lib/prisma";

export function normalizeIranPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("98") && n.length === 12) n = `0${n.slice(2)}`;
  if (n.startsWith("9") && n.length === 10) n = `0${n}`;
  if (!/^09\d{9}$/.test(n)) return null;
  return n;
}

export type SmsirTemplateKind =
  | "login"
  | "register"
  | "temp_pass"
  | "assignment"
  | "supervisor"
  | "approval"
  | "invite"
  | "letter"
  | "mail";

export const SMSIR_TEMPLATE_KINDS: SmsirTemplateKind[] = [
  "login",
  "register",
  "temp_pass",
  "assignment",
  "supervisor",
  "approval",
  "invite",
  "letter",
  "mail",
];

const KIND_ENV: Record<SmsirTemplateKind, string> = {
  login: "SMSIR_TPL_LOGIN",
  register: "SMSIR_TPL_REGISTER",
  temp_pass: "SMSIR_TPL_TEMP_PASS",
  assignment: "SMSIR_TPL_ASSIGNMENT",
  supervisor: "SMSIR_TPL_SUPERVISOR",
  approval: "SMSIR_TPL_APPROVAL",
  invite: "SMSIR_TPL_INVITE",
  letter: "SMSIR_TPL_LETTER",
  mail: "SMSIR_TPL_MAIL",
};

type SmsirRuntime = {
  apiKey: string;
  templates: Record<SmsirTemplateKind, number>;
  fallback: number;
};

function parseTpl(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function templatesFromJson(json: unknown): Partial<Record<SmsirTemplateKind, number>> {
  if (!json || typeof json !== "object") return {};
  const src = json as Record<string, unknown>;
  const out: Partial<Record<SmsirTemplateKind, number>> = {};
  for (const kind of SMSIR_TEMPLATE_KINDS) {
    const n = parseTpl(src[kind]);
    if (n > 0) out[kind] = n;
  }
  return out;
}

async function loadRuntime(): Promise<SmsirRuntime> {
  let apiKey = (process.env.SMSIR_API_KEY || "").trim();
  const fromJson: Partial<Record<SmsirTemplateKind, number>> = {};
  let fallback = parseTpl(process.env.SMSIR_OTP_TEMPLATE_ID);
  try {
    const row = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: {
        smsirApiKey: true,
        smsirTemplateId: true,
        smsirTemplatesJson: true,
      },
    });
    if (row?.smsirApiKey?.trim() && row.smsirApiKey !== "••••••••") {
      apiKey = row.smsirApiKey.trim();
    }
    Object.assign(fromJson, templatesFromJson(row?.smsirTemplatesJson));
    const rowFallback = parseTpl(row?.smsirTemplateId);
    if (rowFallback > 0) fallback = rowFallback;
  } catch {
    /* columns missing until migrate */
  }

  const templates = {} as Record<SmsirTemplateKind, number>;
  for (const kind of SMSIR_TEMPLATE_KINDS) {
    templates[kind] =
      fromJson[kind] || parseTpl(process.env[KIND_ENV[kind]]) || fallback;
  }
  return { apiKey, templates, fallback };
}

export function smsirTemplateId(
  kind?: SmsirTemplateKind | null,
  override?: number | null,
): number {
  if (override && override > 0) return override;
  if (kind) {
    const n = Number(process.env[KIND_ENV[kind]] || 0);
    if (n > 0) return n;
  }
  return Number(process.env.SMSIR_OTP_TEMPLATE_ID || 0);
}

export function isSmsirConfigured(): boolean {
  const key = process.env.SMSIR_API_KEY?.trim();
  if (!key) return false;
  return (
    smsirTemplateId("login") > 0 ||
    smsirTemplateId("register") > 0 ||
    Number(process.env.SMSIR_OTP_TEMPLATE_ID || 0) > 0
  );
}

export async function isSmsirReady(): Promise<boolean> {
  const cfg = await loadRuntime();
  if (!cfg.apiKey) return false;
  return cfg.templates.login > 0 || cfg.templates.register > 0 || cfg.fallback > 0;
}

export function clipSmsParam(value: string, max = 30): string {
  const t = value.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || "-";
  return `${t.slice(0, max - 1)}…`;
}

export async function sendSmsirVerify(opts: {
  mobile: string;
  kind?: SmsirTemplateKind | null;
  templateId?: number | null;
  parameters: { name: string; value: string }[];
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await loadRuntime();
  const apiKey = cfg.apiKey;
  const templateId =
    opts.templateId && opts.templateId > 0
      ? opts.templateId
      : opts.kind
        ? cfg.templates[opts.kind]
        : cfg.fallback;
  if (!apiKey || !templateId) {
    return { ok: false, error: "sms.ir is not configured" };
  }

  const phone = normalizeIranPhone(opts.mobile);
  if (!phone) return { ok: false, error: "Invalid phone number" };

  const parameters = opts.parameters.map((p) => ({
    name: p.name,
    value: clipSmsParam(String(p.value || ""), 30),
  }));

  try {
    const res = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile: phone,
        templateId,
        parameters,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      status?: number;
      message?: string;
    } | null;
    if (!res.ok || (json?.status != null && json.status !== 1)) {
      return {
        ok: false,
        error: json?.message || `sms.ir HTTP ${res.status}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "sms.ir request failed",
    };
  }
}

/** OTP helper — uses login/register templates (param CODE). */
export async function sendSmsirVerifyCode(
  mobile: string,
  code: string,
  templateIdOverride?: number | null,
  kind?: SmsirTemplateKind | null,
): Promise<{ ok: boolean; error?: string }> {
  return sendSmsirVerify({
    mobile,
    kind: kind ?? "login",
    templateId: templateIdOverride,
    parameters: [
      {
        name: (process.env.SMSIR_OTP_PARAM_NAME || "CODE").trim() || "CODE",
        value: code,
      },
    ],
  });
}

export async function getSmsirAdminSnapshot(): Promise<{
  apiKeyMasked: string;
  hasApiKey: boolean;
  templates: Record<SmsirTemplateKind, number>;
  fallback: number;
  envConfigured: boolean;
}> {
  const cfg = await loadRuntime();
  return {
    apiKeyMasked: cfg.apiKey ? "••••••••" : "",
    hasApiKey: Boolean(cfg.apiKey),
    templates: cfg.templates,
    fallback: cfg.fallback,
    envConfigured: Boolean(cfg.apiKey),
  };
}
