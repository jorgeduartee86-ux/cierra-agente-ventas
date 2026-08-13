type AgentConfig = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function text(value: unknown, max = 3000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizePhone(value: unknown) {
  const phone = text(value, 30).replace(/[^\d+]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
}

function compactConfig(value: unknown) {
  const input = value && typeof value === "object" ? value as AgentConfig : {};
  return {
    businessName: text(input.businessName || input.b, 120),
    agentName: text(input.agentName || input.a, 80) || "Tu asesor",
    productName: text(input.productName || input.p, 160) || "el producto",
    price: text(input.price || input.r, 100),
    description: text(input.description || input.d, 1200),
    knowledge: text(input.knowledge || input.k, 6000),
    tone: text(input.tone || input.t, 80) || "cercano y profesional",
    instructions: text(input.instructions || input.i, 12000),
  };
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { customerPhone?: unknown; config?: unknown; consent?: unknown };
    if (body.consent !== true) return Response.json({ error: "Necesitamos tu permiso para llamarte." }, { status: 400, headers: corsHeaders });

    const to = normalizePhone(body.customerPhone);
    if (!to) return Response.json({ error: "Escribe un número internacional válido, por ejemplo +57 300 123 4567." }, { status: 400, headers: corsHeaders });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
    const publicBaseUrl = text(process.env.PUBLIC_APP_URL, 500).replace(/\/$/, "");
    if (!accountSid || !authToken || !from || !publicBaseUrl) {
      return Response.json({ error: "El canal de llamadas aún no está configurado en el servidor. Faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER o PUBLIC_APP_URL.", code: "CALLS_NOT_CONFIGURED" }, { status: 503, headers: corsHeaders });
    }

    const config = compactConfig(body.config);
    const payload = Buffer.from(JSON.stringify(config), "utf8").toString("base64url");
    const form = new URLSearchParams({ To: to, From: from, Url: `${publicBaseUrl}/api/calls/twiml?config=${encodeURIComponent(payload)}` });
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    const data = await response.json() as { sid?: string; message?: string };
    if (!response.ok) return Response.json({ error: data.message || "Twilio no pudo iniciar la llamada." }, { status: 502, headers: corsHeaders });
    return Response.json({ ok: true, callSid: data.sid, message: "La llamada está iniciándose." }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: "No pude iniciar la llamada." }, { status: 400, headers: corsHeaders });
  }
}

export { xmlEscape };
