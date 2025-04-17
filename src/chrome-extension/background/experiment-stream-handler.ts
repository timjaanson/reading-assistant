import { getCustomBackendResponse } from "../ai/ai";

// Port name for experiment stream connection
export const EXPERIMENTAL_STREAM_PORT_NAME =
  "experimental-http-response-stream";

// Message types
export const GET_EXPERIMENT_STREAM = "GET_STREAM";
export const EXPERIMENT_STREAM_CHUNK = "STREAM_CHUNK";
export const EXPERIMENT_STREAM_METADATA = "STREAM_METADATA";
export const EXPERIMENT_STREAM_COMPLETE = "STREAM_COMPLETE";
export const EXPERIMENT_STREAM_ERROR = "STREAM_ERROR";

interface ExperimentalStreamRequest {
  type: typeof GET_EXPERIMENT_STREAM;
  payload: {
    messages: any[];
    systemPrompt?: string;
  };
}

/**
 * Sets up a handler for the experiment stream that processes getCustomBackendResponse
 * and streams the Response to the client
 */
export function setupExperimentStreamHandler() {
  chrome.runtime.onConnect.addListener((port) => {
    console.log("Connection received:", port.name);

    // Only handle connections for our experiment stream
    if (port.name !== EXPERIMENTAL_STREAM_PORT_NAME) {
      return;
    }

    port.onMessage.addListener(async (message) => {
      // Type guard for the experiment stream message
      if (!isExperimentalStreamRequest(message)) {
        console.warn("Received invalid message format:", message);
        port.postMessage({
          type: EXPERIMENT_STREAM_ERROR,
          payload: { message: "Invalid message format" },
        });
        return;
      }

      const { messages, systemPrompt } = message.payload;
      console.log(
        "Background received stream request with messages:",
        messages.length
      );

      let reader: ReadableStreamDefaultReader<Uint8Array> | null | undefined =
        null;

      try {
        // Get the Response from getCustomBackendResponse
        const response = await getCustomBackendResponse(messages, {
          systemPrompt,
        });

        // Send response metadata immediately
        port.postMessage({
          type: EXPERIMENT_STREAM_METADATA,
          payload: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          },
        });

        // Get a reader from the response body
        reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Could not get reader from response");
        }

        // Stream chunks to the client immediately as they arrive
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            // Convert the Uint8Array to a Base64 string for transmission
            const base64Chunk = arrayBufferToBase64(result.value.buffer);
            port.postMessage({
              type: EXPERIMENT_STREAM_CHUNK,
              payload: base64Chunk,
            });
          }
        }

        // Signal successful completion after the loop
        port.postMessage({ type: EXPERIMENT_STREAM_COMPLETE });
        console.log("Background finished streaming response");
      } catch (error) {
        console.error("Error in experiment stream handler:", error);
        port.postMessage({
          type: EXPERIMENT_STREAM_ERROR,
          payload:
            error instanceof Error
              ? { message: error.message }
              : { message: "Unknown error" },
        });
      }
    });

    port.onDisconnect.addListener(() => {
      console.log("Experiment stream port disconnected");
      if (chrome.runtime.lastError) {
        console.error("Disconnection error:", chrome.runtime.lastError.message);
      }
    });
  });

  console.log("Experiment stream handler initialized");
}

function isExperimentalStreamRequest(
  message: any
): message is ExperimentalStreamRequest {
  return (
    message &&
    typeof message === "object" &&
    message.type === GET_EXPERIMENT_STREAM &&
    message.payload &&
    Array.isArray(message.payload.messages)
  );
}

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
