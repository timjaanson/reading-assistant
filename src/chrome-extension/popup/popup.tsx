import "../global.css";
import { useState } from "react";
import { TabButton } from "./TabButton";
import { ProviderSettingsTab } from "./ProviderSettingsTab";
import { ExternalToolSettingsTab } from "./ExternalToolSettingsTab";
import ExtensionSettingsTab from "./ExtensionSettingsTab";
import MemoryTab from "./MemoryTab";
import { ExperimentsTab } from "./ExperimentsTab";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<
    | "chat"
    | "providerSettings"
    | "externalToolSettings"
    | "extensionSettings"
    | "memory"
    | "experiments"
  >("chat");

  return (
    <div className="w-full h-full">
      {/* Navigation */}
      <nav className="border-b border-gray-700">
        <div className="flex space-x-4 px-4 overflow-y-auto">
          <TabButton
            isActive={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </TabButton>
          <TabButton
            isActive={activeTab === "memory"}
            onClick={() => setActiveTab("memory")}
          >
            Memory
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
            Tools
          </TabButton>
          <TabButton
            isActive={activeTab === "extensionSettings"}
            onClick={() => setActiveTab("extensionSettings")}
          >
            Settings
          </TabButton>
          <TabButton
            isActive={activeTab === "experiments"}
            onClick={() => setActiveTab("experiments")}
          >
            Experiments
          </TabButton>
        </div>
      </nav>

      {/* Content */}
      <div className="h-[calc(100%-48px)] overflow-y-auto">
        {activeTab === "chat" ? (
          <ExperimentsTab />
        ) : activeTab === "providerSettings" ? (
          <ProviderSettingsTab />
        ) : activeTab === "externalToolSettings" ? (
          <ExternalToolSettingsTab />
        ) : activeTab === "extensionSettings" ? (
          <ExtensionSettingsTab />
        ) : activeTab === "memory" ? (
          <MemoryTab />
        ) : null}
      </div>
    </div>
  );
};
