import {
  extractReasoningMiddleware,
  LanguageModelV1,
  wrapLanguageModel,
} from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ProviderOptions } from "../types/ai-sdk-missing";

export type LanguageModelWithOptions = {
  model: LanguageModelV1;
  toolUse: boolean;
  providerOptions: ProviderOptions | undefined;
  languageModelOptions: Record<string, unknown>;
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
  let options = {};
  switch (activeProvider.providerId) {
    case "openai":
      provider = createOpenAI({
        apiKey: activeProvider.apiKey,
        compatibility: "strict",
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
      options = {
        // enabling google search (grounding) breaks other tool calls
        // it is enabled when tool calls are disabled
        useSearchGrounding: !activeModel.enableToolCalls,
        structuredOutputs: true,
      };
      break;
    case "openrouter":
      provider = createOpenAI({
        compatibility: "compatible",
        apiKey: activeProvider.apiKey,
        baseURL: activeProvider.url,
      });
      break;
    case "openai-compatible":
      provider = createOpenAI({
        name: activeProvider.name,
        baseURL: activeProvider.url,
        apiKey: activeProvider.apiKey,
        compatibility: "compatible",
      });
      break;
    default:
      throw new Error("Invalid provider from userSettings");
  }

  const model = provider.languageModel(
    providerSettings.active.modelId,
    options
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
    ...activeModel.providerOptions,
  };

  return {
    model: wrappedModel,
    toolUse: activeModel.enableToolCalls,
    providerOptions: providerOptions,
    languageModelOptions: options,
  };
};
