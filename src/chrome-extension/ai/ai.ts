import { CoreMessage, generateText, streamText } from "ai";
import { SettingsStorage } from "../storage/settings";
import { createOpenAI } from "@ai-sdk/openai";
import { defaultSystemMessage } from "./prompts";

export type GetStreamedTextResponseOptions = {
  systemPrompt?: string;
};

const getSettings = async () => {
  const settings = await SettingsStorage.loadSettings();
  return settings;
};

const getLanguageModel = async () => {
  const userSettings = await getSettings();
  const provider = createOpenAI({
    apiKey: userSettings.settings.apiKey,
  });
  return provider.languageModel(userSettings.settings.model);
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
