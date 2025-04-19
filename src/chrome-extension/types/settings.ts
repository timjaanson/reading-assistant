import { ProviderOptions } from "./ai-sdk-missing";

export interface ProviderSettings {
  all: Provider[];
  active: Provider | null;
}

export interface Provider {
  provider: string;
  name?: string;
  url?: string;
  enableToolCalls: boolean;
  apiKey: string;
  providerOptions?: ProviderOptions;
  model: string;
}

export interface ExternalTool {
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

export interface ExternalToolSettings {
  search: {
    options: ExternalTool[];
    active: ExternalTool | null;
  };
  mcp: {
    servers: MCPServer[];
  };
}
