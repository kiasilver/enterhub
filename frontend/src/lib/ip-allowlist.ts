/**
 * Minimal IPv4 CIDR allowlist check (no external deps).
 * Supports exact IPv4 and prefix /8–/32. IPv6 → fail closed if list non-empty.
 */
export function ipMatchesCidr(ip: string, cidr: string): boolean {
  const trimmed = cidr.trim();
  if (!trimmed) return false;

  if (!trimmed.includes("/")) {
    return ip === trimmed;
  }

  const [range, bitsStr] = trimmed.split("/");
  const bits = Number(bitsStr);
  if (!Number.isFinite(bits) || bits < 0 || bits > 32) return false;

  const ipNum = ipv4ToInt(ip);
  const rangeNum = ipv4ToInt(range);
  if (ipNum === null || rangeNum === null) return false;

  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

export function clientIpFromRequest(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

/** Empty / null allowlist = allow all. */
export function isIpAllowed(ip: string | null, allowlist: unknown): boolean {
  if (allowlist == null) return true;
  const list = Array.isArray(allowlist)
    ? allowlist.map(String)
    : typeof allowlist === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(allowlist);
            return Array.isArray(parsed) ? parsed.map(String) : [];
          } catch {
            return [];
          }
        })()
      : [];

  if (list.length === 0) return true;
  if (!ip) return false;
  return list.some((cidr) => ipMatchesCidr(ip, cidr));
}
