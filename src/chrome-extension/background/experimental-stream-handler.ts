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
export const ABORT_STREAM = "ABORT_STREAM";
export const KEEPALIVE_PING = "KEEPALIVE_PING";
export const KEEPALIVE_PONG = "KEEPALIVE_PONG";

interface ExperimentalStreamRequest {
  type: typeof GET_EXPERIMENT_STREAM;
  payload: {
    messages: any[];
    systemPrompt?: string;
    requestId: string;
  };
}

interface AbortStreamRequest {
  type: typeof ABORT_STREAM;
  payload: {
    requestId: string;
  };
}

const activeStreams = new Map<
  string,
  {
    reader?: ReadableStreamDefaultReader<Uint8Array> | null;
    abortController: AbortController;
  }
>();

/**
 * Sets up a handler for the experiment stream that processes getCustomBackendResponse
 * and streams the Response to the client
 */
export function setupExperimentStreamHandler() {
  chrome.runtime.onConnect.addListener((port) => {
    console.log("Connection received:", port.name);

    // Only handle connections for our experimental stream
    if (port.name !== EXPERIMENTAL_STREAM_PORT_NAME) {
      return false;
    }

    port.onMessage.addListener(async (message) => {
      if (message.type === KEEPALIVE_PING) {
        port.postMessage({ type: KEEPALIVE_PONG });
        return;
      }

      if (isAbortStreamRequest(message)) {
        const { requestId } = message.payload;
        const activeStream = activeStreams.get(requestId);

        if (activeStream) {
          console.log(`[experiment-handler] Aborting stream ${requestId}`);
          // Signal abort to the AI API
          activeStream.abortController.abort();

          if (activeStream.reader) {
            try {
              activeStream.reader.cancel("Stream aborted by user");
            } catch (error) {
              console.error(
                `[experiment-handler] Error cancelling reader:`,
                error
              );
            }
          }

          activeStreams.delete(requestId);
        }

        return;
      }

      if (!isExperimentalStreamRequest(message)) {
        console.warn("Received invalid message format:", message);
        port.postMessage({
          type: EXPERIMENT_STREAM_ERROR,
          payload: { message: "Invalid message format" },
        });
        return;
      }

      const { messages, systemPrompt, requestId } = message.payload;
      console.log(
        "Background received stream request with messages:",
        messages.length,
        "requestId:",
        requestId
      );

      // Create an AbortController for this stream
      const abortController = new AbortController();

      abortController.signal.addEventListener("abort", () => {
        console.log(
          `[experiment-handler] AbortController signal was triggered for ${requestId}`
        );
      });

      activeStreams.set(requestId, { abortController });

      let reader: ReadableStreamDefaultReader<Uint8Array> | null | undefined =
        null;

      try {
        const response = await getCustomBackendResponse(messages, {
          systemPrompt,
          abortSignal: abortController.signal,
        });

        port.postMessage({
          type: EXPERIMENT_STREAM_METADATA,
          payload: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          },
        });

        reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Could not get reader from response");
        }

        // Store the reader to enable cancellation
        activeStreams.set(requestId, {
          reader,
          abortController,
        });

        // Stream chunks to the client immediately as they arrive
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (abortController.signal.aborted) {
            console.log(
              `[experiment-handler] Detected abort during read loop for ${requestId}`
            );
            break;
          }

          if (result.value) {
            const base64Chunk = arrayBufferToBase64(result.value.buffer);
            port.postMessage({
              type: EXPERIMENT_STREAM_CHUNK,
              payload: base64Chunk,
            });
          }
        }

        // Signal successful completion after the loop
        port.postMessage({ type: EXPERIMENT_STREAM_COMPLETE });
      } catch (error) {
        if (abortController.signal.aborted) {
          console.log(`[experiment-handler] Stream was aborted: ${requestId}`);
          port.postMessage({ type: EXPERIMENT_STREAM_COMPLETE });
        } else {
          console.error(`[experiment-handler] Error in stream handler:`, error);
          port.postMessage({
            type: EXPERIMENT_STREAM_ERROR,
            payload:
              error instanceof Error
                ? { message: error.message }
                : { message: "Unknown error" },
          });
        }
      } finally {
        activeStreams.delete(requestId);
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
    Array.isArray(message.payload.messages) &&
    typeof message.payload.requestId === "string"
  );
}

function isAbortStreamRequest(message: any): message is AbortStreamRequest {
  return (
    message &&
    typeof message === "object" &&
    message.type === ABORT_STREAM &&
    message.payload &&
    typeof message.payload.requestId === "string"
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
