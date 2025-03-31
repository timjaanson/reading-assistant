import "../global.css";
import { Popup } from "../popup/popup";
import "../global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="bg-[#322f2c] w-full h-[100vh]">
      <Popup />
    </div>
  </StrictMode>
);
