import { ProviderOptions } from "./ai-sdk-missing";

export interface ProviderSettings {
  all: LLMProviderSettings[];
  active: LLMProviderSettings | null;
}

export interface LLMProviderSettings {
  provider: string;
  url?: string;
  enableToolCalls: boolean;
  apiKey: string;
  providerOptions?: ProviderOptions;
  model: string;
}

export interface ExternalToolSettings {
  braveSearch: {
    apiKey: string;
  };
  // Room for future external tools
}
