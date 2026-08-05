/**
 * Lop goi API hoi thoai. Dung chung cho khung chat khach va hop thu quan tri, tach
 * han khoi giao dien de doi backend khong phai sua component nao.
 *
 * Lich su THAT nam tren server (Cloudflare KV). Trinh duyet chi giu duy nhat
 * `conversationId` de tai lai trang con nhan ra phien cu.
 */

export type MessageSender = "customer" | "bot" | "staff";

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  content: string;
  imageUrl?: string;
  type: "text" | "image";
  createdAt: string;
};

export type PublicConversation = {
  conversationId: string;
  status: "new" | "open" | "resolved";
  aiEnabled: boolean;
  lastMessageAt: string;
  messages: ConversationMessage[];
};

export type ConversationSummary = {
  conversationId: string;
  channel: "web" | "messenger";
  customerId: string;
  customerName?: string;
  status: "new" | "open" | "resolved";
  assignedTo: string;
  aiEnabled: boolean;
  lastMessageAt: string;
  messageCount: number;
  preview: string;
};

export type AdminConversation = ConversationSummary & { messages: ConversationMessage[] };

export class ConversationError extends Error {
  readonly status: number;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
  }
}

const SESSION_KEY = "dst-conversation-id-v1";
const ADMIN_TOKEN_KEY = "dst-admin-token-v1";

function apiBase() {
  if (typeof window === "undefined") return "";
  const config = (window as Window & { __DST_CHAT_CONFIG__?: { apiBase?: string } }).__DST_CHAT_CONFIG__;
  return config?.apiBase ?? "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, init);
  } catch {
    throw new ConversationError(0, "NETWORK_UNREACHABLE");
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!response.ok) throw new ConversationError(response.status, data.error ?? "REQUEST_FAILED");
  return data as T;
}

/* ---------- Phia khach ---------- */

export function loadConversationId(): string {
  try {
    return window.localStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveConversationId(conversationId: string) {
  try {
    window.localStorage.setItem(SESSION_KEY, conversationId);
  } catch {
    // Trinh duyet chan storage: phien van chay trong bo nho, chi mat sau khi tai lai.
  }
}

export function clearConversationId() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Khong con gi de xoa.
  }
}

export type SendResult = {
  conversationId: string;
  aiEnabled: boolean;
  handedOver?: boolean;
  conversation: PublicConversation;
};

export function sendCustomerMessage(input: {
  conversationId: string;
  message: string;
  imageDataUrl?: string;
  pageContext: string;
  serviceContext?: string;
}) {
  return request<SendResult>("/api/web-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      message: input.message,
      ...(input.imageDataUrl ? { imageDataUrl: input.imageDataUrl } : {}),
      pageContext: input.pageContext,
      ...(input.serviceContext ? { serviceContext: input.serviceContext } : {}),
    }),
  });
}

export async function fetchCustomerHistory(conversationId: string) {
  if (!conversationId) return null;
  const data = await request<{ conversation: PublicConversation | null }>(
    `/api/web-history?conversationId=${encodeURIComponent(conversationId)}`,
  );
  return data.conversation;
}

export function deleteCustomerHistory(conversationId: string) {
  return request<{ ok: boolean }>(
    `/api/web-history?conversationId=${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
  );
}

/* ---------- Phia nhan vien ---------- */

export function loadAdminToken(): string {
  try {
    // sessionStorage: dong tab la mat quyen, khong de lai the tren may dung chung.
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveAdminToken(token: string) {
  try {
    window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Bo qua.
  }
}

export function clearAdminToken() {
  try {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Bo qua.
  }
}

export async function adminLogin(password: string) {
  const data = await request<{ token: string }>("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return data.token;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function fetchInbox(token: string, options: { query?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (options.query) params.set("q", options.query);
  if (options.status && options.status !== "all") params.set("status", options.status);
  const suffix = params.toString() ? `?${params}` : "";
  return request<{
    conversations: ConversationSummary[];
    messengerConfigured: boolean;
    messengerError?: string;
  }>(`/api/admin/inbox${suffix}`, { headers: authHeaders(token) });
}

export function fetchAdminConversation(token: string, conversationId: string) {
  return request<{ conversation: AdminConversation }>(
    `/api/admin/conversation?id=${encodeURIComponent(conversationId)}`,
    { headers: authHeaders(token) },
  );
}

export function sendStaffReply(token: string, input: {
  conversationId: string;
  content: string;
  imageDataUrl?: string;
  /** Bat buoc voi hoi thoai Messenger: Send API cua Meta gui theo PSID cua nguoi dung. */
  participantId?: string;
}) {
  return request<{ conversation: AdminConversation }>("/api/admin/reply", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function setConversationStatus(token: string, conversationId: string, status: string) {
  return request<{ conversation: AdminConversation }>("/api/admin/status", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, status }),
  });
}

export function setConversationTakeover(token: string, input: {
  conversationId: string;
  takeOver: boolean;
  assignedTo?: string;
}) {
  return request<{ conversation: AdminConversation }>("/api/admin/takeover", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Thu nho anh truoc khi gui: ban ghi KV co gioi han, va anh goc tu dien thoai
 *  thuong 3-8 MB. Tra ve data URL de luu thang trong tin nhan. */
export async function prepareImage(file: File, maxSize = 1200): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("UNSUPPORTED_IMAGE");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("IMAGE_PROCESSING_FAILED");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.6, 0.5]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= 700_000) return url;
  }
  throw new Error("IMAGE_TOO_LARGE");
}
