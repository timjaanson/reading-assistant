import { ToolSettings } from "../types/settings";
import { StorageKeys } from "./settings";

export const defaultExternalToolSettings: ToolSettings = {
  search: {
    options: [
      {
        id: "braveSearch",
        name: "Brave Search",
        apiKey: "",
      },
      {
        id: "tavily",
        name: "Tavily",
        apiKey: "",
      },
    ],
    active: null,
  },
  extractActiveTab: {
    active: true,
  },
  memoryManagement: {
    active: false,
  },
  mcp: {
    servers: [],
  },
};

export class ToolsSettingsStorage {
  static async saveToolSettings(settings: ToolSettings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageKeys.ExternalToolSettings]: settings,
      });
    } catch (error) {
      console.error("Error saving external tool settings:", error);
      throw error;
    }
  }

  static async loadToolSettings(): Promise<ToolSettings> {
    try {
      const result = await chrome.storage.local.get(
        StorageKeys.ExternalToolSettings
      );

      const storedSettings =
        result[StorageKeys.ExternalToolSettings] || defaultExternalToolSettings;

      if (!storedSettings.mcp) {
        storedSettings.mcp = { ...defaultExternalToolSettings.mcp };
      }

      if (!storedSettings.extractActiveTab) {
        storedSettings.extractActiveTab = {
          ...defaultExternalToolSettings.extractActiveTab,
        };
      }

      if (!storedSettings.memoryManagement) {
        storedSettings.memoryManagement = {
          ...defaultExternalToolSettings.memoryManagement,
        };
      }

      if (!storedSettings.mcp.servers) {
        storedSettings.mcp.servers = [
          ...defaultExternalToolSettings.mcp.servers,
        ];
      }

      return storedSettings;
    } catch (error) {
      console.error("Error loading external tool settings:", error);
      throw error;
    }
  }

  static async updateToolSettings(
    partialSettings: Partial<ToolSettings>
  ): Promise<ToolSettings> {
    const currentSettings = await this.loadToolSettings();
    const newSettings = {
      ...currentSettings,
      ...partialSettings,
      search: {
        ...currentSettings.search,
        ...(partialSettings.search || {}),
      },
    };
    await this.saveToolSettings(newSettings);
    return newSettings;
  }
}
