import React from "react";
import { createRoot } from "react-dom/client";
import "../../app/globals.css";
import { WebsiteApp } from "../../app/WebsiteApp";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WebsiteApp />
  </React.StrictMode>,
);
