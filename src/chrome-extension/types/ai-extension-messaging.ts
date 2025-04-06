import { CoreMessage } from "ai";

export const AI_STREAM_PORT_NAME = "ai-stream";

export const GET_AI_STREAM = "GET_AI_STREAM";
export const AI_STREAM_CHUNK = "AI_STREAM_CHUNK";
export const AI_STREAM_END = "AI_STREAM_END";
export const AI_STREAM_ERROR = "AI_STREAM_ERROR";

export type GetAiStreamPayload = {
  messages: CoreMessage[];
  systemPrompt?: string;
};

export type AiStreamChunkPayload = string;

export type AiStreamEndPayload = {
  messages: CoreMessage[];
};

export type AiStreamErrorPayload =
  | string
  | { message: string; [key: string]: any };

export type AiStreamMessage =
  | { type: typeof GET_AI_STREAM; payload: GetAiStreamPayload }
  | { type: typeof AI_STREAM_CHUNK; payload: AiStreamChunkPayload }
  | { type: typeof AI_STREAM_END; payload: AiStreamEndPayload }
  | { type: typeof AI_STREAM_ERROR; payload: AiStreamErrorPayload };

export function isAiStreamMessage(message: any): message is AiStreamMessage {
  if (
    !message ||
    typeof message !== "object" ||
    typeof message.type !== "string"
  ) {
    return false;
  }

  switch (message.type) {
    case GET_AI_STREAM:
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        Array.isArray(message.payload.messages)
      );
    case AI_STREAM_CHUNK:
      return typeof message.payload === "string";
    case AI_STREAM_END:
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        Array.isArray(message.payload.messages)
      );
    case AI_STREAM_ERROR:
      // Payload can be a string or an object with a message property
      return (
        typeof message.payload === "string" ||
        (typeof message.payload === "object" &&
          message.payload !== null &&
          typeof message.payload.message === "string")
      );
    default:
      return false;
  }
}
