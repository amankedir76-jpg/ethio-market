import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "@ethio/core";
import { App } from "./App";
import { texts } from "./texts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider texts={texts}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
