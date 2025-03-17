export interface ProviderSettings {
  provider: string;
  url?: string;
  apiKey: string;
  model: string;
}

export interface UserSettings {
  settings: ProviderSettings[];
  activeProviderSettings?: ProviderSettings;
}
