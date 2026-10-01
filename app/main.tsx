import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import "./app.css";
import { App } from "./App";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
