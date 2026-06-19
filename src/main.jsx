import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/globals.css";
import "./styles/theme.css";

import { RadioProvider } from "./core/providers/RadioProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RadioProvider>
      <App />
    </RadioProvider>
  </React.StrictMode>
);