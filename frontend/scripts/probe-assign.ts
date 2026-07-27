import { writeFileSync } from "fs";

const BASE = "http://localhost:3000";
const jar = new Map<string, string>();
const log: string[] = [];

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
    j = { html: t.slice(0, 120) };
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
  log.push(`login ${res.status}`);

  const ws = await api("/api/workspaces");
  const wsId = ws.j.data.find((m: any) => m.workspace.slug === "enteredge").workspace
    .id;
  log.push(`ws ${wsId}`);

  const boards = await api(`/api/workspaces/${wsId}/boards`);
  const board =
    boards.j.data.find((b: any) => String(b.name || "").includes("Agent QA")) ||
    boards.j.data[0];
  log.push(`board ${board.id} ${board.name}`);

  const cards = await api(`/api/boards/${board.id}/cards`);
  log.push(`cards status ${cards.status} lists ${cards.j?.data?.lists?.length}`);
  const listId = cards.j.data.lists[0].id;

  const create = await api(`/api/boards/${board.id}/cards`, {
    method: "POST",
    body: JSON.stringify({ title: "assign-probe", listId }),
  });
  log.push(`create ${create.status} ${create.j?.data?.id}`);
  const cid = create.j?.data?.id;

  const g = await api(`/api/boards/${board.id}/cards/${cid}/assignees`);
  log.push(`GET assignees ${g.status} ${JSON.stringify(g.j).slice(0, 200)}`);

  const members = await api(`/api/workspaces/${wsId}/members`);
  const mina = members.j.data.find((m: any) => m.user.email.startsWith("mina"));
  log.push(`mina ${mina?.userId}`);

  const p = await api(`/api/boards/${board.id}/cards/${cid}/assignees`, {
    method: "POST",
    body: JSON.stringify({ userId: mina.userId }),
  });
  log.push(`POST assign ${p.status} ${JSON.stringify(p.j).slice(0, 300)}`);

  // try comments
  const cmt = await api(`/api/boards/${board.id}/cards/${cid}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: `Hey @${mina.user.name} please look`,
      mentionIds: [mina.userId],
    }),
  });
  log.push(`comment ${cmt.status} ${JSON.stringify(cmt.j).slice(0, 200)}`);

  const detail = await api(`/api/boards/${board.id}/cards/${cid}`);
  log.push(`GET card ${detail.status}`);
  const patch = await api(`/api/boards/${board.id}/cards/${cid}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "assign-probe-edited" }),
  });
  log.push(`PATCH card ${patch.status}`);
  const chk = await api(`/api/boards/${board.id}/cards/${cid}/checklist`, {
    method: "POST",
    body: JSON.stringify({ title: "item1" }),
  });
  log.push(`POST checklist ${chk.status} ${JSON.stringify(chk.j).slice(0, 150)}`);
  const complete = await api(`/api/boards/${board.id}/cards/${cid}/complete`, {
    method: "POST",
  });
  log.push(`POST complete ${complete.status} ${JSON.stringify(complete.j).slice(0, 150)}`);

  writeFileSync("tmp-assign-probe.txt", log.join("\n"), "utf8");
  console.log(log.join("\n"));
})().catch((e) => {
  writeFileSync("tmp-assign-probe.txt", String(e), "utf8");
  console.error(e);
  process.exit(1);
});
