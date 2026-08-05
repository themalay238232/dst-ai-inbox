/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { ConversationStore } from "./lib/conversation-store.ts";
import { handleConversationApi, makeJson } from "./lib/conversation-api.ts";
import { DST_SYSTEM_PROMPT } from "../app/lib/dst-knowledge.ts";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  /** Workers AI: chay tren Cloudflare nen khong dinh chan vi tri nhu Gemini. */
  AI?: { run(model: string, input: { messages: Array<{ role: string; content: string }>; max_tokens?: number; temperature?: number }): Promise<{ response?: string; choices?: Array<{ message?: { content?: string } }> }> };
  /** Kho hoi thoai dung chung cho chat khach va hop thu quan tri. */
  CONVERSATIONS: KVNamespace;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  /** Doi model Workers AI ma khong phai sua code. */
  WORKERS_AI_MODEL?: string;
  /** Bot DST da deploy san (ai-chat-worker). Dung khi chua cau hinh khoa rieng. */
  DST_BOT_URL?: string;
  ADMIN_PASSWORD?: string;
  /** Worker Messenger da co san cua DST, dung de gop hoi thoai Messenger vao hop thu. */
  MESSENGER_WORKER_URL?: string;
  MESSENGER_ADMIN_TOKEN?: string;
  /** Service binding sang worker Messenger, chi co tren ban deploy. */
  MESSENGER?: Fetcher;
  META_PAGE_ACCESS_TOKEN?: string;
  META_APP_SECRET?: string;
  META_VERIFY_TOKEN?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type ServiceContext = {
  title?: string;
  description?: string;
  deliverables?: unknown;
};

/**
 * Gemini tu choi request theo VI TRI may goi ("User location is not supported for
 * the API use"). Ket qua khong doi giua cac request tren cung mot may chu, nen ghi
 * nho lai trong isolate de khoi thu lai va cham moi cau tra loi vai giay.
 */
let geminiBlockedHere = false;

/** Khoa KV ghi nho viec Gemini chan vi tri may chu. Co han 1 ngay de tu khoi phuc
 *  neu Google mo lai khu vuc, thay vi tat Gemini vinh vien. */
const GEMINI_BLOCKED_KEY = "ai:gemini-blocked";
const GEMINI_BLOCKED_TTL = 86_400;

/** Doc co mot lan cho moi isolate; cac request sau dung lai ket qua trong bo nho. */
async function loadGeminiBlocked(env: Env) {
  if (geminiBlockedHere || !env.CONVERSATIONS) return geminiBlockedHere;
  try {
    geminiBlockedHere = (await env.CONVERSATIONS.get(GEMINI_BLOCKED_KEY, "text")) === "1";
  } catch {
    // Doc that bai thi coi nhu chua chan, cung lam gi hon duoc.
  }
  return geminiBlockedHere;
}

async function markGeminiBlocked(env: Env) {
  geminiBlockedHere = true;
  try {
    await env.CONVERSATIONS?.put(GEMINI_BLOCKED_KEY, "1", { expirationTtl: GEMINI_BLOCKED_TTL });
  } catch {
    // Khong ghi duoc thi van con co trong bo nho cua isolate nay.
  }
}

const PRODUCTION_ORIGIN = "https://theluc205.github.io";

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && (origin === PRODUCTION_ORIGIN || /^http:\/\/localhost(?::\d+)?$/.test(origin))
    ? origin
    : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/**
 * Doan mo ta viet tay truoc day o day rat chung chung: khong co hotline, khong co
 * dia chi, khong co danh sach dich vu. Hau qua la bot ne cau hoi ("bao gom ca
 * TikTok") thay vi tra loi dut khoat, va khong bao gio dua duoc so lien he.
 * Nay lay tu `app/lib/dst-knowledge.ts`, sinh thang tu `data/` cua website.
 */
const DST_SERVICE_CONTEXT = DST_SYSTEM_PROMPT;

function json(request: Request, data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
      ...init?.headers,
    },
  });
}

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-10)
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const record = message as { role?: unknown; content?: unknown };
      const role = record.role === "assistant" ? "assistant" : "user";
      const content = typeof record.content === "string" ? record.content.slice(0, 1200) : "";
      return content ? { role, content } : null;
    })
    .filter(Boolean);
}

function normalizeServiceContext(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const context = value as ServiceContext;
  if (typeof context.title !== "string" || typeof context.description !== "string") return "";
  const deliverables = Array.isArray(context.deliverables)
    ? context.deliverables.filter((item): item is string => typeof item === "string").slice(0, 4)
    : [];
  return [
    `Dich vu nguoi dung dang xem: ${context.title.slice(0, 120)}.`,
    `Mo ta: ${context.description.slice(0, 600)}.`,
    deliverables.length ? `Hang muc co the trao doi: ${deliverables.join(", ").slice(0, 500)}.` : "",
  ].filter(Boolean).join("\n");
}

function contextForPrompt(pageContext: string, serviceContext: string) {
  return [
    pageContext ? `Nguoi dung dang xem: ${pageContext}. Uu tien tu van theo ngu canh nay.` : "",
    serviceContext,
  ].filter(Boolean).join("\n");
}

async function callOpenAI(env: Env, messages: Array<{ role: string; content: string }>, pageContext: string, serviceContext: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            DST_SERVICE_CONTEXT + `\n${contextForPrompt(pageContext, serviceContext)}`,
        },
        ...messages,
      ],
      temperature: 0.4,
      max_output_tokens: 420,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI failed: ${response.status}`);
  const data = (await response.json()) as { output_text?: string };
  return data.output_text;
}

async function callGemini(env: Env, messages: Array<{ role: string; content: string }>, pageContext: string, serviceContext: string) {
  // `gemini-flash-latest` la bi danh Google tu tro toi ban flash moi nhat. Mac dinh
  // cu la `gemini-1.5-flash` — model do da bi go va tra 404, lam chat chet han.
  // Dat ten model co dinh o day nghia la mot ngay nao do se hong lai y het nhu vay.
  const model = env.GEMINI_MODEL || "gemini-flash-latest";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                DST_SERVICE_CONTEXT + `\n${contextForPrompt(pageContext, serviceContext)}`,
            },
          ],
        },
        contents: messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
        generationConfig: {
          temperature: 0.4,
          // Ke tu Gemini 2.5, token "suy luan" TINH VAO maxOutputTokens. Voi han muc
          // 420 cu, model tieu gan het vao suy luan va cau tra loi bi cat giua chung.
          // KHONG dat thinkingConfig de tat suy luan: Gemini 3.x tu choi tham so do
          // (400 INVALID_ARGUMENT). Cach chac an la chua du cho cho ca hai phan.
          maxOutputTokens: 2000,
        },
      }),
    },
  );

  if (!response.ok) {
    // Ghi ly do that ra log may chu. Khong tra ve trinh duyet va khong bao gio in
    // khoa: chi lay phan mo ta loi cua Google, du de biet la sai khoa hay sai model.
    const detail = (await response.text().catch(() => "")).slice(0, 400);
    console.error(`[gemini] ${response.status} model=${model} ${detail}`);
    // Chan theo vi tri thi lan sau khong thu nua — xem chu thich o geminiBlockedHere.
    if (/User location is not supported/i.test(detail)) await markGeminiBlocked(env);
    // 404 = ten model khong con ton tai. Liet ke model dang dung duoc ra log de biet
    // dien gi vao GEMINI_MODEL, thay vi phai doan.
    if (response.status === 404) {
      try {
        const listed = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`,
        );
        const catalog = (await listed.json()) as {
          models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
        };
        const usable = (catalog.models ?? [])
          .filter((item) => item.supportedGenerationMethods?.includes("generateContent"))
          .map((item) => (item.name ?? "").replace("models/", ""));
        console.error(`[gemini] model dung duoc: ${usable.join(", ")}`);
      } catch {
        console.error("[gemini] khong liet ke duoc danh sach model");
      }
    }
    throw new Error(`Gemini failed: ${response.status}`);
  }
  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
}

/**
 * Mot cua duy nhat de sinh cau tra loi. Ca `/api/chat` cu lan `/api/web-chat` moi deu
 * di qua day, nen website chi co MOT bot voi mot bo kien thuc.
 * Tra ve null khi chua cau hinh nha cung cap nao — phia goi phai noi that, khong duoc
 * thay bang cau mau.
 */
/** Workers AI chay ngay tren Cloudflare nen khong bi chan theo vi tri. */
async function callWorkersAi(
  env: Env,
  messages: Array<{ role: string; content: string }>,
  pageContext: string,
  serviceContext: string,
) {
  // KHONG dung glm-4.7-flash: no la model CO SUY LUAN, token suy luan tinh vao
  // max_tokens (dat 512 thi cau tra loi rong — giong het chuyen da gap voi Gemini
  // 2.5+), va do thuc te moi cau mat 26-43 giay. Llama 3.3 70B fp8-fast khong suy
  // luan, Cloudflare toi uu san cho toc do.
  const model = env.WORKERS_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const result = await env.AI!.run(model, {
    max_tokens: 512,
    temperature: 0.4,
    messages: [
      { role: "system", content: `${DST_SERVICE_CONTEXT}\n${contextForPrompt(pageContext, serviceContext)}` },
      ...messages,
    ],
  });
  return result.response?.trim() || result.choices?.[0]?.message?.content?.trim() || null;
}

/**
 * Thu lan luot cac nha cung cap, HONG THI CHUYEN sang cai ke tiep.
 *
 * Phai roi tang chu khong duoc dung han: Gemini tu choi request phat tu edge cua
 * Cloudflare ("User location is not supported for the API use"), nen ban local chay
 * ngon lanh con ban deploy chet han. Workers AI dat sau cung lam luoi do vi no chay
 * ngay tren Cloudflare, khong dinh chan vi tri.
 */
async function generateAnswer(
  env: Env,
  messages: Array<{ role: string; content: string }>,
  pageContext: string,
  serviceContext: string,
): Promise<string | null> {
  if (!messages.length) return null;

  const providers: Array<[string, () => Promise<string | null | undefined>]> = [];
  if (env.OPENAI_API_KEY) providers.push(["openai", () => callOpenAI(env, messages, pageContext, serviceContext)]);
  // Bo qua Gemini khi da biet no chan vi tri may chu nay: thu lai moi request chi ton
  // them vai giay cho moi cau tra loi, va ket qua luon la that bai.
  if (env.GEMINI_API_KEY && !await loadGeminiBlocked(env)) {
    providers.push(["gemini", () => callGemini(env, messages, pageContext, serviceContext)]);
  }
  if (env.AI) providers.push(["workers-ai", () => callWorkersAi(env, messages, pageContext, serviceContext)]);

  for (const [name, run] of providers) {
    try {
      const answer = await run();
      if (answer) return answer;
      console.error(`[ai] ${name} tra ve rong, thu nha cung cap ke tiep`);
    } catch (error) {
      console.error(`[ai] ${name} loi: ${String(error).slice(0, 200)} — thu nha cung cap ke tiep`);
    }
  }

  // Bot DST da co san (ai-chat-worker, Cloudflare Workers AI + kho kien thuc DST).
  // Dat sau cung de khi co khoa rieng thi khoa duoc uu tien, nhung nho no ma he thong
  // chay duoc ngay ma khong phai cau hinh them gi.
  if (env.DST_BOT_URL) {
    try {
      const upstream = await fetch(env.DST_BOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, pageContext }),
      });
      if (!upstream.ok) throw new Error(`DST bot failed: ${upstream.status}`);
      const data = (await upstream.json()) as { answer?: string };
      if (data.answer) return data.answer;
    } catch (error) {
      // Khong nem ra ngoai: het duong thi tra null de phia goi bao "chua tra loi
      // duoc" mot cach trung thuc, thay vi thanh loi 502 kho hieu.
      console.error(`[ai] dst-bot loi: ${String(error).slice(0, 200)}`);
    }
  }
  return null;
}

async function handleChatProxy(request: Request, env: Env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, { status: 405 });

  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
    pageContext?: unknown;
    serviceContext?: unknown;
  } | null;
  const messages = normalizeMessages(body?.messages) as Array<{ role: string; content: string }>;
  const pageContext = typeof body?.pageContext === "string" ? body.pageContext.slice(0, 160) : "";
  const serviceContext = normalizeServiceContext(body?.serviceContext);

  if (!messages.length) {
    return json(request, { error: "Missing messages" }, { status: 400 });
  }

  try {
    const answer = env.OPENAI_API_KEY
      ? await callOpenAI(env, messages, pageContext, serviceContext)
      : env.GEMINI_API_KEY
        ? await callGemini(env, messages, pageContext, serviceContext)
        : null;

    if (!answer) return json(request, { error: "AI provider is not configured" }, { status: 503 });
    return json(request, { answer });
  } catch {
    return json(request, { error: "AI provider failed" }, { status: 502 });
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/api/chat") {
      return handleChatProxy(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      const cors = corsHeaders(request);
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: { ...cors, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS" },
        });
      }
      if (env.CONVERSATIONS) {
        const store = new ConversationStore(env.CONVERSATIONS);
        const handled = await handleConversationApi(
          request,
          url,
          env,
          store,
          (messages, pageContext, serviceContext) =>
            generateAnswer(env, messages, pageContext, serviceContext),
          makeJson(cors),
        );
        if (handled) return handled;
      }
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
