import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "./chrome-extension/popup/popup";
import "./chrome-extension/global.css";

// compute popup size based on screen availability
const availWidth = window.screen.availWidth;
const availHeight = window.screen.availHeight;
const widthPx = Math.min(availWidth * 0.4, 800);
const heightPx = Math.min(availHeight * 0.66, 600);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        backgroundColor: "#322f2c",
      }}
    >
      <Popup />
    </div>
  </StrictMode>
);
