import {
  extractReasoningMiddleware,
  LanguageModel,
  wrapLanguageModel,
} from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ModelOptions } from "../types/settings";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type LanguageModelWithOptions = {
  model: LanguageModel;
  toolUse: boolean;
  modelOptions: ModelOptions;
  internalCompatibilityOptions: Record<string, unknown>;
};

const getProviderSettings = async () => {
  const settings = await SettingsStorage.loadProviderSettings();
  return settings;
};

export const getLanguageModel = async (): Promise<LanguageModelWithOptions> => {
  const providerSettings = await getProviderSettings();
  if (!providerSettings.active) {
    throw new Error("No active provider settings found");
  }
  const activeProvider = await SettingsStorage.findProviderById(
    providerSettings.active.providerId
  );
  if (!activeProvider) {
    throw new Error("No active provider found");
  }
  const activeModel = await SettingsStorage.findModelByProviderIdAndModelId(
    activeProvider.providerId,
    providerSettings.active.modelId
  );
  if (!activeModel) {
    throw new Error("No active model found");
  }

  let provider;
  let compatibilityOptions = {};
  switch (activeProvider.providerId) {
    case "openai":
      provider = createOpenAI({
        apiKey: activeProvider.apiKey,
      });
      break;
    case "anthropic":
      provider = createAnthropic({
        apiKey: activeProvider.apiKey,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      break;
    case "google":
      provider = createGoogleGenerativeAI({
        apiKey: activeProvider.apiKey,
      });
      compatibilityOptions = {
        // enabling google search (grounding) breaks other tool calls
        // it is enabled when tool calls are disabled
        useSearchGrounding: !activeModel.enableToolCalls,
        structuredOutputs: true,
      };
      break;
    case "openrouter":
      provider = createOpenAICompatible({
        name: activeProvider.providerId,
        apiKey: activeProvider.apiKey,
        baseURL: activeProvider.url!,
        includeUsage: true,
      });
      break;
    case "openai-compatible":
      provider = createOpenAICompatible({
        name: activeProvider.providerId,
        baseURL: activeProvider.url!,
        apiKey: activeProvider.apiKey,
        includeUsage: true,
      });
      break;
    default:
      throw new Error("Invalid provider from userSettings");
  }

  const model = provider.languageModel(
    providerSettings.active.modelId

    //TODO: fix google weirdness
    //compatibilityOptions
  );
  let wrappedModel = model;

  if (
    ["openai-compatible", "openrouter"].includes(
      providerSettings.active.providerId
    )
  ) {
    wrappedModel = wrapLanguageModel({
      model: model,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    });
  }

  const providerOptions = {
    ...activeProvider.providerOptions,
    ...activeModel.options.providerOptions,
  };

  const modelOptions = {
    ...activeModel.options,
    providerOptions: providerOptions,
  };

  return {
    model: wrappedModel,
    toolUse: activeModel.enableToolCalls,
    modelOptions: modelOptions,
    internalCompatibilityOptions: compatibilityOptions,
  };
};
