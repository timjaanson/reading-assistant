import { z } from "zod";
import { AiTools } from "../types/ai-tools";
import { searchBrave } from "../search/brave-api";
import { tryCatch } from "../util/try-catch";
import { ToolsSettingsStorage } from "../storage/toolSettings";
import { extractContentFromUrls, searchTavily } from "../search/tavily";
import { SearchOptions } from "../types/search";
import { memoryDb } from "../storage/memoryDatabase";
import { NewMemoryData } from "../types/memory";
import { LanguageModelWithOptions } from "./provider";
import { Tool } from "ai";
import { ToolName, ToolParameterFixResult } from "./toolType";

export const getTooling = async (
  languageModel: LanguageModelWithOptions
): Promise<AiTools | undefined> => {
  if (!languageModel.toolUse) {
    return;
  }

  const toolSettings = await ToolsSettingsStorage.loadToolSettings();

  //allow allowObjectTypes
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const tools: Record<string, Tool | {}> = {};

  if (
    !languageModel.internalCompatibilityOptions.useSearchGrounding &&
    toolSettings.search.active
  ) {
    tools[ToolName.WEB_SEARCH] = {
      description:
        "Perform a web search for the given query. Returns an optional answer and a list of search results.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "The query string to search for. Include the search terms you want to find including the topic or type of source you are looking for."
          ),
        options: z
          .object({
            timeRange: z
              .enum(["year", "month", "week", "day", "all"])
              .describe(
                "The time range back from the current date to filter results. Useful when looking for sources that have published data. Default is all."
              ),
            include_domains: z
              .array(z.string())
              .describe(
                "Include only sources from these domains. Default is empty array []"
              ),
            exclude_domains: z
              .array(z.string())
              .describe(
                "Exclude sources from these domains. Default is empty array []"
              ),
          })
          .describe(
            "Additional options for the search. options object MUST include timeRange, include_domains, exclude_domains fields!"
          ),
      }),
      execute: async (parameters: unknown) => {
        console.debug("webSearch", parameters);
        const options = (parameters as { options: SearchOptions }).options;
        const query = (parameters as { query: string }).query;
        let result;
        switch (toolSettings.search.active?.id) {
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
        console.debug(
          "webSearch result success",
          result.data ? "success" : "error",
          result.error
        );
        if (result.error) {
          return {
            error: result.error.message,
          };
        }
        return result.data;
      },
    };
  }

  if (toolSettings.search.active?.id === "tavily") {
    tools[ToolName.EXTRACT_URLS_CONTENT] = {
      description:
        "Extract the content from up to 10 URLs at a time. Returns the text and image content for each URL without html tags.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("The URLs to extract content from"),
      }),
      execute: async (parameters: unknown) => {
        console.debug("urlExtractor", parameters);
        const urls = (parameters as { urls: string[] }).urls;
        const result = await tryCatch(extractContentFromUrls(urls));
        console.debug(
          "urlExtractor result success",
          result.data ? "success" : "error",
          result.error
        );
        if (result.error) {
          return {
            error: result.error.message,
          };
        }

        return result.data;
      },
    };
  }

  if (toolSettings.extractActiveTab.active) {
    tools[ToolName.EXTRACT_ACTIVE_TAB_CONTENT] = {
      description:
        "Extract the content of the user's currently active browser tab. Returns the text content of the tab.",
      inputSchema: z.object({}),
    };
  }

  if (toolSettings.memoryManagement.active) {
    const memoryTools = createMemoryTools();
    Object.assign(tools, memoryTools);
  }

  if (Object.keys(tools).length > 0) {
    return {
      tools: tools as unknown as AiTools["tools"],
      toolChoice: "auto" as AiTools["toolChoice"],
    };
  }

  return;
};

const createMemoryTools = (): Record<string, Tool> => {
  const tools: Record<string, Tool> = {};

  tools["addMemory"] = {
    description:
      "Use only if the user asks you to remember something. Add a new memory to the user's memory list. Returns the ID of the new memory if successful.",
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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

export const toolParameterFix = (
  toolName: ToolName,
  incorrectParameters: Record<string, unknown>
): ToolParameterFixResult => {
  switch (toolName) {
    case ToolName.WEB_SEARCH:
      // Look for query at root level
      let query: string | undefined;

      if (
        incorrectParameters.query &&
        typeof incorrectParameters.query === "string"
      ) {
        query = incorrectParameters.query;
      } else if (
        incorrectParameters.options &&
        typeof incorrectParameters.options === "object" &&
        incorrectParameters.options !== null
      ) {
        // Look for query under options key
        const options = incorrectParameters.options as Record<string, unknown>;
        if (options.query && typeof options.query === "string") {
          query = options.query;
        }
      }

      if (query) {
        // Extract and validate options
        const validTimeRanges = ["year", "month", "week", "day", "all"];
        let timeRange = "all";
        let include_domains: string[] = [];
        let exclude_domains: string[] = [];

        // Check for options at root level or under options key
        const optionsSource =
          incorrectParameters.options || incorrectParameters;

        if (typeof optionsSource === "object" && optionsSource !== null) {
          const opts = optionsSource as Record<string, unknown>;

          // Validate and set timeRange
          if (typeof opts.timeRange === "string") {
            const candidateTimeRange = opts.timeRange.toLowerCase();
            if (validTimeRanges.includes(candidateTimeRange)) {
              timeRange = candidateTimeRange;
            } else {
              // Infer from substring match using a priority-ordered list
              const inferredTimeRange = validTimeRanges.find((value) =>
                candidateTimeRange.includes(value)
              );
              if (inferredTimeRange) {
                timeRange = inferredTimeRange as typeof timeRange;
              }
            }
          }

          // Validate and set include_domains
          if (Array.isArray(opts.include_domains)) {
            include_domains = opts.include_domains.filter(
              (item) => typeof item === "string"
            );
          }

          // Validate and set exclude_domains
          if (Array.isArray(opts.exclude_domains)) {
            exclude_domains = opts.exclude_domains.filter(
              (item) => typeof item === "string"
            );
          }
        }

        return {
          fixed: true,
          fixedParameters: {
            query,
            options: {
              timeRange,
              include_domains,
              exclude_domains,
            },
          },
        };
      }

      return {
        fixed: false,
      };
    case ToolName.EXTRACT_URLS_CONTENT:
      // Case 1: Direct array (not wrapped in object)
      if (Array.isArray(incorrectParameters)) {
        const urls = incorrectParameters.filter(
          (item) => typeof item === "string"
        );
        if (urls.length > 0) {
          return {
            fixed: true,
            fixedParameters: {
              urls,
            },
          };
        }
      }

      // Case 2: Object with urls field but wrong type
      if (incorrectParameters.urls) {
        if (typeof incorrectParameters.urls === "string") {
          return {
            fixed: true,
            fixedParameters: {
              urls: [incorrectParameters.urls],
            },
          };
        }
        if (Array.isArray(incorrectParameters.urls)) {
          const urls = incorrectParameters.urls.filter(
            (item) => typeof item === "string"
          );
          if (urls.length > 0) {
            return {
              fixed: true,
              fixedParameters: {
                urls,
              },
            };
          }
        }
      }

      // Case 3: Object with single field of different name
      const keys = Object.keys(incorrectParameters);
      if (keys.length === 1) {
        const key = keys[0];
        const value = incorrectParameters[key];

        if (typeof value === "string") {
          return {
            fixed: true,
            fixedParameters: {
              urls: [value],
            },
          };
        }

        if (Array.isArray(value)) {
          const urls = value.filter((item) => typeof item === "string");
          if (urls.length > 0) {
            return {
              fixed: true,
              fixedParameters: {
                urls,
              },
            };
          }
        }
      }

      return {
        fixed: false,
      };
    case ToolName.EXTRACT_ACTIVE_TAB_CONTENT:
      return {
        fixed: true,
        fixedParameters: {},
      };
    default:
      return {
        fixed: false,
      };
  }
};
