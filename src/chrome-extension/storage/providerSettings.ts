import { ProviderSettings } from "../types/settings";
import { StorageKeys } from "./settings";

export const defaultProviderSettings: ProviderSettings = {
  all: [
    {
      provider: "ollama",
      url: "http://localhost:11434/api",
      enableToolCalls: false,
      apiKey: "",
      providerOptions: {},
      model: "gemma3:4b",
    },
    {
      provider: "openai",
      apiKey: "",
      enableToolCalls: true,
      model: "gpt-4o-mini",
      providerOptions: {},
    },
    {
      provider: "anthropic",
      apiKey: "",
      enableToolCalls: true,
      model: "claude-3-7-sonnet-latest",
      providerOptions: {
        anthropic: {
          thinking: {
            budgetTokens: 8000,
            type: "enabled",
          },
        },
      },
    },
    {
      provider: "google",
      apiKey: "",
      enableToolCalls: false,
      model: "gemini-2.0-flash",
      providerOptions: {},
    },
    {
      provider: "custom-provider-openai",
      name: "openai-compliant-provider",
      url: "https://custom.example-provider.com/v1",
      apiKey: "",
      enableToolCalls: false,
      model: "llama3.1:8b",
      providerOptions: {},
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
