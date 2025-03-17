import "../global.css";
import { useState } from "react";
import { TabButton } from "./TabButton";
import { ChatTab } from "./ChatTab";
import { SettingsTab } from "./SettingsTab";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");

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
            isActive={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </TabButton>
        </div>
      </nav>

      {/* Content */}
      <div className="h-[calc(100%-48px)] overflow-y-auto">
        {activeTab === "chat" ? <ChatTab /> : <SettingsTab />}
      </div>
    </div>
  );
};
