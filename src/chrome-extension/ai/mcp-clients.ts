import { experimental_createMCPClient as createMCPClient } from "ai";
import { ExternalToolsStorage } from "../storage/externalToolSettings";
import { LanguageModelWithOptions } from "./provider";

export const getActiveMCPClients = async (
  languageModel: LanguageModelWithOptions
) => {
  if (!languageModel.toolUse) {
    return [];
  }

  const clients = [];
  const externalToolSettings =
    await ExternalToolsStorage.loadExternalToolSettings();
  const mcpServers = externalToolSettings.mcp.servers;
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
        console.error(
          `Error creating MCP client for server ${server.name} ${server.url}:`,
          error
        );
      }
    }
  }
  return clients;
};
