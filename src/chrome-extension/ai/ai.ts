import { CoreMessage, generateText, streamText } from "ai";
import { SettingsStorage } from "../storage/settings";
import { createOpenAI } from "@ai-sdk/openai";
import { getLocalDateTimeWithWeekday } from "../util/datetime";

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

const defaultSystemMessage = `## Your role
You are currently in a Chrome extension that is for assisted reading.
The user can ask to summarize text, explain it or something else.
The user may also ask other unrelated questions that you should answer.

## Response format
You should respond in markdown format.

## Context about the user
The user's current time is ${getLocalDateTimeWithWeekday()}.
`;

export const getStreamedTextResponse = async (messages: CoreMessage[]) => {
  console.log("getStreamedTextResponse", messages);
  try {
    const languageModel = await getLanguageModel();
    const stream = streamText({
      model: languageModel,
      system: defaultSystemMessage,
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
    system: defaultSystemMessage,
    messages,
  });
  return response;
};
