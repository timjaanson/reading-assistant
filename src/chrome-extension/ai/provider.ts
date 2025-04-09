import { LanguageModelV1 } from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";
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
  let provider;
  let options = {};
  switch (providerSettings.active.provider) {
    case "openai":
      provider = createOpenAI({
        apiKey: providerSettings.active.apiKey,
        compatibility: "strict",
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
        // enabling google search (grounding) breaks other tool calls
        //useSearchGrounding: true,
        structuredOutputs: true,
      };
      break;
    case "custom-provider-openai":
      provider = createOpenAI({
        name: providerSettings.active.name,
        baseURL: providerSettings.active.url,
        apiKey: providerSettings.active.apiKey,
        compatibility: "compatible",
      });
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
