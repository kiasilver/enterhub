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
  const res = await fetch(BASE + "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookie(),
    },
    body,
    redirect: "manual",
  });
  store(res);

  const wsId = "cmrv5m29z0012o98gpdypz0xo";
  const rooms = await api(`/api/workspaces/${wsId}/chat/rooms`);
  console.log("rooms", rooms.status, rooms.j?.data?.[0]?.id);
  const rid = rooms.j?.data?.[0]?.id;
  const msgs = await api(`/api/workspaces/${wsId}/chat/rooms/${rid}/messages`);
  console.log("messages GET", msgs.status, Array.isArray(msgs.j?.data), msgs.j?.error);
  const send = await api(`/api/workspaces/${wsId}/chat/rooms/${rid}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: "probe chat from agent" }),
  });
  console.log("messages POST", send.status, send.j?.error || send.j?.data?.id);

  const mail = await api(`/api/workspaces/${wsId}/mail?folder=inbox`);
  console.log("mail inbox", mail.status, mail.j?.data?.length);

  const members = await api(`/api/workspaces/${wsId}/members`);
  const mina = members.j.data.find((m: any) => m.user.email.startsWith("mina"));
  const mailSend = await api(`/api/workspaces/${wsId}/mail`, {
    method: "POST",
    body: JSON.stringify({
      toUserId: mina.userId,
      subject: "Agent probe",
      body: "hello from smoke",
    }),
  });
  console.log("mail send", mailSend.status, mailSend.j?.error || "ok");

  // Does GET on card with trailing path segment hit card route somehow?
  const weird = await api(
    `/api/boards/cmrwkiasf000mo9lowj8w2f28/cards/cmrwkkgew0015o9lo5iq8p81j/assignees`,
  );
  console.log("assignees again", weird.status);

  // Try views
  const views = await api(
    `/api/boards/cmrwkiasf000mo9lowj8w2f28/cards/cmrwkkgew0015o9lo5iq8p81j/views`,
  );
  console.log("views", views.status, views.j?.error || views.j?.html);

  // Try create path
  const createPath = await api(
    `/api/boards/cmrwkiasf000mo9lowj8w2f28/cards/create`,
  );
  console.log("cards/create", createPath.status, createPath.j?.error || createPath.j?.html);
})().catch(console.error);
