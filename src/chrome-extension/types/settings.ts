export interface ProviderSettings {
  all: LLMProviderSettings[];
  active: LLMProviderSettings | null;
}

export interface LLMProviderSettings {
  provider: string;
  url?: string;
  enableToolCalls: boolean;
  apiKey: string;
  model: string;
}
