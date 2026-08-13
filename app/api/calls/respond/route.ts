function readConfig(request: Request) {
  try {
    const encoded = new URL(request.url).searchParams.get("config") || "";
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, string>;
  } catch { return {}; }
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const body = await request.formData();
  const speech = String(body.get("SpeechResult") || "").trim();
  const config = readConfig(request);
  const params = new URL(request.url).search;
  let reply = speech ? `Gracias por contarme. Para ayudarte a decidir, puedo explicarte el precio, los beneficios y el siguiente paso de compra. ¿Qué te gustaría resolver primero?` : "Parece que no te escuché bien. ¿Quieres que te cuente brevemente cómo funciona el producto?";

  if (speech && process.env.OPENAI_API_KEY) {
    const instructions = `Eres ${config.agentName || "un asesor"}, vendedor telefónico de ${config.businessName || "un negocio"}. Vendes ${config.productName || "un producto"}. Precio: ${config.price || "no informado"}. Descripción: ${config.description || "no informada"}. Datos confirmados: ${config.knowledge || "no informados"}. Tono: ${config.tone || "cercano y profesional"}. ${config.instructions || ""} Responde en español, con naturalidad y máximo 45 palabras. Haz una sola pregunta. Ayuda a decidir sin inventar datos ni presionar. Si la persona confirma que quiere comprar, indícale que el equipo le enviará el enlace de pago o continuará con sus datos.`;
    const aiResponse = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.6-luna", instructions, input: speech, max_output_tokens: 160, store: false }) });
    if (aiResponse.ok) {
      const data = await aiResponse.json() as { output_text?: string };
      reply = data.output_text?.trim() || reply;
    }
  }

  const nextAction = `/api/calls/respond${params}`;
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" language="es-MX" speechTimeout="auto" timeout="5" action="${escapeXml(nextAction)}" method="POST"><Say language="es-MX" voice="Polly.Mia">${escapeXml(reply)}</Say></Gather><Say language="es-MX" voice="Polly.Mia">Gracias por tu tiempo. Un asesor continuará contigo.</Say></Response>`, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}
