import {
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
} from "ai";
import { ToolsSettingsStorage } from "../storage/toolSettings";
import { LanguageModelWithOptions } from "./provider";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const getActiveMCPClients = async (
  languageModel: LanguageModelWithOptions
) => {
  if (!languageModel.toolUse) {
    return [];
  }

  const clients = [];
  const toolSettings = await ToolsSettingsStorage.loadToolSettings();
  const mcpServers = toolSettings.mcp.servers;
  for (const server of mcpServers) {
    if (server.active) {
      try {
        let transport: MCPTransport;
        switch (server.transport) {
          case "http-stream":
            transport = new StreamableHTTPClientTransport(new URL(server.url), {
              requestInit: {
                headers: server.headers,
              },
            });
            break;
          case "sse":
            transport = {
              type: "sse",
              url: server.url,
              headers: server.headers,
            } as unknown as MCPTransport; //Missing correct type for SSE transport
            break;
          default:
            throw new Error(`Invalid transport type: ${server.transport}`);
        }
        clients.push(
          await createMCPClient({
            transport: transport,
            name: server.name,
          })
        );
      } catch (error) {
        console.warn(
          `Error creating MCP client for server ${server.name} ${server.url}:`,
          error
        );
      }
    }
  }
  return clients;
};
