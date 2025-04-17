import {
  EXPERIMENTAL_STREAM_PORT_NAME,
  EXPERIMENT_STREAM_CHUNK,
  EXPERIMENT_STREAM_METADATA,
  EXPERIMENT_STREAM_COMPLETE,
  EXPERIMENT_STREAM_ERROR,
  GET_EXPERIMENT_STREAM,
} from "../background/experiment-stream-handler";

// This function creates a fetch implementation that uses the background script to process requests
// It maintains compatibility with useChat by reconstructing a Response with a ReadableStream
export const createCustomBackgroundFetch = () => {
  return async (_input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init?.body) {
        throw new Error("No request body provided");
      }

      const body = JSON.parse(init.body.toString());

      if (!body.messages || !Array.isArray(body.messages)) {
        throw new Error("No messages found in request body");
      }

      const port = chrome.runtime.connect({
        name: EXPERIMENTAL_STREAM_PORT_NAME,
      });

      // Create a ReadableStream to reconstruct the response
      const { readable, writable } = new TransformStream<Uint8Array>();
      const writer = writable.getWriter();

      // Use a pre-resolved promise instead of waiting for stream end
      let responseResolve: (response: Response) => void;
      const responsePromise = new Promise<Response>((resolve) => {
        responseResolve = resolve;
      });

      let responseCreated = false;
      let responseMetadata: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
      } = {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/plain" },
      };

      port.onMessage.addListener((message) => {
        if (message.type === EXPERIMENT_STREAM_CHUNK) {
          try {
            // Decode the base64 chunk back to a Uint8Array
            const binaryChunk = base64ToArrayBuffer(message.payload);
            writer.write(new Uint8Array(binaryChunk));
          } catch (error) {
            console.error("Error processing chunk:", error);
            // Potentially abort the writer here if chunk processing fails critically
            writer.abort(
              error instanceof Error
                ? error
                : new Error("Chunk processing failed")
            );
            port.disconnect();
          }
        } else if (message.type === EXPERIMENT_STREAM_METADATA) {
          // Store response metadata and create response immediately
          if (message.payload) {
            responseMetadata = message.payload;
          }

          if (!responseCreated) {
            responseCreated = true;
            const headers = new Headers(responseMetadata.headers);
            responseResolve(
              new Response(readable, {
                status: responseMetadata.status,
                statusText: responseMetadata.statusText,
                headers,
              })
            );
          }
        } else if (message.type === EXPERIMENT_STREAM_COMPLETE) {
          writer.close();
          // Don't disconnect the port here, let it close naturally or via onDisconnect
          console.log(
            "Custom background fetch received stream complete signal"
          );
        } else if (message.type === EXPERIMENT_STREAM_ERROR) {
          const error = new Error(
            message.payload?.message || "Unknown error from background"
          );
          console.error(
            "Custom background fetch received error signal:",
            error
          );
          writer.abort(error);
          port.disconnect();
        }
      });

      port.onDisconnect.addListener(() => {
        console.log("Custom background fetch port disconnected.");
        if (chrome.runtime.lastError) {
          const error = new Error(
            chrome.runtime.lastError.message || "Unknown disconnect error"
          );
          console.error("Port disconnected with error:", error);
          writer.abort(error);
        } else {
          // If the port disconnected cleanly *without* an error,
          // and we haven't already closed the writer (via COMPLETE or ERROR),
          // This handles cases where the background script might terminate unexpectedly.
          try {
            // This might throw if already closed/aborted, which is fine.
            writer.close();
            console.log("Writer closed due to clean disconnect.");
          } catch (e) {
            console.log(
              "Writer likely already closed/aborted on disconnect:",
              e
            );
          }
        }

        // Ensure the response promise is resolved if it hasn't been already
        // (e.g., if METADATA message was never received before disconnect)
        if (!responseCreated) {
          responseCreated = true;
          const headers = new Headers(responseMetadata.headers);
          responseResolve(
            new Response(readable, {
              status: responseMetadata.status,
              statusText: responseMetadata.statusText,
              headers,
            })
          );
        }
      });

      port.postMessage({
        type: GET_EXPERIMENT_STREAM,
        payload: {
          messages: body.messages,
          systemPrompt: body.systemPrompt,
        },
      });

      return responsePromise;
    } catch (error) {
      console.error("Error in secure fetch:", error);
      return new Response(
        JSON.stringify({ error: "Error processing request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
