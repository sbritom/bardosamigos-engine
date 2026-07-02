import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/globals.css";
import "./styles/theme.css";

import { RadioProvider } from "./core/providers/RadioProvider";
import { DesignerRuntimeProvider } from "./modules/barstudio/designer/runtime";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RadioProvider>
      <DesignerRuntimeProvider page="home">
        <App />
      </DesignerRuntimeProvider>
    </RadioProvider>
  </React.StrictMode>
);
