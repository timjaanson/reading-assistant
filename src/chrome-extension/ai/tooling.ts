import { z } from "zod";
import { AiTools, ToolDefinition } from "../types/ai-tools";
import { searchBrave } from "../search/brave-api";
import { tryCatch } from "../util/try-catch";
import { ExternalToolsStorage } from "../storage/externalToolSettings";
import { extractContentFromUrls, searchTavily } from "../search/tavily";
import { SearchOptions } from "../types/search";
import { memoryDb } from "../storage/memoryDatabase";
import { NewMemoryData } from "../types/memory";
import { LanguageModelWithOptions } from "./provider";

export const getTooling = async (
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
        options: z
          .object({
            timeRange: z
              .enum(["year", "month", "week", "day"])
              .optional()
              .describe(
                "The time range back from the current date to filter results. Useful when looking for sources that have published data."
              ),
            include_domains: z
              .array(z.string())
              .optional()
              .describe("Include only sources from these domains"),
            exclude_domains: z
              .array(z.string())
              .optional()
              .describe("Exclude sources from these domains"),
          })
          .optional(),
      }),
      execute: async (parameters: unknown) => {
        console.log("webSearch", parameters);
        const options = (parameters as { options?: SearchOptions }).options;
        const query = (parameters as { query: string }).query;
        let result;
        switch (externalToolSettings.search.active?.id) {
          case "braveSearch":
            result = await tryCatch(searchBrave(query));
            break;
          case "tavily":
            result = await tryCatch(searchTavily(query, options ?? {}));
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
        const result = await tryCatch(extractContentFromUrls(urls));

        if (result.error) {
          return {
            error: result.error.message,
          };
        }

        return result.data;
      },
    };
  }

  const memoryTools = createMemoryTools();
  Object.assign(tools, memoryTools);

  if (Object.keys(tools).length > 0) {
    return {
      tools: tools as unknown as AiTools["tools"],
      toolChoice: "auto" as AiTools["toolChoice"],
    };
  }

  return;
};

const createMemoryTools = (): Record<string, ToolDefinition> => {
  const tools: Record<string, ToolDefinition> = {};

  tools["addMemory"] = {
    description:
      "Use only if the user asks you to remember something. Add a new memory to the user's memory list. Returns the ID of the new memory if successful.",
    parameters: z.object({
      content: z.string().describe("The content of the memory."),
    }),
    execute: async (parameters: unknown) => {
      const fields = parameters as NewMemoryData;
      const result = await tryCatch(memoryDb.addMemory(fields));
      if (result.error) {
        return {
          error: result.error.message,
        };
      }
      return result.data;
    },
  };

  tools["getMemoryById"] = {
    description:
      "Get a memory by memory ID from the user's memory list. Returns the memory if found.",
    parameters: z.object({
      id: z.number().describe("The ID of the memory to get"),
    }),
    execute: async (parameters: unknown) => {
      const id = (parameters as { id: number }).id;
      const result = await tryCatch(memoryDb.getMemoryById(id));
      if (result.error) {
        return {
          error: result.error.message,
        };
      }
      return result.data ?? { error: `Memory with ID ${id} not found` };
    },
  };

  tools["updateMemory"] = {
    description:
      "Update a memory by memory ID from the user's memory list. Returns true if update was successful.",
    parameters: z.object({
      id: z.number().describe("The ID of the memory to update"),
      content: z.string().describe("The new content for the memory"),
    }),
    execute: async (parameters: unknown) => {
      const id = (parameters as { id: number }).id;
      const fields = parameters as NewMemoryData;
      const result = await tryCatch(memoryDb.updateMemory(id, fields));
      if (result.error) {
        return {
          error: result.error.message,
        };
      }
      return { success: true };
    },
  };

  tools["removeMemory"] = {
    description:
      "Remove/de-activate a memory by memory ID from the user's memory list. Returns true if de-activation was successful.",
    parameters: z.object({
      id: z.number().describe("The ID of the memory to remove"),
    }),
    execute: async (parameters: unknown) => {
      const id = (parameters as { id: number }).id;
      const result = await tryCatch(
        memoryDb.updateMemory(id, { active: false })
      );
      if (result.error) {
        return {
          error: result.error.message,
        };
      }
      return { success: true };
    },
  };

  return tools;
};
