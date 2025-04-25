import "../global.css";
import { Popup } from "../popup/popup";
import "../global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../theme/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="bg-background text-foreground w-full h-[100vh]">
        <Popup />
      </div>
    </ThemeProvider>
  </StrictMode>
);
