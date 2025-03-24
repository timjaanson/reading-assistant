import { CoreMessage, generateText, streamText } from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { defaultSystemMessage } from "./prompts";
import { createOllama } from "ollama-ai-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { AiTools } from "../types/ai-tools";
import { searchBrave } from "../search/brave-api";
import { tryCatch } from "../util/try-catch";

export type GetStreamedTextResponseOptions = {
  systemPrompt?: string;
};

const getProviderSettings = async () => {
  const settings = await SettingsStorage.loadProviderSettings();
  return settings;
};

const getLanguageModel = async () => {
  const providerSettings = await getProviderSettings();
  if (!providerSettings.active) {
    throw new Error("No active provider settings found");
  }
  let provider;
  let options = {};
  switch (providerSettings.active.provider) {
    case "openai":
      provider = createOpenAI({
        apiKey: providerSettings.active.apiKey,
      });
      break;
    case "ollama":
      provider = createOllama({
        baseURL: providerSettings.active.url,
      });
      options = {
        // Ollama does not support native streaming tool calls, so enable simulated streaming if tool calls are enabled
        simulateStreaming: providerSettings.active.enableToolCalls,
      };
      break;
    case "anthropic":
      provider = createAnthropic({
        apiKey: providerSettings.active.apiKey,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      break;
    default:
      throw new Error("Invalid provider from userSettings");
  }

  return {
    model: provider.languageModel(providerSettings.active.model, options),
    toolUse: providerSettings.active.enableToolCalls,
    providerOptions: providerSettings.active.providerOptions,
  };
};

export const getStreamedTextResponse = async (
  messages: CoreMessage[],
  options: GetStreamedTextResponseOptions = {}
) => {
  console.log("getStreamedTextResponse", messages);
  try {
    const languageModel = await getLanguageModel();

    const stream = streamText({
      model: languageModel.model,
      system: options.systemPrompt || defaultSystemMessage(),
      messages,
      tools: languageModel.toolUse ? getTools().tools : undefined,
      maxSteps: 10,
      providerOptions: languageModel.providerOptions,
    });

    return stream;
  } catch (error) {
    console.error("Error getting streamed text response", error);
    throw error;
  }
};

const getTools = () => {
  const tools: AiTools = {
    tools: {
      webSearch: {
        description:
          "Perform a web search for the given query. Returns a list of search results. Make sure to include the source (url) of the information in your response.",
        parameters: z.object({
          query: z.string().describe("The query string to search for"),
        }),
        execute: async (parameters: unknown) => {
          console.log("webSearch", parameters);
          const query = (parameters as { query: string }).query;
          const result = await tryCatch(searchBrave(query));
          if (result.error) {
            return {
              error: result.error.message,
            };
          }
          return result.data;
        },
      },
    },
    toolChoice: "auto",
  };
  return tools;
};

export const getSyncTextResponse = async (messages: CoreMessage[]) => {
  const languageModel = await getLanguageModel();
  const response = await generateText({
    model: languageModel.model,
    system: defaultSystemMessage(),
    messages,
  });
  return response;
};
