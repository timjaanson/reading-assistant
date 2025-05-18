import { streamText } from "ai";
import { defaultSystemMessage } from "./prompts";
import { getLanguageModel } from "./provider";
import { getTooling } from "./tooling";
import { getActiveMCPClients } from "./mcp-clients";

export type GetTextResponseOptions = {
  systemPrompt?: string;
  abortSignal?: AbortSignal;
};

// Updated to accept any message format
export const getCustomBackendResponse = async (
  messages: any[],
  options: GetTextResponseOptions = {}
) => {
  const languageModel = await getLanguageModel();
  const tooling = await getTooling(languageModel);
  const mcpClients = await getActiveMCPClients(languageModel);

  const mcpTools = [];
  for (const client of mcpClients) {
    try {
      const toolsResult = await client.tools();
      mcpTools.push(toolsResult);
    } catch (error) {
      console.error("Error loading tools from MCP client", error);
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

  let response;
  try {
    const prompt = options.systemPrompt || (await defaultSystemMessage());
    response = streamText({
      model: languageModel.model,
      temperature: languageModel.modelOptions.temperature,
      topK: languageModel.modelOptions.topK,
      topP: languageModel.modelOptions.topP,
      maxTokens: languageModel.modelOptions.maxTokens,
      providerOptions: languageModel.modelOptions.providerOptions,
      frequencyPenalty: languageModel.modelOptions.frequencyPenalty,
      presencePenalty: languageModel.modelOptions.presencePenalty,
      maxRetries: 3,
      system: prompt,
      messages: messages,
      tools: allTools,
      toolChoice: tooling?.toolChoice,
      maxSteps: 20,
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
            console.warn("Error closing MCP client", error);
          }
        });
      },
    });
  } catch (error) {
    console.error("Error getting streamed text response", error);
    throw error;
  }

  return response.toDataStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
};
