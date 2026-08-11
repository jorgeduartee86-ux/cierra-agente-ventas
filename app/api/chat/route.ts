type AgentConfig = {
  agentName?: string;
  businessName?: string;
  productName?: string;
  price?: string;
  description?: string;
  knowledge?: string;
  tone?: string;
  ctaLabel?: string;
  whatsapp?: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function safeText(value: unknown, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeConfig(value: unknown): AgentConfig {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    agentName: safeText(input.agentName, 80) || "Tu asesor",
    businessName: safeText(input.businessName, 120),
    productName: safeText(input.productName, 160) || "el producto",
    price: safeText(input.price, 100),
    description: safeText(input.description, 1200),
    knowledge: safeText(input.knowledge, 6000),
    tone: safeText(input.tone, 80) || "cercano y profesional",
    ctaLabel: safeText(input.ctaLabel, 80) || "Hablar con un asesor",
    whatsapp: safeText(input.whatsapp, 30).replace(/[^0-9]/g, ""),
  };
}

function localReply(message: string, config: AgentConfig) {
  const text = message.toLocaleLowerCase("es");
  const product = config.productName || "este producto";

  if (/precio|cu[aá]nto|valor|costo/.test(text)) {
    return config.price
      ? `${product} tiene un precio de ${config.price}. ¿Quieres que te ayude a confirmar si encaja con lo que necesitas?`
      : `Todavía no tengo un precio confirmado para ${product}. Puedo contarte sus beneficios o ayudarte a hablar con el equipo.`;
  }

  if (/comprar|quiero|me interesa|pedido|adquirir/.test(text)) {
    return `¡Perfecto! Te ayudo a dar el siguiente paso con ${product}. Puedes usar el botón “${config.ctaLabel}” y el equipo continuará contigo.`;
  }

  if (/env[ií]o|entrega|domicilio|pago|garant[ií]a|devoluci[oó]n/.test(text)) {
    const info = config.knowledge || "";
    const relevant = info.split(/\n|\./).find((line) => {
      const normalized = line.toLocaleLowerCase("es");
      return [...text.split(/\s+/)].some((word) => word.length > 5 && normalized.includes(word));
    });
    return relevant
      ? `${relevant.trim()}. ¿Te gustaría avanzar con la compra?`
      : `No tengo ese dato confirmado y prefiero no inventarlo. Sí puedo ayudarte con lo que sabemos de ${product} o conectarte con el equipo.`;
  }

  const intro = config.description
    ? `${product} ${config.description.charAt(0).toLocaleLowerCase("es")}${config.description.slice(1)}`
    : `${product} está pensado para ayudarte a resolver una necesidad concreta`;
  return `${intro}. Para recomendarte bien, ¿qué resultado buscas conseguir?`;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { message?: unknown; config?: unknown; history?: unknown };
    const message = safeText(body.message, 1200);
    const config = normalizeConfig(body.config);
    const history = Array.isArray(body.history)
      ? body.history.slice(-10).flatMap((item): ChatMessage[] => {
          if (!item || typeof item !== "object") return [];
          const record = item as Record<string, unknown>;
          const role = record.role === "assistant" ? "assistant" : "user";
          const content = safeText(record.content, 1200);
          return content ? [{ role, content }] : [];
        })
      : [];

    if (!message) {
      return Response.json({ error: "Escribe un mensaje para continuar." }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ reply: localReply(message, config), mode: "demo" }, { headers: corsHeaders });
    }

    const prompt = `Eres ${config.agentName}, asesor de ventas de ${config.businessName || "un negocio"}.
Vendes exclusivamente: ${config.productName}.
Tono: ${config.tone}.

Información confirmada:
- Precio: ${config.price || "no informado"}
- Descripción: ${config.description || "no informada"}
- Datos adicionales: ${config.knowledge || "no informados"}

Reglas: responde en español, de forma breve y consultiva. Usa únicamente la información confirmada. Si falta un dato, dilo con honestidad. Haz máximo una pregunta por respuesta. No presiones. Cuando exista intención de compra, invita a usar “${config.ctaLabel}”. Nunca inventes precios, características, políticas ni disponibilidad.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.35,
        max_tokens: 260,
        messages: [{ role: "system", content: prompt }, ...history, { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      return Response.json({ reply: localReply(message, config), mode: "demo" }, { headers: corsHeaders });
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reply = safeText(data.choices?.[0]?.message?.content, 1800) || localReply(message, config);
    return Response.json({ reply, mode: "ai" }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: "No pude procesar el mensaje." }, { status: 400, headers: corsHeaders });
  }
}
