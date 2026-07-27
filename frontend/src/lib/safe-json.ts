/**
 * Parse Response JSON safely — empty / non-JSON bodies throw a clear Error
 * instead of "Unexpected end of JSON input".
 */
export async function readJson<T = unknown>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  const text = await res.text();
  if (!text) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      error: res.ok ? null : `Request failed (${res.status}) with empty response`,
    };
  }
  try {
    const data = JSON.parse(text) as T;
    const errMsg =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null;
    return { ok: res.ok, status: res.status, data, error: res.ok ? null : errMsg || text };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: text.slice(0, 200) || `Invalid JSON (${res.status})`,
    };
  }
}
