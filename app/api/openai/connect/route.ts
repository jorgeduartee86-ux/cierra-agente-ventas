import { getSetting, setSetting } from "../../../../db/client";
import { createOpenAIConnection } from "../../../../lib/openai-connection";

const CONNECTION_KEY = "openai_connection";
const ADMIN_HASH_KEY = "openai_admin_hash";
const ADMIN_COOKIE = "cierra_openai_admin";

function safeApiKey(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 300) : "";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashToken(token: string) {
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

async function canManage(request: Request, savedAdminHash: string | null) {
  if (!savedAdminHash) return true;
  const token = readCookie(request, ADMIN_COOKIE);
  return token ? await hashToken(token) === savedAdminHash : false;
}

export async function GET(request: Request) {
  try {
    const [connection, adminHash] = await Promise.all([
      getSetting(CONNECTION_KEY),
      getSetting(ADMIN_HASH_KEY),
    ]);
    return Response.json({ connected: Boolean(connection), canManage: await canManage(request, adminHash) });
  } catch {
    return Response.json({ connected: Boolean(process.env.OPENAI_API_KEY), canManage: true });
  }
}

export async function POST(request: Request) {
  try {
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
      return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
    }

    const savedAdminHash = await getSetting(ADMIN_HASH_KEY);
    if (!await canManage(request, savedAdminHash)) {
      return Response.json({ error: "Esta conexión solo puede cambiarse desde el navegador que la configuró." }, { status: 403 });
    }

    const body = await request.json() as { apiKey?: unknown };
    const apiKey = safeApiKey(body.apiKey);
    if (apiKey.length < 20) {
      return Response.json({ error: "Pega una clave API válida para continuar." }, { status: 400 });
    }

    const validation = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!validation.ok) {
      const message = validation.status === 401
        ? "OpenAI rechazó la clave. Revisa que esté completa y siga activa."
        : validation.status === 429
          ? "La clave es válida, pero el proyecto alcanzó un límite de uso o facturación."
          : "No pudimos validar la clave con OpenAI en este momento.";
      return Response.json({ error: message }, { status: validation.status === 401 ? 401 : 502 });
    }

    const connection = await createOpenAIConnection(apiKey);
    await setSetting(CONNECTION_KEY, connection);

    const headers = new Headers();
    if (!savedAdminHash) {
      const adminToken = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      await setSetting(ADMIN_HASH_KEY, await hashToken(adminToken));
      const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
      headers.set("Set-Cookie", `${ADMIN_COOKIE}=${encodeURIComponent(adminToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${secure}`);
    }

    return Response.json({ connected: true, canManage: true }, { headers });
  } catch (error) {
    const missingSecret = error instanceof Error && error.message.includes("CIERRA_CONFIG_SECRET");
    const missingDatabase = error instanceof Error && error.message.includes("D1 database");
    return Response.json({
      error: missingSecret
        ? "La protección de claves todavía no está configurada en el servidor."
        : missingDatabase
          ? "El almacenamiento global todavía no está disponible."
          : "No pudimos conectar OpenAI. Intenta de nuevo.",
    }, { status: 500 });
  }
}
