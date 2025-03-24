import { ExtensionSettings } from "../types/extensionSettings";
import { StorageKeys } from "./settings";

// Add new storage key for extension settings
export const MATCHED_URLS_PDF_SPECIAL_CASE = "PDF";

// Default settings
export const defaultExtensionSettings: ExtensionSettings = {
  whenSelectingText: {
    hoveringTooltip: {
      active: true,
      allowedUrls: [MATCHED_URLS_PDF_SPECIAL_CASE],
    },
    contextMenu: {
      active: true,
    },
  },
};

export const urlMatchesAllowedUrls = (url: string, allowedUrls: string[]) => {
  if (allowedUrls.includes("*")) {
    return true;
  }

  const patterns = allowedUrls
    .filter((pattern) => pattern !== MATCHED_URLS_PDF_SPECIAL_CASE)
    .map((pattern) => {
      // Escape special regex characters except for wildcards
      const escaped = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\*/g, "*");
      // Replace all wildcards with .*
      return `^${escaped.replace(/\*/g, ".*")}$`;
    });

  if (patterns.length === 0) {
    return false;
  }

  const regex = new RegExp(patterns.join("|"));
  return regex.test(url);
};

/**
 * Get extension settings from chrome storage
 */
export const getExtensionSettings = async (): Promise<ExtensionSettings> => {
  try {
    const result = (await chrome.storage.local.get(
      StorageKeys.ExtensionSettings
    )) as Record<string, ExtensionSettings>;
    return result[StorageKeys.ExtensionSettings] || defaultExtensionSettings;
  } catch (error) {
    console.error("Error loading extension settings:", error);
    return defaultExtensionSettings;
  }
};

/**
 * Save extension settings to chrome storage
 */
export const setExtensionSettings = async (
  settings: ExtensionSettings
): Promise<void> => {
  try {
    await chrome.storage.local.set({
      [StorageKeys.ExtensionSettings]: settings,
    });
  } catch (error) {
    console.error("Error saving extension settings:", error);
    throw error;
  }
};

/**
 * Update partial extension settings
 */
export const updateExtensionSettings = async (
  partialSettings: Partial<ExtensionSettings>
): Promise<ExtensionSettings> => {
  const currentSettings = await getExtensionSettings();

  // Deep merge the settings
  const newSettings = {
    ...currentSettings,
    ...partialSettings,
    whenSelectingText: {
      ...currentSettings.whenSelectingText,
      ...(partialSettings.whenSelectingText || {}),
      hoveringTooltip: {
        ...currentSettings.whenSelectingText?.hoveringTooltip,
        ...(partialSettings.whenSelectingText?.hoveringTooltip || {}),
      },
      contextMenu: {
        ...currentSettings.whenSelectingText?.contextMenu,
        ...(partialSettings.whenSelectingText?.contextMenu || {}),
      },
    },
  };

  await setExtensionSettings(newSettings);
  return newSettings;
};
