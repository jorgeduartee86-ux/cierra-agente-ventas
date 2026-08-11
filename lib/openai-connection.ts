const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getConnectionSecret() {
  const secret = process.env.CIERRA_CONFIG_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CIERRA_CONFIG_SECRET must contain at least 32 characters.");
  }
  return secret;
}

async function getEncryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(getConnectionSecret()));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function createOpenAIConnection(apiKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();
  const payload = encoder.encode(JSON.stringify({ apiKey, createdAt: Date.now() }));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

export async function readOpenAIConnection(token: string) {
  const [version, ivValue, encryptedValue] = token.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) {
    throw new Error("Invalid OpenAI connection token.");
  }

  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivValue) },
    key,
    fromBase64Url(encryptedValue),
  );
  const payload = JSON.parse(decoder.decode(decrypted)) as { apiKey?: unknown };
  if (typeof payload.apiKey !== "string" || payload.apiKey.length < 20) {
    throw new Error("Invalid OpenAI connection payload.");
  }
  return payload.apiKey;
}
