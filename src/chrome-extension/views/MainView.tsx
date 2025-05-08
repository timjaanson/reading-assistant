import "../global.css";
import { useState } from "react";
import { TabButton } from "./TabButton";
import { ProviderSettingsTab } from "./ProviderSettingsTab";
import { ExternalToolSettingsTab } from "./ExternalToolSettingsTab";
import ExtensionSettingsTab from "./ExtensionSettingsTab";
import MemoryTab from "./MemoryTab";
import { ChatTab } from "./ChatTab";
import { HtmlViewer } from "../components/HtmlViewer";

export const MainView = () => {
  const [activeTab, setActiveTab] = useState<
    | "chat"
    | "providerSettings"
    | "externalToolSettings"
    | "extensionSettings"
    | "memory"
    | "htmlViewer"
  >("chat");

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="flex space-x-4 px-4 overflow-y-auto">
          <TabButton
            isActive={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </TabButton>
          <TabButton
            isActive={activeTab === "providerSettings"}
            onClick={() => setActiveTab("providerSettings")}
          >
            Providers
          </TabButton>
          <TabButton
            isActive={activeTab === "memory"}
            onClick={() => setActiveTab("memory")}
          >
            Memory
          </TabButton>
          <TabButton
            isActive={activeTab === "externalToolSettings"}
            onClick={() => setActiveTab("externalToolSettings")}
          >
            Tools
          </TabButton>
          <TabButton
            isActive={activeTab === "extensionSettings"}
            onClick={() => setActiveTab("extensionSettings")}
          >
            Settings
          </TabButton>
          <TabButton
            isActive={activeTab === "htmlViewer"}
            onClick={() => setActiveTab("htmlViewer")}
          >
            HTML Viewer
          </TabButton>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chat" ? (
          <ChatTab />
        ) : activeTab === "providerSettings" ? (
          <ProviderSettingsTab />
        ) : activeTab === "externalToolSettings" ? (
          <ExternalToolSettingsTab />
        ) : activeTab === "extensionSettings" ? (
          <ExtensionSettingsTab />
        ) : activeTab === "memory" ? (
          <MemoryTab />
        ) : activeTab === "htmlViewer" ? (
          <HtmlViewer />
        ) : null}
      </div>
    </div>
  );
};
