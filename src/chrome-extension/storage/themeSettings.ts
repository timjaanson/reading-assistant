import { Theme } from "../types/theme";

const THEME_STORAGE_KEY = "reading-assistant-theme";

export const getStoredTheme = async () => {
  try {
    const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
    return result[THEME_STORAGE_KEY] as Theme | undefined;
  } catch (error) {
    console.error("Failed to get theme from storage:", error);
    return undefined;
  }
};

export const setStoredTheme = async (theme: Theme) => {
  try {
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
  } catch (error) {
    console.error("Failed to set theme in storage:", error);
  }
};
