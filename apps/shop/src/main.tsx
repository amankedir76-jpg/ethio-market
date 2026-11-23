import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "@ethio/core";
import { App } from "./App";
import { texts } from "./texts";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider texts={texts}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);

// App installierbar machen und Grundgerüst offline verfügbar halten
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}
