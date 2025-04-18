import { ExternalToolsStorage } from "../storage/externalToolSettings";
import {
  tavily,
  TavilyExtractOptions,
  TavilySearchOptions,
} from "@tavily/core";
import { ExternalToolSettings } from "../types/settings";
import { SearchOptions } from "../types/search";

const doSearch = async (query: string, options: SearchOptions) => {
  const externalToolSettings =
    await ExternalToolsStorage.loadExternalToolSettings();
  const apiKey = externalToolSettings.search.active?.apiKey;

  if (!apiKey) {
    throw new Error("Tavily enabled but API key not set");
  }

  const tvly = tavily({ apiKey: apiKey });

  const tavilyOptions = {
    ...options,
  } satisfies TavilySearchOptions;

  const response = await tvly.search(query, tavilyOptions);
  const results = {
    answer: response.answer,
    results: response.results,
  };
  return results;
};

export const searchTavily = async (query: string, options: SearchOptions) => {
  const externalToolSettings =
    await ExternalToolsStorage.loadExternalToolSettings();
  if (externalToolSettings.search.active?.id === "tavily") {
    if (externalToolSettings.search.active.apiKey) {
      const optionsWithDefaults = {
        topic: "general",
        includeAnswer: true,
        searchDepth: "advanced",
        resultCount: 8,
        timeRange: options.timeRange ? options.timeRange : undefined,
        include_domains: options.include_domains,
        exclude_domains: options.exclude_domains,
      } satisfies SearchOptions;
      return doSearch(query, optionsWithDefaults);
    }
    throw new Error("Tavily enabled but API key not set");
  }
  throw new Error("Tavily is not enabled");
};

export const extractContentFromUrls = async (urls: string[]) => {
  if (urls.length === 0) {
    return [];
  } else if (urls.length > 10) {
    throw new Error("Cannot extract content from more than 10 URLs");
  }

  const externalToolSettings =
    await ExternalToolsStorage.loadExternalToolSettings();
  await validateActiveAndApiKey(externalToolSettings);

  const apiKey = externalToolSettings.search.active?.apiKey;
  const tvly = tavily({ apiKey: apiKey });
  const options = {
    extractDepth: "advanced",
    includeImages: true,
  } satisfies TavilyExtractOptions;
  const response = await tvly.extract(urls, options);
  return response;
};

const validateActiveAndApiKey = async (settings: ExternalToolSettings) => {
  if (settings.search.active?.id !== "tavily") {
    throw new Error("Tavily is not enabled");
  }

  const apiKey = settings.search.active?.apiKey;
  if (!apiKey) {
    throw new Error("Tavily enabled but API key not set");
  }
};
