/**
 * Lop bao ve toi thieu cho hop thu quan tri o local.
 *
 * Nhan vien nhap ADMIN_PASSWORD mot lan, doi lay mot the co han. The duoc ky bang
 * HMAC-SHA256 voi chinh mat khau lam khoa, nen:
 * - khong phai luu phien nao trong KV;
 * - doi mat khau la moi the cu het hieu luc ngay.
 *
 * Mat khau KHONG bao gio duoc gui lai ve trinh duyet, va cung khong nam trong the.
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(password: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

/** So sanh theo thoi gian co dinh, tranh ro ri do thoi gian so sanh chuoi. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function issueAdminToken(password: string): Promise<string> {
  const expires = String(Date.now() + TOKEN_TTL_MS);
  return `${expires}.${await sign(password, expires)}`;
}

export async function verifyAdminToken(password: string | undefined, token: string): Promise<boolean> {
  if (!password || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return timingSafeEqual(signature, await sign(password, expires));
}

/** Doc the tu header Authorization: Bearer <token>. */
export function bearerToken(request: Request): string {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function requireAdmin(request: Request, password: string | undefined): Promise<boolean> {
  return verifyAdminToken(password, bearerToken(request));
}
