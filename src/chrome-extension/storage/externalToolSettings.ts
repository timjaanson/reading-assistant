import { ExternalToolSettings } from "../types/settings";
import { StorageKeys } from "./settings";

export const defaultExternalToolSettings: ExternalToolSettings = {
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
};

export class ExternalToolsStorage {
  static async saveExternalToolSettings(
    settings: ExternalToolSettings
  ): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageKeys.ExternalToolSettings]: settings,
      });
    } catch (error) {
      console.error("Error saving external tool settings:", error);
      throw error;
    }
  }

  static async loadExternalToolSettings(): Promise<ExternalToolSettings> {
    try {
      const result = await chrome.storage.local.get(
        StorageKeys.ExternalToolSettings
      );
      return (
        result[StorageKeys.ExternalToolSettings] || defaultExternalToolSettings
      );
    } catch (error) {
      console.error("Error loading external tool settings:", error);
      throw error;
    }
  }

  static async updateExternalToolSettings(
    partialSettings: Partial<ExternalToolSettings>
  ): Promise<ExternalToolSettings> {
    const currentSettings = await this.loadExternalToolSettings();
    const newSettings = {
      ...currentSettings,
      ...partialSettings,
      search: {
        ...currentSettings.search,
        ...(partialSettings.search || {}),
      },
    };
    await this.saveExternalToolSettings(newSettings);
    return newSettings;
  }
}
