import "./chrome-extension/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./chrome-extension/theme/theme-provider";
import { MainView } from "./chrome-extension/views/MainView";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="bg-background text-foreground w-full h-[100vh] p-1">
        <MainView />
      </div>
    </ThemeProvider>
  </StrictMode>
);
