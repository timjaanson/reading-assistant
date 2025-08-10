import {
  generateObject,
  NoSuchToolError,
  Schema,
  smoothStream,
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { defaultSystemMessage } from "./prompts";
import { getLanguageModel } from "./provider";
import { getTooling, toolParameterFix } from "./tooling";
import { getActiveMCPClients } from "./mcp-clients";
import { chatDb } from "../storage/chatDatabase";
import { ToolName } from "./toolType";

export type GetTextResponseOptions = {
  chatId: string;
  systemPrompt?: string;
  abortSignal?: AbortSignal;
};

export const getCustomBackendResponse = async (
  messages: UIMessage[],
  options: GetTextResponseOptions
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
      maxOutputTokens: languageModel.modelOptions.maxOutputTokens,
      providerOptions: languageModel.modelOptions.providerOptions,
      frequencyPenalty: languageModel.modelOptions.frequencyPenalty,
      presencePenalty: languageModel.modelOptions.presencePenalty,
      maxRetries: 3,
      system: prompt,
      messages: convertToModelMessages(messages),
      tools: allTools,
      toolChoice: tooling?.toolChoice,
      abortSignal: options.abortSignal,
      experimental_transform: smoothStream({
        chunking: "word",
        delayInMs: 10,
      }),
      experimental_repairToolCall: async ({
        toolCall,
        tools,
        inputSchema,
        error,
      }) => {
        console.warn(
          `Tool call ${toolCall.toolName} failed`,
          JSON.stringify(error)
        );
        if (NoSuchToolError.isInstance(error)) {
          console.error(`Unknown tool ${toolCall.toolName} called`);
          return null; // do not attempt to fix invalid tool names
        }

        const tool = tools[toolCall.toolName as keyof typeof tools];

        const toolParameterFixResult = toolParameterFix(
          toolCall.toolName as ToolName,
          JSON.parse(toolCall.input)
        );

        if (toolParameterFixResult.fixed) {
          console.warn(
            `Fixed tool call args programmatically for ${toolCall.toolName}`,
            JSON.stringify(toolParameterFixResult.fixedParameters)
          );
          return {
            ...toolCall,
            input: JSON.stringify(toolParameterFixResult.fixedParameters),
          };
        }

        const { object: repairedArgs } = await generateObject({
          model: languageModel.model,
          ...languageModel.modelOptions,
          abortSignal: options.abortSignal,
          schema: tool.inputSchema as Schema,
          prompt: [
            `The model tried to call the tool "${toolCall.toolName}"` +
              ` with the following arguments:`,
            toolCall.input,
            `The tool accepts the following schema:`,
            JSON.stringify(inputSchema(toolCall)),
            "Please fix the arguments.",
          ].join("\n"),
        });

        console.warn(
          `Result of fixed tool call args for ${toolCall.toolName}`,
          JSON.stringify(repairedArgs)
        );

        return { ...toolCall, args: JSON.stringify(repairedArgs) };
      },
      onError: (error) => {
        console.error("Error getting streamed text response", error);
      },
      onFinish: (event) => {
        console.log(
          "Token usage total:",
          JSON.stringify(event.totalUsage, null, 2)
        );
      },
    });
  } catch (error) {
    console.error("Error getting streamed text response", error);
    throw error;
  }

  return response.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
    originalMessages: messages,
    generateMessageId: () => crypto.randomUUID(),
    onFinish: async ({ messages: allMessages }) => {
      console.debug("onFinish");
      mcpClients.forEach((client) => {
        try {
          client.close();
        } catch (error) {
          console.warn("Error closing MCP client", error);
        }
      });

      try {
        const chat = await chatDb.getChat(options.chatId);
        const chatName = chat?.name || "New Chat";
        await chatDb.saveChat({
          id: options.chatId,
          name: chatName,
          url: chat?.url || "",
          messages: allMessages as UIMessage[],
        });
        console.debug("Chat saved in onFinish", options.chatId);
      } catch (error) {
        console.error("Error saving chat in onFinish", error);
      }
    },
  });
};
