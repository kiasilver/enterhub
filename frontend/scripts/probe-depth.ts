const BASE = "http://localhost:3000";
const jar = new Map<string, string>();
function store(res: Response) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [p] = c.split(";");
    const i = p.indexOf("=");
    if (i > 0) jar.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }
}
function cookie() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}
async function api(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers);
  h.set("cookie", cookie());
  if (init.body && !h.has("content-type")) h.set("content-type", "application/json");
  const res = await fetch(BASE + path, { ...init, headers: h, redirect: "manual" });
  store(res);
  const t = await res.text();
  let j: any;
  try {
    j = JSON.parse(t);
  } catch {
    j = { html: t.includes("DOCTYPE") };
  }
  return { status: res.status, j };
}

(async () => {
  const csrf = await api("/api/auth/csrf");
  const body = new URLSearchParams({
    csrfToken: csrf.j.csrfToken,
    email: "owner@enteredge.dev",
    password: "Demo1234!",
    callbackUrl: BASE + "/",
    json: "true",
  });
  store(
    await fetch(BASE + "/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: cookie(),
      },
      body,
      redirect: "manual",
    }),
  );

  const wsId = "cmrv5m29z0012o98gpdypz0xo";
  const members = await api(`/api/workspaces/${wsId}/members`);
  const mid = members.j.data[1]?.id;
  const mget = await api(`/api/workspaces/${wsId}/members/${mid}`);
  console.log("member by id GET", mget.status, mget.j?.error || mget.j?.html || "ok");

  const autos = await api(`/api/boards/cmrwkiasf000mo9lowj8w2f28/automations`);
  console.log("automations list", autos.status);
  // create none - just check pattern /mail/[mailId]
  const inbox = await api(`/api/workspaces/${wsId}/mail?folder=inbox`);
  const mailId = inbox.j.data?.[0]?.id;
  if (mailId) {
    const one = await api(`/api/workspaces/${wsId}/mail/${mailId}`);
    console.log("mail by id", one.status, one.j?.error || one.j?.html || "ok");
  }

  // lead dashboard
  const lead = await api(`/api/workspaces/${wsId}/lead-dashboard?fresh=1`);
  console.log("lead", lead.status, !!lead.j?.data?.kpis);

  const my = await api(`/api/workspaces/${wsId}/my-dashboard`);
  console.log("my-dashboard", my.status, my.j?.data?.tasks?.length);
})().catch(console.error);
