/**
 * Multi-role RBAC smoke: owner, lead, developer
 */
const BASE = "http://localhost:3000";

type Jar = Map<string, string>;

function store(jar: Jar, res: Response) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [p] = c.split(";");
    const i = p.indexOf("=");
    if (i > 0) jar.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }
}
function cookie(jar: Jar) {
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}
async function api(jar: Jar, path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers);
  h.set("cookie", cookie(jar));
  if (init.body && !h.has("content-type")) h.set("content-type", "application/json");
  const res = await fetch(BASE + path, { ...init, headers: h, redirect: "manual" });
  store(jar, res);
  const t = await res.text();
  let j: any;
  try {
    j = JSON.parse(t);
  } catch {
    j = { html: t.includes("DOCTYPE") };
  }
  return { status: res.status, j };
}

async function login(email: string) {
  const jar: Jar = new Map();
  const csrf = await api(jar, "/api/auth/csrf");
  const body = new URLSearchParams({
    csrfToken: csrf.j.csrfToken,
    email,
    password: "Demo1234!",
    callbackUrl: BASE + "/",
    json: "true",
  });
  store(
    jar,
    await fetch(BASE + "/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: cookie(jar),
      },
      body,
      redirect: "manual",
    }),
  );
  const session = await api(jar, "/api/auth/session");
  console.log(`login ${email} -> ${session.j?.user?.email || "FAIL"}`);
  return { jar, user: session.j?.user };
}

function ok(label: string, cond: boolean, detail?: string) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${label}${detail ? " — " + detail : ""}`);
  if (!cond) throw new Error(label);
}

(async () => {
  const wsId = "cmrv5m29z0012o98gpdypz0xo";
  const owner = await login("owner@enteredge.dev");
  const lead = await login("lead@enteredge.dev");
  const ali = await login("ali.dev@enteredge.dev");

  // Lead can read lead dashboard
  const ld = await api(lead.jar, `/api/workspaces/${wsId}/lead-dashboard`);
  ok(
    "lead dashboard as lead",
    ld.status === 200 && !!ld.j?.data?.kpis,
    `${ld.status} ${JSON.stringify(ld.j).slice(0, 200)}`,
  );

  // Soft-fail path: continue other checks even if we want strict later
  // Ali can read my-dashboard
  const my = await api(ali.jar, `/api/workspaces/${wsId}/my-dashboard`);
  ok("my-dashboard as ali", my.status === 200 && Array.isArray(my.j?.data?.tasks));

  // Owner creates board + card assigned to ali
  const board = await api(owner.jar, `/api/workspaces/${wsId}/boards`, {
    method: "POST",
    body: JSON.stringify({ name: `RBAC Board ${Date.now()}`, visibility: "WORKSPACE" }),
  });
  ok("owner create board", board.status === 201);
  const boardId = board.j.data.id;
  const lists = await api(owner.jar, `/api/boards/${boardId}/cards`);
  const listId = lists.j.data.lists[0].id;
  const card = await api(owner.jar, `/api/boards/${boardId}/cards`, {
    method: "POST",
    body: JSON.stringify({
      title: "RBAC assigned to Ali",
      listId,
      assigneeIds: [ali.user.id],
    }),
  });
  ok("create assigned card", card.status === 201 || card.status === 200);
  const cardId = card.j.data.id;

  // Ali can comment
  const cmt = await api(ali.jar, `/api/boards/${boardId}/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body: "Ali commenting on assigned card" }),
  });
  ok("ali can comment", cmt.status === 201 || cmt.status === 200, String(cmt.status));

  // Ali try delete — expect forbid for member without card:delete
  const del = await api(ali.jar, `/api/boards/${boardId}/cards/${cardId}`, {
    method: "DELETE",
  });
  ok(
    "ali cannot delete card (403)",
    del.status === 403,
    `status=${del.status}`,
  );

  // Ali cannot create board if MEMBER without board:create
  const aliBoard = await api(ali.jar, `/api/workspaces/${wsId}/boards`, {
    method: "POST",
    body: JSON.stringify({ name: "Ali should not create" }),
  });
  ok(
    "ali board:create gated",
    aliBoard.status === 403,
    `status=${aliBoard.status}`,
  );

  // Team / chat / mail as lead
  const team = await api(lead.jar, `/api/workspaces/${wsId}/members`);
  ok("lead members", team.status === 200 && team.j.data.length >= 10);
  const rooms = await api(lead.jar, `/api/workspaces/${wsId}/chat/rooms`);
  ok("lead chat rooms", rooms.status === 200);
  const mail = await api(lead.jar, `/api/workspaces/${wsId}/mail?folder=inbox`);
  ok("lead mail inbox", mail.status === 200);

  console.log("\n=== MULTI-ROLE CHECKS DONE ===");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
