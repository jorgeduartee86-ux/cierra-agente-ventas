import { xmlEscape } from "../request/route";

function readConfig(request: Request) {
  try {
    const encoded = new URL(request.url).searchParams.get("config") || "";
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, string>;
  } catch { return {}; }
}

export async function POST(request: Request) {
  const config = readConfig(request);
  const greeting = `Hola, soy ${config.agentName || "tu asesor"} de ${config.businessName || "nuestro equipo"}. Te llamo porque mostraste interés en ${config.productName || "nuestro producto"}. ¿Tienes un minuto para que te cuente cómo puede ayudarte?`;
  const action = new URL(request.url);
  action.pathname = "/api/calls/respond";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" language="es-MX" speechTimeout="auto" timeout="5" action="${xmlEscape(action.toString())}" method="POST"><Say language="es-MX" voice="Polly.Mia">${xmlEscape(greeting)}</Say></Gather><Say language="es-MX" voice="Polly.Mia">No alcancé a escucharte. Te enviaremos un mensaje para que puedas retomar la conversación. Hasta luego.</Say></Response>`, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}
