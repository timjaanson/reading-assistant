import { CoreMessage, streamText } from "ai";
import { defaultSystemMessage } from "./prompts";
import { getLanguageModel } from "./provider";
import { getTooling } from "./tooling";
import { getActiveMCPClients } from "./mcp-clients";

export type GetTextResponseOptions = {
  systemPrompt?: string;
  abortSignal?: AbortSignal;
};

export const getStreamedTextResponse = async (
  messages: CoreMessage[],
  options: GetTextResponseOptions = {}
) => {
  try {
    const languageModel = await getLanguageModel();
    const tooling = await getTooling(languageModel);

    const stream = streamText({
      model: languageModel.model,
      system: options.systemPrompt || (await defaultSystemMessage()),
      messages,
      tools: tooling?.tools,
      toolChoice: tooling?.toolChoice,
      maxSteps: 10,
      providerOptions: languageModel.providerOptions,
      abortSignal: options.abortSignal,
      onError: (error) => {
        console.error("Error getting streamed text response", error);
        throw error;
      },
    });

    return stream;
  } catch (error) {
    console.error("Error getting streamed text response", error);
    throw error;
  }
};

// Updated to accept any message format
export const getCustomBackendResponse = async (
  messages: any[],
  options: GetTextResponseOptions = {}
) => {
  const languageModel = await getLanguageModel();
  const tooling = await getTooling(languageModel);
  const mcpClients = await getActiveMCPClients(languageModel);

  //iterate clients inside try catch and return tools from all as single array
  const mcpTools = [];
  for (const client of mcpClients) {
    try {
      const toolsResult = await client.tools();
      mcpTools.push(toolsResult);
    } catch (error) {
      console.error(`Error loading tools from MCP client:`, error);
    }
  }

  // Merge all tools into a single object
  const allTools = { ...(tooling?.tools || {}) };
  mcpTools.forEach((toolSet) => {
    Object.assign(allTools, toolSet);
  });

  // Keep only the abort signal listener
  if (options.abortSignal) {
    options.abortSignal.addEventListener("abort", () => {
      console.log("[ai.ts] Abort signal triggered in getCustomBackendResponse");
    });
  }

  const response = streamText({
    model: languageModel.model,
    system: options.systemPrompt || (await defaultSystemMessage()),
    messages: messages,
    tools: allTools,
    toolChoice: tooling?.toolChoice,
    maxSteps: 20,
    providerOptions: languageModel.providerOptions,
    abortSignal: options.abortSignal,
    onError: (error) => {
      console.error("Error getting streamed text response", error);
      throw error;
    },
    onFinish: () => {
      mcpClients.forEach((client) => {
        try {
          client.close();
        } catch (error) {
          console.error("Error closing MCP client", error);
        }
      });
    },
  });

  return response.toDataStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
};
