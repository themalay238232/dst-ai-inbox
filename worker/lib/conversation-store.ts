/**
 * Kho hoi thoai dung chung cho ca chat khach tren website va hop thu quan tri.
 *
 * Luu bang Cloudflare KV (binding `CONVERSATIONS`). O local, plugin Cloudflare chay
 * miniflare va cap mot KV that ghi xuong `.wrangler/state`, nen day la luu tru phia
 * SERVER thuc su — khong phai localStorage — va len production doi sang KV that ma
 * khong phai sua ma nguon.
 *
 * KV khong truy van duoc, nen ngoai moi ban ghi hoi thoai con mot khoa chi muc rieng
 * giu danh sach tom tat de hop thu ve duoc man danh sach ma khong phai doc het.
 */

export type Channel = "web" | "messenger";
export type ConversationStatus = "new" | "open" | "resolved";
export type MessageSender = "customer" | "bot" | "staff";
export type MessageType = "text" | "image";

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  content: string;
  imageUrl?: string;
  type: MessageType;
  createdAt: string;
};

export type Conversation = {
  conversationId: string;
  channel: Channel;
  customerId: string;
  status: ConversationStatus;
  assignedTo: string;
  messages: ConversationMessage[];
  lastMessageAt: string;
  /** Bot chi tra loi khi co nay bat. Nhan vien tiep quan -> tat, bot khong chen vao nua. */
  aiEnabled: boolean;
  createdAt: string;
};

export type ConversationSummary = {
  conversationId: string;
  channel: Channel;
  customerId: string;
  /** Ten hien thi cua khach, neu kenh do biet (Messenger co, chat web an danh thi khong). */
  customerName?: string;
  status: ConversationStatus;
  assignedTo: string;
  aiEnabled: boolean;
  lastMessageAt: string;
  messageCount: number;
  preview: string;
};

export interface ConversationKv {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const CONVERSATION_PREFIX = "conv:";
const INDEX_KEY = "index:conversations";
/** Tran tin nhan giu lai moi hoi thoai. Du dai cho mot phien tu van, va chan mot
 *  khach spam lam phinh mot ban ghi KV (gioi han 25 MB moi gia tri). */
const MAX_MESSAGES = 200;
/** Tran so hoi thoai trong chi muc. */
const MAX_INDEX = 500;
const PREVIEW_LENGTH = 120;

function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return crypto.randomUUID();
}

function conversationKey(conversationId: string) {
  return `${CONVERSATION_PREFIX}${conversationId}`;
}

/** Ma phien do khach gui len: chi nhan UUID, khong nhan chuoi tuy y. */
export function isValidConversationId(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function summarize(conversation: Conversation): ConversationSummary {
  const last = conversation.messages[conversation.messages.length - 1];
  const preview = last
    ? (last.type === "image" && !last.content ? "[Hình ảnh]" : last.content).slice(0, PREVIEW_LENGTH)
    : "";
  return {
    conversationId: conversation.conversationId,
    channel: conversation.channel,
    customerId: conversation.customerId,
    status: conversation.status,
    assignedTo: conversation.assignedTo,
    aiEnabled: conversation.aiEnabled,
    lastMessageAt: conversation.lastMessageAt,
    messageCount: conversation.messages.length,
    preview,
  };
}

export class ConversationStore {
  // Khai bao truong roi gan trong constructor thay vi dung "parameter property":
  // Node chay test bang che do strip-only, khong ho tro cu phap do.
  private readonly kv: ConversationKv;

  constructor(kv: ConversationKv) {
    this.kv = kv;
  }

  async get(conversationId: string): Promise<Conversation | null> {
    if (!isValidConversationId(conversationId)) return null;
    const raw = await this.kv.get(conversationKey(conversationId), "text");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Conversation;
    } catch {
      return null;
    }
  }

  /** Lay hoi thoai theo ma, hoac tao moi neu chua co. */
  async ensure(conversationId: string, channel: Channel, customerId: string): Promise<Conversation> {
    const existing = await this.get(conversationId);
    if (existing) return existing;
    const created = nowIso();
    return {
      conversationId,
      channel,
      customerId,
      status: "new",
      assignedTo: "",
      messages: [],
      lastMessageAt: created,
      aiEnabled: true,
      createdAt: created,
    };
  }

  async save(conversation: Conversation): Promise<void> {
    const trimmed: Conversation = {
      ...conversation,
      messages: conversation.messages.slice(-MAX_MESSAGES),
    };
    await this.kv.put(conversationKey(trimmed.conversationId), JSON.stringify(trimmed));
    await this.updateIndex(summarize(trimmed));
  }

  async appendMessage(
    conversation: Conversation,
    message: Omit<ConversationMessage, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<Conversation> {
    const entry: ConversationMessage = {
      id: newId(),
      createdAt: message.createdAt ?? nowIso(),
      sender: message.sender,
      content: message.content,
      type: message.type,
      ...(message.imageUrl ? { imageUrl: message.imageUrl } : {}),
    };
    const next: Conversation = {
      ...conversation,
      messages: [...conversation.messages, entry],
      lastMessageAt: entry.createdAt,
      // Khach nhan tin vao hoi thoai da dong -> mo lai, de nhan vien khong bo sot.
      status: conversation.status === "resolved" && message.sender === "customer"
        ? "open"
        : conversation.status,
    };
    await this.save(next);
    return next;
  }

  async list(): Promise<ConversationSummary[]> {
    const raw = await this.kv.get(INDEX_KEY, "text");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ConversationSummary[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async remove(conversationId: string): Promise<void> {
    if (!isValidConversationId(conversationId)) return;
    await this.kv.delete(conversationKey(conversationId));
    const index = await this.list();
    await this.kv.put(
      INDEX_KEY,
      JSON.stringify(index.filter((item) => item.conversationId !== conversationId)),
    );
  }

  private async updateIndex(summary: ConversationSummary): Promise<void> {
    const index = await this.list();
    const rest = index.filter((item) => item.conversationId !== summary.conversationId);
    // Moi nhat len dau: hop thu luon doc theo thu tu nay, sap o day thi phia doc
    // khong phai sap lai.
    const next = [summary, ...rest]
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .slice(0, MAX_INDEX);
    await this.kv.put(INDEX_KEY, JSON.stringify(next));
  }
}
