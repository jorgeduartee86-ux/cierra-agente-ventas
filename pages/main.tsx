import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

declare global {
  interface Window {
    __CIERRA_API_ORIGIN__?: string;
  }
}

window.__CIERRA_API_ORIGIN__ = "https://cierra-agente-ventas.jorgeduartee86.chatgpt.site";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
