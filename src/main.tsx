import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "./chrome-extension/popup/index";
import "./chrome-extension/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="w-[600px] h-[500px] bg-[#322f2c]">
      <Popup />
    </div>
  </StrictMode>
);
