(function () {
  var script = document.currentScript;
  if (!script || document.querySelector("[data-cierra-widget-root]")) return;

  var sourceOrigin = new URL(script.src, window.location.href).origin;
  var encoded = script.getAttribute("data-cierra") || "";
  var defaults = {
    businessName: "Tu negocio",
    agentName: "Tu asesor",
    productName: "nuestro producto",
    ctaLabel: "Hablar por WhatsApp",
    whatsapp: "",
    accent: "#ff5d3a",
    avatarData: ""
  };
  var config = defaults;

  try {
    var bytes = Uint8Array.from(window.atob(encoded), function (char) { return char.charCodeAt(0); });
    config = Object.assign({}, defaults, JSON.parse(new TextDecoder().decode(bytes)));
  } catch (_) {}

  var host = document.createElement("div");
  host.setAttribute("data-cierra-widget-root", "");
  host.style.position = "fixed";
  host.style.zIndex = "2147483000";
  host.style.right = "20px";
  host.style.bottom = "20px";
  document.body.appendChild(host);

  var root = host.attachShadow({ mode: "open" });
  var style = document.createElement("style");
  style.textContent = `
    *{box-sizing:border-box}button,input{font:inherit}.cierra-launcher{width:58px;height:58px;border:0;border-radius:18px;background:${config.accent};color:#fff;display:grid;place-items:center;box-shadow:0 14px 35px rgba(28,22,16,.25);cursor:pointer;margin-left:auto;transition:transform .2s}.cierra-launcher:hover{transform:translateY(-2px)}.cierra-launcher span{font-size:25px;line-height:1}.cierra-panel{width:min(360px,calc(100vw - 28px));height:min(530px,calc(100vh - 105px));margin-bottom:12px;border:1px solid rgba(28,22,16,.12);border-radius:20px;background:#f7f3eb;box-shadow:0 24px 60px rgba(28,22,16,.24);overflow:hidden;display:none;flex-direction:column;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#181713}.cierra-panel.open{display:flex}.cierra-head{min-height:70px;padding:0 15px;background:#fff;border-bottom:1px solid #e9e3d9;display:flex;align-items:center;gap:11px}.cierra-avatar{width:40px;height:40px;border-radius:13px;background:${config.accent};color:#fff;display:grid;place-items:center;font-size:18px;font-weight:800}.cierra-id{display:flex;flex-direction:column;gap:3px}.cierra-id strong{font-size:14px}.cierra-id span{color:#7c766d;font-size:10px}.cierra-id i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#46a66a;margin-right:4px}.cierra-close{margin-left:auto;width:34px;height:34px;border:0;background:transparent;color:#817b72;font-size:23px;cursor:pointer}.cierra-messages{flex:1;min-height:0;overflow-y:auto;padding:16px 13px;display:flex;flex-direction:column;gap:9px}.cierra-bubble{width:fit-content;max-width:86%;border-radius:14px;padding:10px 12px;font-size:12.5px;line-height:1.45}.cierra-bubble.agent{background:#fff;border-bottom-left-radius:4px;box-shadow:0 2px 8px rgba(28,22,16,.04)}.cierra-bubble.user{align-self:flex-end;background:${config.accent};color:#fff;border-bottom-right-radius:4px}.cierra-typing{display:flex;gap:4px}.cierra-typing i{width:5px;height:5px;background:#aaa39a;border-radius:50%}.cierra-cta{margin:0 12px 9px;min-height:39px;border-radius:10px;background:${config.accent};color:#fff;display:none;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:750}.cierra-cta.show{display:flex}.cierra-form{min-height:58px;background:#fff;border-top:1px solid #e9e3d9;padding:8px;display:flex;gap:7px}.cierra-form input{min-width:0;flex:1;border:1px solid #ddd6cb;border-radius:10px;padding:0 11px;outline:0;color:#181713}.cierra-form input:focus{border-color:${config.accent}}.cierra-send{width:41px;border:0;border-radius:10px;background:${config.accent};color:#fff;cursor:pointer;font-size:18px}.cierra-powered{height:20px;background:#fff;text-align:center;color:#9c958c;font-size:8px}.cierra-powered b{color:#5e5850}@media(max-width:480px){.cierra-panel{height:calc(100vh - 96px)}.cierra-launcher{width:54px;height:54px}}@media(prefers-reduced-motion:reduce){.cierra-launcher{transition:none}}
  `;
  root.appendChild(style);

  var panel = document.createElement("section");
  panel.className = "cierra-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Asesor de ventas de " + config.businessName);
  panel.innerHTML = '<header class="cierra-head"><div class="cierra-avatar">→</div><div class="cierra-id"><strong></strong><span><i></i></span></div><button class="cierra-close" aria-label="Cerrar chat">×</button></header><div class="cierra-messages" aria-live="polite"></div><a class="cierra-cta" target="_blank" rel="noreferrer"></a><form class="cierra-form"><input aria-label="Mensaje" placeholder="Escribe tu pregunta…"><button class="cierra-send" aria-label="Enviar">→</button></form><div class="cierra-powered">Creado con <b>cierra.</b></div>';

  var launcher = document.createElement("button");
  launcher.className = "cierra-launcher";
  launcher.setAttribute("aria-label", "Abrir asesor de ventas");
  launcher.innerHTML = '<span>↗</span>';
  root.appendChild(panel);
  root.appendChild(launcher);

  var identity = panel.querySelector(".cierra-id");
  var avatar = panel.querySelector(".cierra-avatar");
  avatar.textContent = "";
  if (config.avatarData) { avatar.style.backgroundImage = "url('" + config.avatarData + "')"; avatar.style.backgroundSize = "cover"; avatar.style.backgroundPosition = "center"; } else { avatar.textContent = "→"; }
  identity.querySelector("strong").textContent = config.agentName;
  identity.querySelector("span").appendChild(document.createTextNode(" En línea · " + config.businessName));
  var messages = panel.querySelector(".cierra-messages");
  var form = panel.querySelector(".cierra-form");
  var input = form.querySelector("input");
  var close = panel.querySelector(".cierra-close");
  var cta = panel.querySelector(".cierra-cta");
  var history = [];
  var busy = false;

  function addMessage(role, content) {
    var bubble = document.createElement("div");
    bubble.className = "cierra-bubble " + (role === "user" ? "user" : "agent");
    bubble.textContent = content;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    history.push({ role: role === "user" ? "user" : "assistant", content: content });
  }

  function showCta() {
    if (!config.whatsapp) return;
    cta.href = "https://wa.me/" + String(config.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola, me interesa " + config.productName);
    cta.textContent = config.ctaLabel;
    cta.classList.add("show");
  }

  addMessage("assistant", "¡Hola! Soy " + config.agentName + ". ¿Qué te gustaría saber sobre " + config.productName + "?");

  launcher.addEventListener("click", function () {
    panel.classList.add("open");
    launcher.style.display = "none";
    window.setTimeout(function () { input.focus(); }, 50);
  });
  close.addEventListener("click", function () {
    panel.classList.remove("open");
    launcher.style.display = "grid";
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var message = input.value.trim();
    if (!message || busy) return;
    var previous = history.slice();
    addMessage("user", message);
    input.value = "";
    busy = true;
    var typing = document.createElement("div");
    typing.className = "cierra-bubble agent cierra-typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      var response = await fetch(sourceOrigin + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message, config: config, history: previous })
      });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "OpenAI no pudo responder");
      typing.remove();
      addMessage("assistant", data.reply || "¿Quieres que te conecte con el equipo?");
      if (/comprar|interesa|pedido|precio|siguiente paso/i.test(message + " " + (data.reply || ""))) showCta();
    } catch (_) {
      typing.remove();
      addMessage("assistant", "No pude usar ChatGPT ahora. Puedes continuar directamente con el equipo por WhatsApp.");
      showCta();
    } finally {
      busy = false;
      input.focus();
    }
  });
})();
