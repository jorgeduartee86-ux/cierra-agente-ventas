export const OPENAI_CONNECTION_KEY = "openai_connection";
export const OPENAI_ADMIN_HASH_KEY = "openai_admin_hash";
export const OPENAI_ADMIN_COOKIE = "cierra_openai_admin";

export function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashAdminToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toBase64Url(new Uint8Array(digest));
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const cookie of cookieHeader.split(";")) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

export async function canManageOpenAI(request: Request, savedAdminHash: string | null) {
  if (!savedAdminHash) return true;
  const token = readCookie(request, OPENAI_ADMIN_COOKIE);
  return token ? await hashAdminToken(token) === savedAdminHash : false;
}
