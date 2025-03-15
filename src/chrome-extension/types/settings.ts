export interface ProviderSettings {
  apiKey: string;
  model: string;
}

export interface UserSettings {
  provider: string;
  settings: ProviderSettings;
}

export const defaultSettings: UserSettings = {
  provider: "openai",
  settings: {
    apiKey: "",
    model: "gpt-4o-mini",
  },
};
