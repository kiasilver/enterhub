/**
 * sms.ir Verify API — OTP / high-priority template SMS.
 * Docs: POST https://api.sms.ir/v1/send/verify  (header x-api-key)
 */

export function normalizeIranPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("98") && n.length === 12) n = `0${n.slice(2)}`;
  if (n.startsWith("9") && n.length === 10) n = `0${n}`;
  if (!/^09\d{9}$/.test(n)) return null;
  return n;
}

export function isSmsirConfigured(): boolean {
  return Boolean(process.env.SMSIR_API_KEY?.trim() && process.env.SMSIR_OTP_TEMPLATE_ID?.trim());
}

export async function sendSmsirVerifyCode(
  mobile: string,
  code: string,
  templateIdOverride?: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SMSIR_API_KEY?.trim();
  const templateId =
    templateIdOverride ??
    Number(process.env.SMSIR_OTP_TEMPLATE_ID || 0);
  const paramName = (process.env.SMSIR_OTP_PARAM_NAME || "CODE").trim() || "CODE";

  if (!apiKey || !templateId) {
    return { ok: false, error: "sms.ir is not configured" };
  }

  const phone = normalizeIranPhone(mobile);
  if (!phone) return { ok: false, error: "Invalid phone number" };

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
        parameters: [{ name: paramName, value: code }],
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
