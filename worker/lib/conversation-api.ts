/**
 * API hoi thoai dung chung cho chat khach va hop thu quan tri.
 *
 * Bot dung LAI dung ham sinh cau tra loi cua `/api/chat` (truyen vao qua `respond`),
 * nen ca website chi co MOT chatbot, khong co ban thu hai chay song song.
 */
import {
  ConversationStore,
  isValidConversationId,
  newId,
  type Channel,
  type Conversation,
  type ConversationStatus,
} from "./conversation-store.ts";
import { issueAdminToken, requireAdmin } from "./admin-auth.ts";
import {
  isMessengerId,
  listMessengerConversations,
  messengerConfigured,
  readMessengerConversation,
  replyOnMessenger,
  type MessengerEnv,
} from "./messenger-bridge.ts";

export type AiResponder = (
  messages: Array<{ role: string; content: string }>,
  pageContext: string,
  serviceContext: string,
) => Promise<string | null>;

export type ConversationEnv = MessengerEnv & {
  ADMIN_PASSWORD?: string;
  META_PAGE_ACCESS_TOKEN?: string;
  META_APP_SECRET?: string;
  META_VERIFY_TOKEN?: string;
};

/** Anh luu thang trong ban ghi KV duoi dang data URL. Gioi han 25 MB moi gia tri KV,
 *  nhung mot hoi thoai co nhieu anh, nen chan tung anh o muc nay. Frontend da thu nho
 *  anh truoc khi gui. */
const MAX_IMAGE_CHARS = 700_000;
const MAX_TEXT = 2_000;
/** Cua so nhan tin cua Meta: 24 gio ke tu tin cuoi CUA KHACH. */
const MESSENGER_WINDOW_MS = 24 * 60 * 60 * 1000;
/** So luot gan nhat dua cho model lam ngu canh. */
const CONTEXT_TURNS = 10;

type JsonInit = { status?: number; headers?: Record<string, string> };

export function makeJson(cors: Record<string, string>) {
  return (data: unknown, init: JsonInit = {}) => new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...cors,
      ...init.headers,
    },
  });
}

function cleanText(value: unknown, limit = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/** Chi nhan data URL anh do chinh trinh duyet tao ra, khong nhan URL ngoai: nhan URL
 *  tuy y se bien hop thu thanh cong cu tai noi dung tu mien la. */
function cleanImage(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "";
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw)) return "";
  if (raw.length > MAX_IMAGE_CHARS) return "";
  return raw;
}

function publicView(conversation: Conversation) {
  return {
    conversationId: conversation.conversationId,
    status: conversation.status,
    aiEnabled: conversation.aiEnabled,
    lastMessageAt: conversation.lastMessageAt,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      sender: message.sender,
      content: message.content,
      imageUrl: message.imageUrl,
      type: message.type,
      createdAt: message.createdAt,
    })),
  };
}

function promptMessages(conversation: Conversation) {
  return conversation.messages
    .slice(-CONTEXT_TURNS)
    .filter((message) => message.sender !== "staff" || message.content)
    .map((message) => ({
      role: message.sender === "customer" ? "user" : "assistant",
      content: message.content || (message.type === "image" ? "[Khách gửi một ảnh]" : ""),
    }))
    .filter((message) => message.content);
}

/**
 * Messenger duoc coi la da ket noi khi co cau noi sang worker Messenger dang chay
 * that cua DST. Khong dua tren viec co bien META_* trong file nay: webhook va Send
 * API do worker kia nam giu, o day chi doc/ghi qua API quan tri cua no.
 */
export function messengerReady(env: ConversationEnv) {
  return messengerConfigured(env);
}

export async function handleConversationApi(
  request: Request,
  url: URL,
  env: ConversationEnv,
  store: ConversationStore,
  respond: AiResponder,
  json: ReturnType<typeof makeJson>,
): Promise<Response | null> {
  const path = url.pathname;

  // ----- Khach tren website -----

  if (path === "/api/web-chat" && request.method === "POST") {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const message = cleanText(body?.message);
    const image = cleanImage(body?.imageDataUrl);
    if (!message && !image) return json({ error: "EMPTY_MESSAGE" }, { status: 400 });

    const requested = body?.conversationId;
    const conversationId = isValidConversationId(requested) ? requested : newId();
    const customerId = isValidConversationId(body?.customerId) ? String(body.customerId) : conversationId;

    let conversation = await store.ensure(conversationId, "web", customerId);
    conversation = await store.appendMessage(conversation, {
      sender: "customer",
      content: message,
      type: image ? "image" : "text",
      ...(image ? { imageUrl: image } : {}),
    });

    // Nhan vien da tiep quan -> bot dung han, khong chen vao cung phien.
    if (!conversation.aiEnabled) {
      return json({
        conversationId,
        aiEnabled: false,
        handedOver: true,
        conversation: publicView(conversation),
      });
    }

    const pageContext = cleanText(body?.pageContext, 160);
    const serviceContext = cleanText(body?.serviceContext, 900);
    let answer: string | null = null;
    let failure = "";
    try {
      answer = await respond(promptMessages(conversation), pageContext, serviceContext);
    } catch {
      failure = "AI_PROVIDER_FAILED";
    }

    if (!answer) {
      // Khong bia cau tra loi. Tin cua khach VAN duoc luu de nhan vien thay trong
      // hop thu va tra loi tay.
      return json({
        conversationId,
        aiEnabled: true,
        error: failure || "AI_NOT_CONFIGURED",
        conversation: publicView(conversation),
      }, { status: failure ? 502 : 503 });
    }

    conversation = await store.appendMessage(conversation, {
      sender: "bot",
      content: answer,
      type: "text",
    });
    return json({ conversationId, aiEnabled: true, conversation: publicView(conversation) });
  }

  if (path === "/api/web-history" && request.method === "GET") {
    const conversationId = url.searchParams.get("conversationId") ?? "";
    const conversation = await store.get(conversationId);
    if (!conversation) return json({ conversation: null });
    return json({ conversation: publicView(conversation) });
  }

  if (path === "/api/web-history" && request.method === "DELETE") {
    const conversationId = url.searchParams.get("conversationId") ?? "";
    await store.remove(conversationId);
    return json({ ok: true });
  }

  // ----- Hop thu quan tri -----

  if (path === "/api/admin/login" && request.method === "POST") {
    if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_NOT_CONFIGURED" }, { status: 503 });
    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    const password = typeof body?.password === "string" ? body.password : "";
    if (password !== env.ADMIN_PASSWORD) return json({ error: "WRONG_PASSWORD" }, { status: 401 });
    return json({ token: await issueAdminToken(env.ADMIN_PASSWORD) });
  }

  if (path.startsWith("/api/admin/")) {
    if (!await requireAdmin(request, env.ADMIN_PASSWORD)) {
      return json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (path === "/api/admin/inbox" && request.method === "GET") {
      const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const status = url.searchParams.get("status") ?? "";
      let items = await store.list();

      // Gop hoi thoai Messenger tu worker DST vao cung mot danh sach. Loi ben do
      // KHONG duoc lam sap hop thu web: bao co rieng de giao dien noi that.
      let messengerError = "";
      if (messengerConfigured(env)) {
        try {
          items = [...items, ...await listMessengerConversations(env)]
            .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
        } catch {
          messengerError = "MESSENGER_FETCH_FAILED";
        }
      }

      if (status && status !== "all") items = items.filter((item) => item.status === status);
      if (query) {
        items = items.filter((item) => item.conversationId.toLowerCase().includes(query)
          || item.preview.toLowerCase().includes(query));
      }
      return json({
        conversations: items,
        messengerConfigured: messengerReady(env),
        ...(messengerError ? { messengerError } : {}),
      });
    }

    if (path === "/api/admin/conversation" && request.method === "GET") {
      const id = url.searchParams.get("id") ?? "";
      if (isMessengerId(id)) {
        const remote = await readMessengerConversation(env, id);
        if (!remote) return json({ error: "NOT_FOUND" }, { status: 404 });
        return json({ conversation: remote });
      }
      const conversation = await store.get(id);
      if (!conversation) return json({ error: "NOT_FOUND" }, { status: 404 });
      return json({ conversation });
    }

    if (path === "/api/admin/reply" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      const conversationId = cleanText(body?.conversationId, 96);
      const content = cleanText(body?.content);
      const image = cleanImage(body?.imageDataUrl);
      if (!content && !image) return json({ error: "EMPTY_MESSAGE" }, { status: 400 });

      // Hoi thoai Messenger: gui THAT qua worker Messenger cua DST (worker do goi
      // Meta Send API). Chua noi duoc thi bao that, khong ghi tin roi coi nhu da gui.
      if (isMessengerId(conversationId)) {
        if (!messengerConfigured(env)) {
          return json({ error: "MESSENGER_NOT_CONNECTED", messengerConfigured: false }, { status: 503 });
        }
        if (image) {
          // Worker Messenger hien chi nhan van ban. Noi ro thay vi gui am tham roi
          // mat anh.
          return json({ error: "MESSENGER_IMAGE_UNSUPPORTED" }, { status: 400 });
        }
        const participantId = cleanText(body?.participantId, 96);
        if (!participantId) return json({ error: "MISSING_PARTICIPANT" }, { status: 400 });

        // Meta chi cho Trang chu dong nhan lai trong 24 gio ke tu tin CUA KHACH.
        // Tinh theo tin cuoi cua khach, khong phai tin cuoi cua hoi thoai: bot tra
        // loi khong lam moi cua so nay. Chan tu day de bao dung ly do, thay vi de
        // Meta tu choi roi doan mo ho la "sai the quan tri".
        const current = await readMessengerConversation(env, conversationId);
        const lastCustomer = current?.messages.filter((item) => item.sender === "customer").pop();
        if (lastCustomer) {
          const age = Date.now() - new Date(lastCustomer.createdAt).getTime();
          if (Number.isFinite(age) && age > MESSENGER_WINDOW_MS) {
            return json({
              error: "MESSENGER_WINDOW_EXPIRED",
              lastCustomerAt: lastCustomer.createdAt,
            }, { status: 409 });
          }
        }

        try {
          await replyOnMessenger(env, participantId, content);
        } catch {
          return json({ error: "MESSENGER_SEND_FAILED" }, { status: 502 });
        }
        const refreshed = await readMessengerConversation(env, conversationId);
        return json({ conversation: refreshed });
      }

      const conversation = await store.get(conversationId);
      if (!conversation) return json({ error: "NOT_FOUND" }, { status: 404 });

      const next = await store.appendMessage(conversation, {
        sender: "staff",
        content,
        type: image ? "image" : "text",
        ...(image ? { imageUrl: image } : {}),
      });
      return json({ conversation: next });
    }

    if (path === "/api/admin/status" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      // Trang thai va co bat/tat bot cua hoi thoai Messenger do worker Messenger nam
      // giu, khong doi tu day duoc. Bao ro thay vi im lang khong co tac dung.
      if (isMessengerId(cleanText(body?.conversationId, 96))) {
        return json({ error: "MESSENGER_READ_ONLY" }, { status: 400 });
      }
      const conversation = await store.get(cleanText(body?.conversationId, 64));
      if (!conversation) return json({ error: "NOT_FOUND" }, { status: 404 });
      const status = body?.status;
      if (status !== "new" && status !== "open" && status !== "resolved") {
        return json({ error: "BAD_STATUS" }, { status: 400 });
      }
      const next: Conversation = { ...conversation, status: status as ConversationStatus };
      await store.save(next);
      return json({ conversation: next });
    }

    if (path === "/api/admin/takeover" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (isMessengerId(cleanText(body?.conversationId, 96))) {
        return json({ error: "MESSENGER_READ_ONLY" }, { status: 400 });
      }
      const conversation = await store.get(cleanText(body?.conversationId, 64));
      if (!conversation) return json({ error: "NOT_FOUND" }, { status: 404 });
      const takeOver = body?.takeOver !== false;
      const next: Conversation = {
        ...conversation,
        // Tiep quan = tat bot. Tra lai = bat bot.
        aiEnabled: !takeOver,
        assignedTo: takeOver ? cleanText(body?.assignedTo, 80) || "Nhân viên DST" : "",
        status: takeOver && conversation.status === "new" ? "open" : conversation.status,
      };
      await store.save(next);
      return json({ conversation: next });
    }

    return json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return null;
}

export type { Channel, Conversation };
