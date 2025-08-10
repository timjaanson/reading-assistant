import { ProviderOptions } from "./ai-sdk-missing";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "openai-compatible";

export interface ProviderSettings {
  all: Provider[];
  active: ActiveModel | null;
}

export interface ActiveModel {
  providerId: ProviderId;
  modelId: string;
  name: string;
}

export interface Provider {
  providerId: ProviderId;
  name: string;
  url?: string;
  apiKey: string;
  providerOptions?: ProviderOptions;
  models: Model[];
}

export interface Model {
  modelId: string;
  name: string;
  enableToolCalls: boolean;
  providerId: ProviderId;
  options: ModelOptions;
}

export interface ModelOptions {
  maxOutputTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  providerOptions?: ProviderOptions;
}

export interface ModelWithActiveAndProviderName extends Model {
  providerName: string;
  active: boolean;
}

export interface FlatModelsList {
  models: ModelWithActiveAndProviderName[];
  active: ActiveModel | null;
}

export interface ExtensionTool {
  id: string;
  name: string;
  apiKey: string;
}

export interface MCPServer {
  active: boolean;
  name: string;
  url: string;
  headers: Record<string, string>;
}

export interface ToolSettings {
  search: {
    options: ExtensionTool[];
    active: ExtensionTool | null;
  };
  extractActiveTab: {
    active: boolean;
  };
  memoryManagement: {
    active: boolean;
  };
  mcp: {
    servers: MCPServer[];
  };
}
