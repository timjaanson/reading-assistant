import { CoreMessage, generateText, streamText } from "ai";
import { defaultSystemMessage } from "./prompts";
import { getLanguageModel } from "./provider";
import { getTooling } from "./tooling";

export type GetTextResponseOptions = {
  systemPrompt?: string;
};

export const getStreamedTextResponse = async (
  messages: CoreMessage[],
  options: GetTextResponseOptions = {}
) => {
  try {
    const languageModel = await getLanguageModel();
    const tooling = await getTooling(languageModel);

    const stream = streamText({
      model: languageModel.model,
      system: options.systemPrompt || (await defaultSystemMessage()),
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

export const getSyncTextResponse = async (
  messages: CoreMessage[],
  options: GetTextResponseOptions = {}
) => {
  const languageModel = await getLanguageModel();
  const response = await generateText({
    model: languageModel.model,
    system: options.systemPrompt || (await defaultSystemMessage()),
    messages,
  });
  return response;
};
