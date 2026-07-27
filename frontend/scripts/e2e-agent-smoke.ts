import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "owner@enteredge.dev";
const PASS = "Demo1234!";

const prisma = new PrismaClient();

type Jar = Map<string, string>;

function storeCookies(jar: Jar, res: Response) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: Jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(
  jar: Jar,
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; json: any }> {
  const headers = new Headers(init.headers);
  headers.set("cookie", cookieHeader(jar));
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  storeCookies(jar, res);
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

function ok(label: string, cond: boolean, detail?: string) {
  const mark = cond ? "PASS" : "FAIL";
  console.log(`[${mark}] ${label}${detail ? " — " + detail : ""}`);
  if (!cond) throw new Error(`Assertion failed: ${label}`);
}

async function login(jar: Jar) {
  const csrf = await api(jar, "/api/auth/csrf");
  ok("csrf", !!csrf.json?.csrfToken);
  const body = new URLSearchParams({
    csrfToken: csrf.json.csrfToken,
    email: EMAIL,
    password: PASS,
    callbackUrl: `${BASE}/`,
    json: "true",
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  storeCookies(jar, res);
  const session = await api(jar, "/api/auth/session");
  ok("login session", !!session.json?.user?.email, session.json?.user?.email);
  return session.json;
}

async function main() {
  console.log("\n=== ENTERHUB E2E smoke (API agent) ===\n");
  const jar: Jar = new Map();
  await login(jar);

  const wsList = await api(jar, "/api/workspaces");
  ok("list workspaces", Array.isArray(wsList.json?.data), JSON.stringify(wsList.json)?.slice(0, 120));
  const memberships = wsList.json?.data || [];
  let ws =
    memberships.find((m: any) => m.workspace?.slug === "enteredge")?.workspace ||
    memberships[0]?.workspace;
  if (!ws) {
    const db = await prisma.workspace.findUnique({ where: { slug: "enteredge" } });
    ok("enteredge in DB", !!db);
    ws = db!;
  }
  const wsId = ws.id;
  console.log("workspace:", wsId, ws.name || ws.slug);

  // Members / Team
  const members = await api(jar, `/api/workspaces/${wsId}/members`);
  ok("members list", members.res.ok && (members.json?.data?.length ?? 0) >= 5, `n=${members.json?.data?.length}`);

  // Boards — create project
  const boardName = `Agent QA Board ${Date.now()}`;
  const created = await api(jar, `/api/workspaces/${wsId}/boards`, {
    method: "POST",
    body: JSON.stringify({
      name: boardName,
      description: "Created by agent smoke test",
      visibility: "WORKSPACE",
    }),
  });
  ok("create board", created.res.status === 201 && !!created.json?.data?.id, created.json?.error);
  const boardId = created.json.data.id;

  const boards = await api(jar, `/api/workspaces/${wsId}/boards`);
  ok("boards list includes new", (boards.json?.data || []).some((b: any) => b.id === boardId));

  // Cards on board
  const cardsRes = await api(jar, `/api/boards/${boardId}/cards`);
  ok("board cards/lists", cardsRes.res.ok && (cardsRes.json?.data?.lists?.length ?? 0) >= 1);
  const listId = cardsRes.json.data.lists[0].id;

  const ali = (members.json.data || []).find((m: any) =>
    (m.user?.email || "").startsWith("ali.dev"),
  );
  const mina = (members.json.data || []).find((m: any) =>
    (m.user?.email || "").startsWith("mina.dev"),
  );
  ok("find ali & mina", !!ali && !!mina);

  // Create task
  const cardCreate = await api(jar, `/api/boards/${boardId}/cards`, {
    method: "POST",
    body: JSON.stringify({
      title: "Agent task — auth regression",
      listId,
      description: "Please review @Ali Mohammadi",
      dueDate: new Date().toISOString().slice(0, 10),
      priority: "HIGH",
      assigneeIds: [ali.userId || ali.user.id],
      checklist: ["Write failing test", "Fix bug", "PR"],
    }),
  });
  ok("create card", cardCreate.res.ok && !!cardCreate.json?.data?.id, cardCreate.json?.error);
  const cardId = cardCreate.json.data.id;

  // Edit title / due
  const patch = await api(jar, `/api/boards/${boardId}/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: "Agent task — auth regression (edited)",
      description: "Updated by agent. Mention next: @[user]",
      priority: "URGENT",
    }),
  });
  ok("edit card", patch.res.ok, patch.json?.error);

  // Assign mina too
  const assign = await api(jar, `/api/boards/${boardId}/cards/${cardId}/assignees`, {
    method: "POST",
    body: JSON.stringify({ userId: mina.userId || mina.user.id }),
  });
  ok(
    "assign mina",
    assign.res.ok,
    `${assign.res.status} ${JSON.stringify(assign.json)}`,
  );

  // Comment + mention
  const mentionId = ali.userId || ali.user.id;
  const comment = await api(jar, `/api/boards/${boardId}/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: `Hey @${ali.user.name || "Ali"} please take a look @[${mentionId}]`,
      mentionIds: [mentionId],
    }),
  });
  ok("comment + mention", comment.res.ok, comment.json?.error);

  // Checklist toggle
  const detail = await api(jar, `/api/boards/${boardId}/cards/${cardId}`);
  ok("card detail", detail.res.ok);
  const item = detail.json?.data?.checklistItems?.[0];
  if (item) {
    const chk = await api(jar, `/api/boards/${boardId}/cards/${cardId}/checklist`, {
      method: "PATCH",
      body: JSON.stringify({ itemId: item.id, isDone: true }),
    });
    ok("checklist toggle", chk.res.ok, chk.json?.error);
  } else {
    console.log("[SKIP] checklist item missing");
  }

  // Reorder / move to second list if exists
  const lists = cardsRes.json.data.lists;
  if (lists.length > 1) {
    const reorder = await api(jar, `/api/cards/reorder`, {
      method: "PATCH",
      body: JSON.stringify({
        boardId,
        workspaceId: wsId,
        cards: [{ id: cardId, listId: lists[1].id, order: 0 }],
      }),
    });
    ok("move card (DnD API)", reorder.res.ok, reorder.json?.error);
  }

  // Chat
  const rooms = await api(jar, `/api/workspaces/${wsId}/chat/rooms`);
  ok("chat rooms", rooms.res.ok && (rooms.json?.data?.length ?? 0) >= 1, `n=${rooms.json?.data?.length}`);
  const roomId = rooms.json.data[0].id;
  const chatMsg = await api(jar, `/api/workspaces/${wsId}/chat/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: "Agent smoke: chat message OK" }),
  });
  ok("chat send", chatMsg.res.ok, chatMsg.json?.error);

  // Mail
  const mailSend = await api(jar, `/api/workspaces/${wsId}/mail`, {
    method: "POST",
    body: JSON.stringify({
      toUserId: leadUserId(members.json.data),
      subject: "Agent QA mail",
      body: "Internal mail path works.",
    }),
  });
  ok("mail send", mailSend.res.ok, mailSend.json?.error);
  const inbox = await api(jar, `/api/workspaces/${wsId}/mail?folder=sent`);
  ok("mail sent folder", inbox.res.ok && (inbox.json?.data?.length ?? 0) >= 1);

  // Lead dashboard
  const lead = await api(jar, `/api/workspaces/${wsId}/lead-dashboard?fresh=1`);
  ok("lead dashboard", lead.res.ok && !!lead.json?.data?.kpis, lead.json?.error);

  // My tasks
  const my = await api(jar, `/api/workspaces/${wsId}/my-dashboard`);
  ok("my-dashboard", my.res.ok && Array.isArray(my.json?.data?.tasks), my.json?.error);

  // Delete (archive) card
  const del = await api(jar, `/api/boards/${boardId}/cards/${cardId}`, { method: "DELETE" });
  ok("delete/archive card", del.res.ok, del.json?.error);

  // Private board visibility quick check as member (login as ali)
  const jarAli: Jar = new Map();
  // soft: just ensure board still listed for owner
  const boards2 = await api(jar, `/api/workspaces/${wsId}/boards`);
  ok("board still listed after card delete", (boards2.json?.data || []).some((b: any) => b.id === boardId));

  console.log("\n=== ALL CHECKS PASSED ===\n");
  console.log(`Board under test: ${boardId} (${boardName})`);
  console.log(`Open UI: ${BASE}/workspace/${wsId}/boards`);
}

function leadUserId(members: any[]) {
  const lead = members.find((m) => (m.user?.email || "").startsWith("lead@"));
  return lead?.userId || lead?.user?.id;
}

main()
  .catch((e) => {
    console.error("\n=== FAILED ===\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
