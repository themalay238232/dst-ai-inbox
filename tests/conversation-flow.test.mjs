/**
 * Kiem tra luong hoi thoai chung cua website va hop thu quan tri.
 *
 * Chay THANG tren ma nguon Worker (`worker/lib/*.ts`) qua che do strip-types cua Node,
 * voi mot KV gia trong bo nho. Khong can dung dev server, va cung khong kiem mot ban
 * sao logic nao khac — dung dung cac ham that ma Worker goi.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { ConversationStore } from "../worker/lib/conversation-store.ts";
import { handleConversationApi, makeJson } from "../worker/lib/conversation-api.ts";

const ADMIN_PASSWORD = "mat-khau-kiem-thu";
const json = makeJson({});

/** KV gia: cung hop dong get/put/delete ma Worker dung. */
function memoryKv() {
  const map = new Map();
  return {
    get: async (key) => (map.has(key) ? map.get(key) : null),
    put: async (key, value) => { map.set(key, value); },
    delete: async (key) => { map.delete(key); },
    _map: map,
  };
}

function setup({ answer = "Da, DST co dich vu nay.", env = {} } = {}) {
  const kv = memoryKv();
  const store = new ConversationStore(kv);
  const calls = [];
  const respond = async (messages, pageContext) => {
    calls.push({ messages, pageContext });
    return answer;
  };
  const fullEnv = { ADMIN_PASSWORD, ...env };
  const call = (method, path, { body, token, query = "" } = {}) => {
    const url = new URL(`http://local${path}${query}`);
    const request = new Request(url, {
      method,
      ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
    return handleConversationApi(request, url, fullEnv, store, respond, json);
  };
  return { store, call, calls, kv };
}

async function adminToken(call) {
  const res = await call("POST", "/api/admin/login", { body: { password: ADMIN_PASSWORD } });
  return (await res.json()).token;
}

test("tao hoi thoai web va luu tin nhan cua khach", async () => {
  const { call } = setup();
  const res = await call("POST", "/api/web-chat", { body: { message: "Toi can tu van TikTok Shop" } });
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.match(data.conversationId, /^[0-9a-f-]{36}$/);
  const senders = data.conversation.messages.map((m) => m.sender);
  assert.deepEqual(senders, ["customer", "bot"]);
  assert.equal(data.conversation.messages[0].content, "Toi can tu van TikTok Shop");
});

test("lay lai lich su theo conversationId sau khi khach tai lai trang", async () => {
  const { call } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "cau hoi dau tien" } })).json();

  const res = await call("GET", "/api/web-history", { query: `?conversationId=${created.conversationId}` });
  const data = await res.json();

  assert.equal(data.conversation.conversationId, created.conversationId);
  assert.equal(data.conversation.messages.length, 2);
  assert.equal(data.conversation.messages[0].content, "cau hoi dau tien");
});

test("bot tra loi va cau tra loi duoc luu de hop thu doc duoc", async () => {
  const { call, calls } = setup({ answer: "DST co dich vu TikTok Shop." });
  const data = await (await call("POST", "/api/web-chat", { body: { message: "co TikTok Shop khong" } })).json();

  const bot = data.conversation.messages.find((m) => m.sender === "bot");
  assert.equal(bot.content, "DST co dich vu TikTok Shop.");
  // Ngu canh gui cho model phai chua cau hoi cua khach.
  assert.equal(calls.length, 1);
  assert.equal(calls[0].messages.at(-1).content, "co TikTok Shop khong");

  const token = await adminToken(call);
  const inbox = await (await call("GET", "/api/admin/inbox", { token })).json();
  assert.equal(inbox.conversations.length, 1);
  assert.equal(inbox.conversations[0].messageCount, 2);
});

test("khong co nha cung cap AI thi bao that, van luu tin cua khach", async () => {
  const { call } = setup({ answer: null });
  const res = await call("POST", "/api/web-chat", { body: { message: "cau hoi" } });

  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.error, "AI_NOT_CONFIGURED");
  // Khong duoc bia cau tra loi thay the.
  assert.equal(data.conversation.messages.length, 1);
  assert.equal(data.conversation.messages[0].sender, "customer");
});

test("nhan vien tra loi va khach thay duoc trong lich su", async () => {
  const { call } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "xin chao" } })).json();
  const token = await adminToken(call);

  const replied = await call("POST", "/api/admin/reply", {
    token,
    body: { conversationId: created.conversationId, content: "Chao anh/chi, DST ho tro ngay a." },
  });
  assert.equal(replied.status, 200);

  const history = await (await call("GET", "/api/web-history", {
    query: `?conversationId=${created.conversationId}`,
  })).json();
  const staff = history.conversation.messages.filter((m) => m.sender === "staff");
  assert.equal(staff.length, 1);
  assert.equal(staff[0].content, "Chao anh/chi, DST ho tro ngay a.");
});

test("doi trang thai hoi thoai", async () => {
  const { call } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "xin chao" } })).json();
  const token = await adminToken(call);

  const res = await call("POST", "/api/admin/status", {
    token,
    body: { conversationId: created.conversationId, status: "resolved" },
  });
  assert.equal((await res.json()).conversation.status, "resolved");

  const bad = await call("POST", "/api/admin/status", {
    token,
    body: { conversationId: created.conversationId, status: "khong-hop-le" },
  });
  assert.equal(bad.status, 400);
});

test("nhan vien tiep quan thi bot dung tra loi trong cung phien", async () => {
  const { call, calls } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "cau hoi 1" } })).json();
  assert.equal(calls.length, 1);

  const token = await adminToken(call);
  const takeover = await call("POST", "/api/admin/takeover", {
    token,
    body: { conversationId: created.conversationId, assignedTo: "Ngoc" },
  });
  const after = (await takeover.json()).conversation;
  assert.equal(after.aiEnabled, false);
  assert.equal(after.assignedTo, "Ngoc");

  const second = await (await call("POST", "/api/web-chat", {
    body: { conversationId: created.conversationId, message: "cau hoi 2" },
  })).json();

  assert.equal(second.handedOver, true);
  // Diem mau chot: model KHONG duoc goi them lan nao nua.
  assert.equal(calls.length, 1);
  const senders = second.conversation.messages.map((m) => m.sender);
  assert.deepEqual(senders, ["customer", "bot", "customer"]);
});

test("tra hoi thoai lai cho bot thi bot hoat dong tro lai", async () => {
  const { call, calls } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "cau hoi 1" } })).json();
  const token = await adminToken(call);
  await call("POST", "/api/admin/takeover", { token, body: { conversationId: created.conversationId } });
  await call("POST", "/api/admin/takeover", {
    token,
    body: { conversationId: created.conversationId, takeOver: false },
  });

  await call("POST", "/api/web-chat", { body: { conversationId: created.conversationId, message: "cau hoi 2" } });
  assert.equal(calls.length, 2);
});

test("hop thu tu choi truy cap khi khong co the hop le", async () => {
  const { call } = setup();
  assert.equal((await call("GET", "/api/admin/inbox")).status, 401);
  assert.equal((await call("GET", "/api/admin/inbox", { token: "gia.mao" })).status, 401);

  const wrong = await call("POST", "/api/admin/login", { body: { password: "sai" } });
  assert.equal(wrong.status, 401);
});

test("Messenger chua cau hinh thi tu choi gui, khong gia lap thanh cong", async () => {
  const { call } = setup();
  const token = await adminToken(call);

  const res = await call("POST", "/api/admin/reply", {
    token,
    // Tien to `mess:` la dau hieu hoi thoai thuoc worker Messenger.
    body: { conversationId: "mess:12345", content: "tra loi", participantId: "psid-1" },
  });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, "MESSENGER_NOT_CONNECTED");
});

test("Messenger chua cau hinh thi hop thu bao chua ket noi va khong co hoi thoai Messenger", async () => {
  const { call } = setup();
  await call("POST", "/api/web-chat", { body: { message: "xin chao" } });
  const token = await adminToken(call);

  const data = await (await call("GET", "/api/admin/inbox", { token })).json();
  assert.equal(data.messengerConfigured, false);
  assert.equal(data.conversations.every((item) => item.channel === "web"), true);
});

test("hop thu khong doi duoc trang thai hay bot cua hoi thoai Messenger", async () => {
  // Trang thai va bot cua Messenger do he thong Messenger nam giu. Hop thu nay phai
  // tu choi dut khoat thay vi bam vao roi khong co tac dung gi.
  const { call } = setup();
  const token = await adminToken(call);

  for (const path of ["/api/admin/status", "/api/admin/takeover"]) {
    const res = await call("POST", path, {
      token,
      body: { conversationId: "mess:12345", status: "resolved" },
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "MESSENGER_READ_ONLY");
  }
});

test("xoa hoi thoai theo yeu cau cua khach", async () => {
  const { call } = setup();
  const created = await (await call("POST", "/api/web-chat", { body: { message: "xin chao" } })).json();

  await call("DELETE", "/api/web-history", { query: `?conversationId=${created.conversationId}` });

  const history = await (await call("GET", "/api/web-history", {
    query: `?conversationId=${created.conversationId}`,
  })).json();
  assert.equal(history.conversation, null);

  const token = await adminToken(call);
  const inbox = await (await call("GET", "/api/admin/inbox", { token })).json();
  assert.equal(inbox.conversations.length, 0);
});

test("Messenger: qua 24 gio ke tu tin cuoi cua khach thi chan gui, khong goi Send API", async () => {
  // Day la hanh vi phat hien khi chay that: cung mot the quan tri, hoi thoai vua
  // nhan tin hom nay thi gui duoc, hoi thoai cu 2 tuan thi Meta tu choi. Nguyen nhan
  // la cua so 24 gio, khong phai the sai — nen phai chan tu truoc va bao dung ly do.
  const goc = globalThis.fetch;
  const daGoi = [];
  const cuTuanTruoc = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();
  globalThis.fetch = async (input) => {
    // callMessenger truyen mot doi tuong Request, khong phai chuoi URL.
    const href = typeof input === "string" ? input : input.url;
    daGoi.push(href);
    if (href.includes("/api/admin/conversation")) {
      return new Response(JSON.stringify({
        conversation: {
          id: "t_1", channel: "messenger", participantId: "psid-1", name: "Khach Cu",
          updatedAt: cuTuanTruoc,
          messages: [{ id: "m1", role: "user", text: "chao", createdAt: cuTuanTruoc }],
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    const { call } = setup({
      env: {
        MESSENGER_WORKER_URL: "https://worker.example",
        MESSENGER_ADMIN_TOKEN: "the-kiem-thu",
      },
    });
    const token = await adminToken(call);
    const res = await call("POST", "/api/admin/reply", {
      token,
      body: { conversationId: "mess:t_1", content: "chao lai", participantId: "psid-1" },
    });

    assert.equal(res.status, 409);
    assert.equal((await res.json()).error, "MESSENGER_WINDOW_EXPIRED");
    // Diem mau chot: KHONG duoc goi sang duong gui tin.
    assert.equal(daGoi.some((href) => href.includes("/api/admin/reply")), false);
  } finally {
    globalThis.fetch = goc;
  }
});

test("Messenger: trong 24 gio thi gui that qua Send API", async () => {
  const goc = globalThis.fetch;
  const daGoi = [];
  const vuaXong = new Date(Date.now() - 60_000).toISOString();
  globalThis.fetch = async (input) => {
    const href = typeof input === "string" ? input : input.url;
    daGoi.push(href);
    if (href.includes("/api/admin/conversation")) {
      return new Response(JSON.stringify({
        conversation: {
          id: "t_2", channel: "messenger", participantId: "psid-2", name: "Khach Moi",
          updatedAt: vuaXong,
          messages: [{ id: "m1", role: "user", text: "chao", createdAt: vuaXong }],
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true, messageId: "mid.1" }), { status: 200 });
  };

  try {
    const { call } = setup({
      env: {
        MESSENGER_WORKER_URL: "https://worker.example",
        MESSENGER_ADMIN_TOKEN: "the-kiem-thu",
      },
    });
    const token = await adminToken(call);
    const res = await call("POST", "/api/admin/reply", {
      token,
      body: { conversationId: "mess:t_2", content: "chao lai", participantId: "psid-2" },
    });

    assert.equal(res.status, 200);
    assert.equal(daGoi.some((href) => href.includes("/api/admin/reply")), true);
  } finally {
    globalThis.fetch = goc;
  }
});
