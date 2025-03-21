import { CoreMessage, generateText, streamText } from "ai";
import { SettingsStorage } from "../storage/providerSettings";
import { createOpenAI } from "@ai-sdk/openai";
import { defaultSystemMessage } from "./prompts";
import { createOllama } from "ollama-ai-provider";
import { createAnthropic } from "@ai-sdk/anthropic";

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

  return provider.languageModel(providerSettings.active.model);
};

export const getStreamedTextResponse = async (
  messages: CoreMessage[],
  options: GetStreamedTextResponseOptions = {}
) => {
  console.log("getStreamedTextResponse", messages);
  try {
    const languageModel = await getLanguageModel();
    const stream = streamText({
      model: languageModel,
      system: options.systemPrompt || defaultSystemMessage(),
      messages,
    });

    return stream;
  } catch (error) {
    console.error("Error getting streamed text response", error);
    throw error;
  }
};

export const getSyncTextResponse = async (messages: CoreMessage[]) => {
  const languageModel = await getLanguageModel();
  const response = await generateText({
    model: languageModel,
    system: defaultSystemMessage(),
    messages,
  });
  return response;
};
