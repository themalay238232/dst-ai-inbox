/**
 * Cau noi sang worker Messenger da co san cua DST (`dst-group-messenger-ai`).
 *
 * Worker do DANG chay that: no nhan webhook cua Meta, luu hoi thoai Messenger va goi
 * Send API khi tra loi. Nen o day KHONG dung lai webhook/Send API lan hai — chi doc
 * va ghi qua API quan tri cua no.
 *
 * Toan bo lien lac la server-to-server. The admin nam trong bien moi truong cua
 * Worker, khong bao gio xuong trinh duyet.
 */

import type { ConversationMessage, ConversationSummary } from "./conversation-store.ts";

export type MessengerEnv = {
  MESSENGER_WORKER_URL?: string;
  MESSENGER_ADMIN_TOKEN?: string;
  /**
   * Service binding sang worker Messenger. CHI co tren ban deploy.
   *
   * Ly do phai co: Cloudflare CHAN mot Worker goi HTTP sang Worker khac cung zone
   * (`*.workers.dev`) — tra ve `error code: 1042`. Chay local thi khong dinh vi may
   * khong nam trong zone do, nen loi chi lo ra sau khi deploy.
   */
  MESSENGER?: { fetch(request: Request): Promise<Response> };
};

/** Ma hoi thoai Messenger duoc gan tien to de dinh tuyen khong nham voi hoi thoai web. */
const PREFIX = "mess:";

type RemoteSummary = {
  id?: string;
  /** Worker kia phuc vu CA hai kenh: chat khach cua he thong cu ("web") va Messenger
   *  that ("messenger"). Phai doc truong nay, neu khong se gan nham nhan. */
  channel?: string;
  participantId?: string;
  name?: string;
  updatedAt?: string;
  lastMessage?: string;
};

type RemoteMessage = {
  id?: string;
  role?: string;
  text?: string;
  createdAt?: string;
  images?: Array<{ url?: string }>;
};

export function messengerConfigured(env: MessengerEnv) {
  return Boolean(env.MESSENGER_WORKER_URL && env.MESSENGER_ADMIN_TOKEN);
}

export function isMessengerId(id: string) {
  return id.startsWith(PREFIX);
}

export function toRemoteId(id: string) {
  return id.slice(PREFIX.length);
}

/**
 * Mot cua duy nhat de goi sang worker Messenger.
 * Uu tien service binding (ban deploy), rot ve fetch thuong (ban local).
 */
function callMessenger(env: MessengerEnv, path: string, init: RequestInit = {}) {
  const url = `${env.MESSENGER_WORKER_URL}${path}`;
  const request = new Request(url, { ...init, headers: headers(env) });
  return env.MESSENGER ? env.MESSENGER.fetch(request) : fetch(request);
}

function headers(env: MessengerEnv) {
  return {
    Authorization: `Bearer ${env.MESSENGER_ADMIN_TOKEN}`,
    "Content-Type": "application/json",
    // Worker kia loc theo Origin; gui dung origin duoc phep cua no.
    Origin: "https://theluc205.github.io",
  };
}

/** Vai tro ben kia la user/assistant/staff; doi sang bo tu vung dung chung o day. */
function toSender(role: string | undefined): ConversationMessage["sender"] {
  if (role === "staff") return "staff";
  if (role === "assistant") return "bot";
  return "customer";
}

function mapMessage(message: RemoteMessage): ConversationMessage {
  const image = message.images?.find((item) => typeof item.url === "string")?.url;
  return {
    id: String(message.id ?? crypto.randomUUID()),
    sender: toSender(message.role),
    content: String(message.text ?? ""),
    type: image ? "image" : "text",
    ...(image ? { imageUrl: image } : {}),
    createdAt: String(message.createdAt ?? ""),
  };
}

/**
 * Danh sach hoi thoai Messenger, da doi sang dung hinh dang cua hop thu.
 *
 * Ben kia khong co khai niem trang thai/phu trach, nen phan do de mac dinh va giao
 * dien hien ro la khong doi duoc — thay vi bay ra mot o bam khong co tac dung.
 */
export async function listMessengerConversations(env: MessengerEnv): Promise<ConversationSummary[]> {
  if (!messengerConfigured(env)) return [];
  let response: Response;
  try {
    response = await callMessenger(env, "/api/admin/inbox");
  } catch (error) {
    // Ghi ly do THAT ra log. Loi o day thuong khong phai sai the ma la rang buoc cua
    // nen tang (vi du Worker khong duoc goi Worker khac cung zone).
    console.error(`[messenger] inbox fetch loi: ${String(error).slice(0, 300)}`);
    throw error;
  }
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    console.error(`[messenger] inbox ${response.status} ${detail}`);
    throw new Error(`messenger inbox failed: ${response.status}`);
  }
  const data = (await response.json()) as { conversations?: RemoteSummary[] };
  return (data.conversations ?? [])
    // CHI lay hoi thoai Messenger that. Hoi thoai "web" ben do la cua he thong chat
    // cu; gop vao day se gan nham nhan Messenger cho khach website, va trung lap voi
    // hop thu web da co san o kho KV cua chinh du an nay.
    .filter((item) => item.id && item.channel === "messenger")
    .map((item) => ({
      conversationId: `${PREFIX}${item.id}`,
      channel: "messenger" as const,
      customerId: String(item.participantId ?? item.id ?? ""),
      customerName: String(item.name ?? ""),
      status: "new" as const,
      // Worker kia khong co khai niem nhan vien phu trach; de trong thay vi nhet ten
      // khach vao day (truoc do hop thu hien "Phu trach: Long Vu" — Long Vu la KHACH).
      assignedTo: "",
      aiEnabled: true,
      lastMessageAt: String(item.updatedAt ?? ""),
      messageCount: 0,
      preview: String(item.lastMessage ?? ""),
    }));
}

export async function readMessengerConversation(env: MessengerEnv, conversationId: string) {
  if (!messengerConfigured(env)) return null;
  const query = new URLSearchParams({ channel: "messenger", id: toRemoteId(conversationId) });
  const response = await callMessenger(env, `/api/admin/conversation?${query}`);
  if (!response.ok) return null;
  const data = (await response.json()) as {
    conversation?: RemoteSummary & { messages?: RemoteMessage[] };
  };
  const remote = data.conversation;
  if (!remote) return null;
  const messages = (remote.messages ?? []).map(mapMessage);
  return {
    conversationId,
    channel: "messenger" as const,
    customerId: String(remote.participantId ?? ""),
    customerName: String(remote.name ?? ""),
    status: "new" as const,
    assignedTo: "",
    aiEnabled: true,
    lastMessageAt: String(remote.updatedAt ?? ""),
    messageCount: messages.length,
    preview: String(remote.lastMessage ?? ""),
    messages,
  };
}

/** Gui that qua Meta Send API — do worker kia thuc hien. */
export async function replyOnMessenger(
  env: MessengerEnv,
  participantId: string,
  text: string,
): Promise<void> {
  if (!messengerConfigured(env)) throw new Error("MESSENGER_NOT_CONNECTED");
  const response = await callMessenger(env, "/api/admin/reply", {
    method: "POST",
    body: JSON.stringify({ participantId, text }),
  });
  if (!response.ok) {
    // Ghi ly do THAT ra log may chu. Truoc do loi bi nuot, giao dien chi noi chung
    // chung "kiem tra the quan tri" — trong khi nguyen nhan thuong la cua so 24 gio
    // cua Meta chu khong phai the sai.
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    console.error(`[messenger] reply ${response.status} psid=${participantId} ${detail}`);
    throw new Error(`messenger reply failed: ${response.status}`);
  }
}
