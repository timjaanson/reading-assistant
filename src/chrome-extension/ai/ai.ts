import { APICallError, generateText, streamText, UIMessage } from "ai";
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
  messages: UIMessage[],
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
  let errorMessage = "";
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
      experimental_repairToolCall: async ({
        toolCall,
        tools,
        error,
        messages,
        system,
      }) => {
        console.warn(
          "Tool call failed, trying to repair via new LLM call",
          error.message
        );
        const toolToRepair = tools[toolCall.toolName];
        const result = await generateText({
          tools: toolToRepair ? { [toolCall.toolName]: toolToRepair } : tools,
          toolChoice: "required",
          model: languageModel.model,
          system,
          temperature: languageModel.modelOptions.temperature,
          topK: languageModel.modelOptions.topK,
          topP: languageModel.modelOptions.topP,
          maxTokens: languageModel.modelOptions.maxTokens,
          providerOptions: languageModel.modelOptions.providerOptions,
          frequencyPenalty: languageModel.modelOptions.frequencyPenalty,
          presencePenalty: languageModel.modelOptions.presencePenalty,
          maxRetries: 3,
          maxSteps: 1,
          abortSignal: options.abortSignal,
          messages: [
            ...messages,
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  args: toolCall.args,
                },
              ],
            },
            {
              role: "tool" as const,
              content: [
                {
                  type: "tool-result",
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  result: error.message,
                },
              ],
            },
          ],
        });

        const newToolCall = result.toolCalls.find(
          (newToolCall) => newToolCall.toolName === toolCall.toolName
        );

        return newToolCall != null
          ? {
              toolCallType: "function" as const,
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: JSON.stringify(newToolCall.args),
            }
          : null;
      },
      onError: (error) => {
        console.error("Error getting streamed text response", error);
        if ("error" in error && APICallError.isInstance(error.error)) {
          errorMessage = JSON.stringify({
            url: error.error.url,
            statusCode: error.error.statusCode,
            responseHeaders: error.error.responseHeaders,
            errorData: error.error.data,
          });
        } else {
          errorMessage =
            error instanceof Error ? error.message : JSON.stringify(error);
        }
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
    sendUsage: true,
    getErrorMessage: (error) => {
      console.error("Error getting streamed text response", error);
      return errorMessage;
    },
    sendSources: true,
  });
};
