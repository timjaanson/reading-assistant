import { getStreamedTextResponse } from "../ai/ai";
import {
  AI_STREAM_CHUNK,
  AI_STREAM_END,
  AI_STREAM_ERROR,
  AI_STREAM_PORT_NAME,
  AiStreamEndPayload,
  AiStreamErrorPayload,
  GET_AI_STREAM,
  isAiStreamMessage,
} from "../types/ai-extension-messaging";

/**
 * Sets up the listener for AI stream requests via chrome.runtime.onConnect.
 */
export function setupAiStreamHandler() {
  chrome.runtime.onConnect.addListener((port) => {
    console.log("Connection established from:", port.sender);

    // Only handle connections named 'ai-stream'
    if (port.name !== AI_STREAM_PORT_NAME) {
      console.log("Ignoring connection with name:", port.name);
      return;
    }

    const handleMessage = async (request: unknown) => {
      if (!isAiStreamMessage(request) || request.type !== GET_AI_STREAM) {
        console.warn("Received invalid message format or type:", request);
        // Optionally disconnect if the first message isn't the expected type
        port.disconnect();
        return;
      }

      const { messages, systemPrompt } = request.payload;
      console.log("Background received GET_AI_STREAM", {
        messages,
        systemPrompt,
      });

      try {
        const stream = await getStreamedTextResponse(messages, {
          systemPrompt,
        });

        // Stream text chunks
        for await (const textChunk of stream.textStream) {
          port.postMessage({ type: AI_STREAM_CHUNK, payload: textChunk });
        }

        const finalResponse = await stream.response;
        const endPayload: AiStreamEndPayload = {
          messages: finalResponse.messages,
        };
        port.postMessage({ type: AI_STREAM_END, payload: endPayload });
        console.log("Background sent AI_STREAM_END");
      } catch (error) {
        console.error("Error streaming AI response in background:", error);
        let errorPayload: AiStreamErrorPayload;
        if (error instanceof Error) {
          errorPayload = { message: error.message, name: error.name };
        } else {
          errorPayload = "An unknown error occurred during streaming";
        }
        port.postMessage({
          type: AI_STREAM_ERROR,
          payload: errorPayload,
        });
      } finally {
        port.disconnect();
      }
    };

    port.onMessage.addListener(handleMessage);

    port.onDisconnect.addListener(() => {
      console.log("Port disconnected:", port.sender);
      // Remove the listener when the port disconnects to prevent memory leaks
      port.onMessage.removeListener(handleMessage);
    });
  });

  console.log("AI stream handler initialized.");
}
