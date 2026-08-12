"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Code2,
  Copy,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";

type AgentConfig = {
  businessName: string;
  agentName: string;
  productName: string;
  price: string;
  description: string;
  knowledge: string;
  instructions: string;
  avatarData: string;
  tone: string;
  ctaLabel: string;
  whatsapp: string;
  accent: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };
type StudioTab = "config" | "test" | "install";

const defaultConfig: AgentConfig = {
  businessName: "Casa Norte",
  agentName: "Nora",
  productName: "Kit Ritual de Café",
  price: "$129.000 COP",
  description: "incluye molino manual, prensa y una guía sencilla para preparar mejor café en casa.",
  knowledge: "Envío gratis en Colombia. Entrega estimada de 2 a 4 días hábiles. Pago con tarjeta, PSE o transferencia. Garantía de 30 días por defectos de fabricación.",
  instructions: "",
  avatarData: "",
  tone: "Cercano y experto",
  ctaLabel: "Comprar por WhatsApp",
  whatsapp: "573001234567",
  accent: "#ff5d3a",
};

const quickQuestions = ["¿Qué incluye?", "¿Cuánto cuesta?", "Quiero comprar"];

function apiUrl(path: string) {
  if (typeof window === "undefined") return path;
  const apiOrigin = (window as Window & { __CIERRA_API_ORIGIN__?: string }).__CIERRA_API_ORIGIN__ || "";
  return `${apiOrigin}${path}`;
}

function encodeConfig(config: AgentConfig) {
  if (typeof window === "undefined") return "";
  const compact = { b: config.businessName, a: config.agentName, p: config.productName, r: config.price, d: config.description, k: config.knowledge, t: config.tone, c: config.ctaLabel, w: config.whatsapp, i: config.instructions, v: config.avatarData };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary);
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className={`brand ${inverse ? "brand-inverse" : ""}`} href="#top" aria-label="Cierra, inicio">
      <span className="brand-mark"><ArrowRight size={17} strokeWidth={2.8} /></span>
      <span>cierra</span><b>.</b>
    </a>
  );
}

function AgentAvatar({ config, size = 21 }: { config: AgentConfig; size?: number }) {
  return config.avatarData ? <img className="agent-avatar-image" src={config.avatarData} alt="Logo del negocio" /> : <Bot size={size} />;
}

function ChatPreview({ config, compact = false }: { config: AgentConfig; compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: `¡Hola! Soy ${config.agentName}. ¿Qué te gustaría saber sobre ${config.productName}?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: `¡Hola! Soy ${config.agentName}. ¿Qué te gustaría saber sobre ${config.productName}?` }]);
  }, [config.agentName, config.productName]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    const previous = messages;
    setMessages([...previous, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, config, history: previous }),
      });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "OpenAI no pudo responder.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "¿Quieres que te conecte con el equipo?" }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "No pude usar ChatGPT ahora. Revisa la conexión de OpenAI o continúa por WhatsApp." }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  const whatsappUrl = config.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, me interesa ${config.productName}`)}`
    : "#";

  return (
    <div className={`chat-card ${compact ? "chat-card-compact" : ""}`} style={{ "--agent-accent": config.accent } as React.CSSProperties}>
      <div className="chat-topbar">
        <div className="agent-photo"><AgentAvatar config={config} /></div>
        <div className="chat-identity">
          <strong>{config.agentName}</strong>
          <span><i /> Asesor de {config.businessName}</span>
        </div>
        <button type="button" className="icon-button" aria-label="Cerrar vista previa"><X size={18} /></button>
      </div>
      <div className="chat-body" aria-live="polite">
        <div className="chat-day">Hoy</div>
        {messages.map((message, index) => (
          <div className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
            {message.content}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="quick-row">
            {quickQuestions.map((question) => (
              <button key={question} type="button" onClick={() => void sendMessage(question)}>{question}</button>
            ))}
          </div>
        )}
        {loading && <div className="bubble assistant typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>
      {messages.some((message) => /siguiente paso|equipo|compra|comprar/i.test(message.content)) && config.whatsapp && (
        <a className="chat-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> {config.ctaLabel}
        </a>
      )}
      <form className="chat-compose" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu pregunta…" aria-label="Mensaje para el asesor" />
        <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensaje"><Send size={18} /></button>
      </form>
      <div className="powered">Creado con <strong>cierra.</strong></div>
    </div>
  );
}

function ProductStudio() {
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  const [tab, setTab] = useState<StudioTab>("config");
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [origin, setOrigin] = useState("https://tu-agente.com");
  const [openAIConnected, setOpenAIConnected] = useState(false);

  useEffect(() => {
    setOrigin((window as Window & { __CIERRA_API_ORIGIN__?: string }).__CIERRA_API_ORIGIN__ || window.location.origin);
    const saved = window.localStorage.getItem("cierra-agent-config");
    if (saved) {
      try { setConfig({ ...defaultConfig, ...JSON.parse(saved) }); } catch { /* use defaults */ }
    }
    void fetch(apiUrl("/api/openai/status"), { cache: "no-store" })
      .then((response) => response.json())
      .then((status: { connected?: boolean }) => {
        setOpenAIConnected(Boolean(status.connected));
      })
      .catch(() => { /* the demo stays available */ });
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cierra-agent-config", JSON.stringify(config));
  }, [config]);

  const snippet = useMemo(() => {
    const encoded = encodeConfig(config);
    return `<script src="${origin}/widget.js" data-cierra="${encoded}" defer></script>`;
  }, [config, origin]);

  const installPrompt = useMemo(() => `Instala este agente de ventas en mi página web.

Código del agente:
${snippet}

Ubicación: colócalo justo antes de la etiqueta </body>. Debe aparecer como un botón flotante en la esquina inferior derecha, sin tapar el contenido ni el botón de compra de la página.

Requisitos:
- Conserva el diseño actual de la página y no reemplaces su contenido.
- Carga el script una sola vez y déjalo funcionar en escritorio y móvil.
- Verifica que el chat abra, muestre el logo del negocio y pueda responder preguntas.
- No expongas ninguna clave API ni la muevas al código del navegador.
- Si la página usa React, Next, Shopify, WordPress o HTML, adapta la instalación al lugar correcto sin duplicar el script.
- Después de instalarlo, prueba una pregunta, una consulta de precio y el botón de contacto.` , [snippet]);

  function update<K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) {
    setConfig((current) => ({ ...current, [field]: value }));
  }

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(installPrompt);
    setPromptCopied(true);
    window.setTimeout(() => setPromptCopied(false), 1800);
  }

  function readSkillFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setConfig((current) => ({ ...current, instructions: String(reader.result || "").slice(0, 18000) }));
    reader.readAsText(file);
  }

  function readLogoFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setConfig((current) => ({ ...current, avatarData: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  function openTestPage() {
    const testWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!testWindow) return;
    const title = `${config.agentName} — ${config.productName}`;
    testWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f4efe7;color:#27231f;font-family:Arial,sans-serif}main{max-width:760px;margin:0 auto;padding:56px 24px}h1{font-size:clamp(32px,6vw,58px);line-height:1.02;margin:0 0 16px}p{font-size:18px;line-height:1.6;color:#665d53}.demo{margin-top:32px;padding:22px;border:1px solid #ded4c8;border-radius:20px;background:#fffaf4}.demo strong{display:block;margin-bottom:8px}.demo span{color:#8a7d70;font-size:14px}</style></head><body><main><div class="demo"><strong>Prueba del vendedor</strong><span>Esta es una página de ejemplo. Abre el botón de chat para conversar con ${config.agentName}.</span></div><h1>${config.productName}</h1><p>${config.description || "Conoce el producto y pregunta lo que necesites."}</p>${snippet}</main></body></html>`);
    testWindow.document.close();
  }

  return (
    <section className="studio-section" id="crear">
      <div className="section-heading">
        <span className="eyebrow">Pruébalo ahora</span>
        <h2>De datos sueltos a vendedor listo.</h2>
        <p>Personaliza el ejemplo y conversa con tu agente. Lo que escribas se guarda únicamente en este navegador.</p>
      </div>

      <div className="studio-shell">
        <div className="studio-main">
          <div className="studio-tabs" role="tablist" aria-label="Pasos para crear el agente">
            <button className={tab === "config" ? "active" : ""} onClick={() => setTab("config")} role="tab"><span>1</span> Entrenar</button>
            <button className={tab === "test" ? "active" : ""} onClick={() => setTab("test")} role="tab"><span>2</span> Probar</button>
            <button className={tab === "install" ? "active" : ""} onClick={() => setTab("install")} role="tab"><span>3</span> Instalar</button>
          </div>

          <div className={`ai-connection ${openAIConnected ? "connected" : ""}`}>
            <div className="ai-connection-icon">{openAIConnected ? <Check size={19} /> : <Bot size={19} />}</div>
            <div className="ai-connection-copy">
              <strong>{openAIConnected ? "Tu cuenta de OpenAI está activa para todos los vendedores" : "OpenAI todavía no está conectado"}</strong>
              <span>{openAIConnected ? "Cada producto y cada cliente usan esta misma cuenta para responder y consumir tokens." : "La conexión se administra de forma privada desde el servidor."}</span>
            </div>
          </div>

          {tab === "config" && (
            <div className="studio-panel">
              <div className="panel-title">
                <div><small>Paso 1 de 3</small><h3>Cuéntale qué vende</h3></div>
                <div className="autosave"><Check size={14} /> Guardado</div>
              </div>
              <div className="form-grid">
                <label>Nombre del negocio<input value={config.businessName} onChange={(event) => update("businessName", event.target.value)} /></label>
                <label>Nombre del asesor<input value={config.agentName} onChange={(event) => update("agentName", event.target.value)} /></label>
                <label className="wide">Producto o servicio<input value={config.productName} onChange={(event) => update("productName", event.target.value)} /></label>
                <label>Precio<input value={config.price} onChange={(event) => update("price", event.target.value)} placeholder="$0" /></label>
                <label>Tono<select value={config.tone} onChange={(event) => update("tone", event.target.value)}><option>Cercano y experto</option><option>Directo y ejecutivo</option><option>Cálido y paciente</option><option>Enérgico y juvenil</option></select><ChevronDown size={16} /></label>
                <label className="wide">Descripción breve<textarea rows={3} value={config.description} onChange={(event) => update("description", event.target.value)} /></label>
                <label className="wide">Datos que debe conocer<textarea rows={4} value={config.knowledge} onChange={(event) => update("knowledge", event.target.value)} placeholder="Envíos, pagos, garantía, cobertura, preguntas frecuentes…" /><span className="field-help"><ShieldCheck size={14} /> Si un dato no está aquí, el agente dirá que no lo sabe.</span></label>
                <label className="wide upload-field"><span>Skills del vendedor (.md)</span><input type="file" accept=".md,text/markdown" onChange={(event) => { const file = event.target.files?.[0]; if (file) readSkillFile(file); }} /><span className="field-help"><Upload size={14} /> Sube reglas, descuentos, objeciones y cualquier instrucción comercial.</span>{config.instructions && <small className="file-ready">Archivo cargado y guardado en este navegador</small>}</label>
                <label className="upload-field"><span>Logo o foto del asesor</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) readLogoFile(file); }} /><span className="field-help"><Upload size={14} /> Se mostrará en el chat en lugar del robot.</span>{config.avatarData && <img className="logo-thumb" src={config.avatarData} alt="Vista previa del logo" />}</label>
                <label>Texto del cierre<input value={config.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} /></label>
                <label>WhatsApp<input value={config.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} inputMode="tel" /></label>
              </div>
              <button className="primary-button studio-next" onClick={() => setTab("test")}>Probar mi agente <ArrowRight size={18} /></button>
            </div>
          )}

          {tab === "test" && (
            <div className="studio-panel test-panel">
              <div className="panel-title"><div><small>Paso 2 de 3</small><h3>Hazle las preguntas difíciles</h3></div><span className={`demo-status ${openAIConnected ? "ai-active" : ""}`}><i /> {openAIConnected ? "ChatGPT activo" : "Demo local"}</span></div>
              <p className="test-intro">Prueba precios, entregas y objeciones. Si falta información, vuelve a entrenarlo antes de instalar.</p>
              <div className="desktop-chat"><ChatPreview config={config} compact /></div>
              <div className="panel-actions"><button className="secondary-button" onClick={() => setTab("config")}>Editar información</button><button className="primary-button" onClick={() => setTab("install")}>Listo para instalar <ArrowRight size={18} /></button></div>
            </div>
          )}

          {tab === "install" && (
            <div className="studio-panel install-panel">
              <div className="success-icon"><Check size={28} /></div>
              <span className="eyebrow">Agente listo</span>
              <h3>Pégalo una vez. Déjalo vender.</h3>
              <p>Primero pruébalo en una página de ejemplo. Cuando te guste, copia el código y pégalo antes de cerrar la etiqueta <code>&lt;/body&gt;</code> de la página de tu cliente.</p>
              <div className="install-actions"><button className="primary-button" onClick={openTestPage}><Bot size={17} /> Probar en una página</button><button className="secondary-button" onClick={() => void copySnippet()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Código copiado" : "Copiar código"}</button><button className="secondary-button" onClick={() => void copyPrompt()}>{promptCopied ? <Check size={17} /> : <Code2 size={17} />}{promptCopied ? "Prompt copiado" : "Copiar prompt para IA"}</button></div>
              <div className="code-box"><code>{snippet}</code></div>
              <div className="prompt-preview"><div className="prompt-preview-head"><strong>Prompt para instalar con IA</strong><button className="secondary-button" onClick={() => void copyPrompt()}>{promptCopied ? <Check size={15} /> : <Copy size={15} />}{promptCopied ? "Copiado" : "Copiar prompt"}</button></div><pre>{installPrompt}</pre></div>
              <div className="install-notes"><span><Check size={16} /> Aparece como botón flotante</span><span><Check size={16} /> Funciona en celular</span><span><Check size={16} /> Lleva cierres a WhatsApp</span></div>
              <button className="secondary-button" onClick={() => setTab("config")}>Seguir editando</button>
            </div>
          )}
        </div>

        <aside className="studio-preview">
          <div className="preview-label"><span>Vista del cliente</span><b>En vivo</b></div>
          <div className="browser-mock">
            <div className="browser-bar"><i /><i /><i /><span>casanorte.co</span></div>
            <div className="store-mock"><span>NUEVA COLECCIÓN</span><h3>Buenos días empiezan con buen café.</h3><div className="store-button">Ver colección</div></div>
            <div className="widget-peek"><ChatPreview config={config} /></div>
          </div>
        </aside>
      </div>

    </section>
  );
}

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main id="top">
      <header className="site-header">
        <Brand />
        <nav className={mobileMenu ? "open" : ""} aria-label="Navegación principal">
          <a href="#como-funciona" onClick={() => setMobileMenu(false)}>Cómo funciona</a>
          <a href="#crear" onClick={() => setMobileMenu(false)}>Demo</a>
          <a href="#para-quien" onClick={() => setMobileMenu(false)}>Para quién es</a>
        </nav>
        <a className="header-cta" href="#crear">Crear mi agente <ArrowRight size={16} /></a>
        <button className="menu-button" onClick={() => setMobileMenu((current) => !current)} aria-label="Abrir menú"><span /><span /></button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge"><Sparkles size={15} /> Vendedores IA para sitios web</div>
          <h1>Tu web ya recibe visitas.<br /><em>Haz que también cierre ventas.</em></h1>
          <p>Crea un asesor que aprende tu producto, responde preguntas y lleva a cada interesado hasta el siguiente paso.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#crear">Crear mi agente <ArrowRight size={18} /></a>
            <a className="text-button" href="#como-funciona"><span><MessageCircle size={17} /></span> Ver cómo funciona</a>
          </div>
          <div className="hero-proof"><span><Check size={15} /> Sin código</span><span><Check size={15} /> Instala en minutos</span><span><Check size={15} /> Disponible 24/7</span></div>
        </div>

        <div className="hero-visual" aria-label="Ejemplo de conversación de ventas">
          <div className="hero-glow" />
          <div className="conversation-card">
            <div className="conversation-head"><div className="agent-photo"><Bot size={21} /></div><div><strong>Nora</strong><span><i /> Asesora de Casa Norte</span></div><div className="head-dots">•••</div></div>
            <div className="conversation-body">
              <div className="bubble assistant">¡Hola! 👋 ¿Buscas mejorar el café que preparas en casa?</div>
              <div className="bubble user">Sí, pero no sé qué equipo necesito.</div>
              <div className="bubble assistant">Te recomiendo empezar con lo esencial. ¿Prefieres una preparación suave o más intensa?</div>
              <div className="bubble user">Más intensa.</div>
              <div className="bubble assistant">Entonces el Kit Ritual puede encajarte muy bien. Incluye molino y prensa para controlar mejor el sabor.</div>
              <button className="conversation-cta"><MessageCircle size={16} /> Quiero comprarlo</button>
            </div>
          </div>
          <div className="floating-note note-one"><Zap size={18} /><span><b>Respuesta inmediata</b>Incluso fuera de horario</span></div>
          <div className="floating-note note-two"><Target size={18} /><span><b>Intención detectada</b>Listo para pasar a ventas</span></div>
        </div>
      </section>

      <section className="value-strip" id="para-quien">
        <p>Un solo agente. Tres trabajos que hoy se pierden entre clics.</p>
        <div className="value-items">
          <article><MessageCircle size={22} /><div><strong>Responde</strong><span>Dudas reales, al instante</span></div></article>
          <article><Target size={22} /><div><strong>Califica</strong><span>Entiende qué necesita cada visita</span></div></article>
          <article><ArrowRight size={22} /><div><strong>Convierte</strong><span>Envía el cierre a tu canal de venta</span></div></article>
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="section-heading left">
          <span className="eyebrow">Así de simple</span>
          <h2>Tu producto pone el conocimiento.<br />Cierra pone la conversación.</h2>
        </div>
        <div className="steps-grid">
          <article><span className="step-number">01</span><div className="step-icon"><Upload size={23} /></div><h3>Entrénalo</h3><p>Escribe lo esencial: producto, precio, beneficios, políticas y preguntas frecuentes.</p></article>
          <article><span className="step-number">02</span><div className="step-icon"><Sparkles size={23} /></div><h3>Ponlo a prueba</h3><p>Conversa como si fueras un cliente y corrige lo que debe saber antes de publicarlo.</p></article>
          <article><span className="step-number">03</span><div className="step-icon"><Code2 size={23} /></div><h3>Instálalo</h3><p>Copia una línea en la web. El agente aparece como un chat flotante, listo para vender.</p></article>
        </div>
      </section>

      <ProductStudio />

      <section className="principles-section">
        <div className="principles-card">
          <div><span className="eyebrow">Vender sin perder confianza</span><h2>Si no lo sabe, no lo inventa.</h2><p>El agente trabaja con la información aprobada por el negocio. Cuando falta un dato, lo reconoce y ofrece pasar la conversación a una persona.</p></div>
          <div className="principle-list"><span><ShieldCheck size={20} /> Precios y condiciones controlados</span><span><Bot size={20} /> Tono alineado con la marca</span><span><MessageCircle size={20} /> Escalamiento a WhatsApp</span></div>
        </div>
      </section>

      <section className="final-cta">
        <span className="cta-orbit orbit-one" /><span className="cta-orbit orbit-two" />
        <div className="cta-icon"><ArrowRight size={26} /></div>
        <h2>Tu próximo vendedor<br />puede estar listo hoy.</h2>
        <p>Personaliza la demo, pruébala con tu producto y descubre cómo se vería en la web de un cliente.</p>
        <a className="light-button" href="#crear">Crear mi agente <ArrowRight size={18} /></a>
      </section>

      <footer>
        <Brand inverse />
        <p>Agentes de venta que convierten visitas en conversaciones.</p>
        <a href="#top">Volver arriba ↑</a>
      </footer>
    </main>
  );
}
