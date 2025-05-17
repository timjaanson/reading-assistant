import { experimental_createMCPClient as createMCPClient } from "ai";
import { ToolsSettingsStorage } from "../storage/toolSettings";
import { LanguageModelWithOptions } from "./provider";

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
        clients.push(
          await createMCPClient({
            transport: {
              type: "sse",
              url: server.url,
              headers: server.headers,
            },
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
