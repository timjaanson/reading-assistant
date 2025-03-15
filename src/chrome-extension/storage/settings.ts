import { UserSettings, defaultSettings } from "../types/settings";

export class SettingsStorage {
  static async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ userSettings: settings });
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  static async loadSettings(): Promise<UserSettings> {
    try {
      const result = await chrome.storage.local.get("userSettings");
      return result.userSettings || defaultSettings;
    } catch (error) {
      console.error("Error loading settings:", error);
      throw error;
    }
  }

  static async updateSettings(
    partialSettings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const currentSettings = await this.loadSettings();
    const newSettings = {
      ...currentSettings,
      ...partialSettings,
      settings: {
        ...currentSettings.settings,
        ...(partialSettings.settings || {}),
      },
    };
    await this.saveSettings(newSettings);
    return newSettings;
  }
}
