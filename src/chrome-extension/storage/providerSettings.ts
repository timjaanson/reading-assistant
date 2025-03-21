import { ProviderSettings } from "../types/settings";
import { StorageKeys } from "./settings";

export const defaultProviderSettings: ProviderSettings = {
  all: [
    {
      provider: "openai",
      apiKey: "",
      model: "gpt-4o-mini",
    },
    {
      provider: "anthropic",
      apiKey: "",
      model: "claude-3-5-sonnet-latest",
    },
    {
      provider: "ollama",
      url: "http://localhost:11434/api",
      apiKey: "",
      model: "llama3.1:8b",
    },
  ],
  active: null,
};

export class SettingsStorage {
  static async saveProviderSettings(settings: ProviderSettings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageKeys.ProviderSettings]: settings,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  static async loadProviderSettings(): Promise<ProviderSettings> {
    try {
      const result = await chrome.storage.local.get(
        StorageKeys.ProviderSettings
      );
      return result[StorageKeys.ProviderSettings] || defaultProviderSettings;
    } catch (error) {
      console.error("Error loading settings:", error);
      throw error;
    }
  }

  static async updateProviderSettings(
    partialSettings: Partial<ProviderSettings>
  ): Promise<ProviderSettings> {
    const currentSettings = await this.loadProviderSettings();
    const newSettings = {
      ...currentSettings,
      ...partialSettings,
      all: {
        ...currentSettings.all,
        ...(partialSettings.all || {}),
      },
    };
    await this.saveProviderSettings(newSettings);
    return newSettings;
  }
}
