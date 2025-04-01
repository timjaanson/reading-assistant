import { CoreMessage, generateText, LanguageModelV1, streamText } from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { defaultSystemMessage } from "./prompts";
import { createOllama } from "ollama-ai-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { AiTools, ToolDefinition } from "../types/ai-tools";
import { searchBrave } from "../search/brave-api";
import { tryCatch } from "../util/try-catch";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ProviderOptions } from "../types/ai-sdk-missing";
import { ExternalToolsStorage } from "../storage/externalToolSettings";
import { extractContentFromUrl, searchTavily } from "../search/tavily";
import { SearchOptions } from "../types/search";

export type GetTextResponseOptions = {
  systemPrompt?: string;
};

const getProviderSettings = async () => {
  const settings = await SettingsStorage.loadProviderSettings();
  return settings;
};

type LanguageModelWithOptions = {
  model: LanguageModelV1;
  toolUse: boolean;
  providerOptions: ProviderOptions | undefined;
  languageModelOptions: Record<string, unknown>;
};

const getLanguageModel = async (): Promise<LanguageModelWithOptions> => {
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
    case "google":
      provider = createGoogleGenerativeAI({
        apiKey: providerSettings.active.apiKey,
      });
      options = {
        useSearchGrounding: true,
      };
      break;
    default:
      throw new Error("Invalid provider from userSettings");
  }

  return {
    model: provider.languageModel(providerSettings.active.model, options),
    toolUse: providerSettings.active.enableToolCalls,
    providerOptions: providerSettings.active.providerOptions,
    languageModelOptions: options,
  };
};

export const getStreamedTextResponse = async (
  messages: CoreMessage[],
  options: GetTextResponseOptions = {}
) => {
  console.log("getStreamedTextResponse", messages);
  try {
    const languageModel = await getLanguageModel();
    const tooling = await getTooling(languageModel);

    const stream = streamText({
      model: languageModel.model,
      system: options.systemPrompt || defaultSystemMessage(),
      messages,
      tools: tooling?.tools,
      toolChoice: tooling?.toolChoice,
      maxSteps: 10,
      providerOptions: languageModel.providerOptions,
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

const getTooling = async (
  languageModel: LanguageModelWithOptions
): Promise<AiTools | undefined> => {
  if (!languageModel.toolUse) {
    return;
  }

  const externalToolSettings =
    await ExternalToolsStorage.loadExternalToolSettings();

  const tools: Record<string, ToolDefinition | {}> = {};

  if (!languageModel.languageModelOptions.useSearchGrounding) {
    tools["webSearch"] = {
      description:
        "Perform a web search for the given query. Returns an optional answer and a list of search results. Make sure to include the source (url) of the information in your response.",
      parameters: z.object({
        query: z
          .string()
          .describe(
            "The query string to search for. Include the search terms you want to find including the topic or type of source you are looking for."
          ),
        options: z.object({
          topic: z
            .enum(["general", "news", "finance"])
            .optional()
            .describe("The topic of the search. Default is general"),
          timeRange: z
            .enum(["year", "month", "week", "day"])
            .optional()
            .describe(
              "The time range back from the current date to filter results. Useful when looking for sources that have published data."
            ),
          days: z
            .number()
            .optional()
            .describe(
              "The number of days to search back for news. Only used if topic is news."
            ),
        }),
      }),
      execute: async (parameters: unknown) => {
        console.log("webSearch", parameters);
        const options = (parameters as { options: SearchOptions }).options;
        const query = (parameters as { query: string }).query;
        let result;
        switch (externalToolSettings.search.active?.id) {
          case "braveSearch":
            result = await tryCatch(searchBrave(query));
            break;
          case "tavily":
            result = await tryCatch(searchTavily(query, options));
            break;
          default:
            throw new Error(
              "No search provider available, select one in tool settings"
            );
        }

        if (result.error) {
          return {
            error: result.error.message,
          };
        }
        return result.data;
      },
    };
  }

  if (externalToolSettings.search.active?.id === "tavily") {
    tools["urlExtractor"] = {
      description:
        "Extract the content from up to 10 URLs at a time. Returns the content for each URL.",
      parameters: z.object({
        urls: z.array(z.string()).describe("The URLs to extract content from"),
      }),
      execute: async (parameters: unknown) => {
        const urls = (parameters as { urls: string[] }).urls;
        const content = await extractContentFromUrl(urls);
        return content;
      },
    };
  }

  if (Object.keys(tools).length > 0) {
    return {
      tools: tools as unknown as AiTools["tools"],
      toolChoice: "auto" as AiTools["toolChoice"],
    };
  }

  return;
};

export const getSyncTextResponse = async (
  messages: CoreMessage[],
  options: GetTextResponseOptions = {}
) => {
  const languageModel = await getLanguageModel();
  const response = await generateText({
    model: languageModel.model,
    system: options.systemPrompt || defaultSystemMessage(),
    messages,
  });
  return response;
};
