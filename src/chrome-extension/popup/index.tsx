import "../global.css";
import { useState } from "react";
import { TabButton } from "./TabButton";
import { ChatTab } from "./ChatTab";
import { ProviderSettingsTab } from "./ProviderSettingsTab";
import { ExternalToolSettingsTab } from "./ExternalToolSettingsTab";
import ExtensionSettingsTab from "./ExtensionSettingsTab";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<
    "chat" | "providerSettings" | "externalToolSettings" | "extensionSettings"
  >("chat");

  return (
    <div className="w-full h-[500px]">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="flex space-x-4 px-4">
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
            isActive={activeTab === "externalToolSettings"}
            onClick={() => setActiveTab("externalToolSettings")}
          >
            External Tools
          </TabButton>
          <TabButton
            isActive={activeTab === "extensionSettings"}
            onClick={() => setActiveTab("extensionSettings")}
          >
            Extension Settings
          </TabButton>
        </div>
      </nav>

      {/* Content */}
      <div className="h-[calc(100%-48px)] overflow-y-auto">
        {activeTab === "chat" ? (
          <ChatTab />
        ) : activeTab === "providerSettings" ? (
          <ProviderSettingsTab />
        ) : activeTab === "externalToolSettings" ? (
          <ExternalToolSettingsTab />
        ) : (
          <ExtensionSettingsTab />
        )}
      </div>
    </div>
  );
};
