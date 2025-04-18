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
  const abortControllers = new Map<
    string,
    { port: chrome.runtime.Port; controller: AbortController }
  >();

  return async (_input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init?.body) {
        throw new Error("No request body provided");
      }

      const body = JSON.parse(init.body.toString());

      if (!body.messages || !Array.isArray(body.messages)) {
        throw new Error("No messages found in request body");
      }

      const requestId = crypto.randomUUID();

      const controller = new AbortController();
      const { signal } = controller;

      const port = chrome.runtime.connect({
        name: EXPERIMENTAL_STREAM_PORT_NAME,
      });

      abortControllers.set(requestId, { port, controller });

      const { readable, writable } = new TransformStream<Uint8Array>();
      const writer = writable.getWriter();

      let writerState = "active"; // Can be: active, aborted, closed

      let responseResolve: (response: Response) => void;
      const responsePromise = new Promise<Response>((resolve) => {
        responseResolve = resolve;
      });

      if (init.signal) {
        init.signal.addEventListener("abort", () => {
          console.log(
            `[custom-fetch] Abort signal received for request ${requestId}`
          );
          // When the original request is aborted, forward abort to background
          port.postMessage({
            type: "ABORT_STREAM",
            payload: { requestId },
          });

          controller.abort();
          writerState = "aborted";

          writer.abort(
            new DOMException("The user aborted a request.", "AbortError")
          );
        });
      }

      // Handle local abort events
      signal.addEventListener("abort", () => {
        if (writerState === "active") {
          writerState = "aborted";
          writer.abort(
            new DOMException("The user aborted a request.", "AbortError")
          );
        }
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
            if (writerState === "active") {
              const binaryChunk = base64ToArrayBuffer(message.payload);
              writer.write(new Uint8Array(binaryChunk));
            }
          } catch (error) {
            console.error("Error processing chunk:", error);
            if (writerState === "active") {
              writerState = "aborted";
              writer.abort(
                error instanceof Error
                  ? error
                  : new Error("Chunk processing failed")
              );
            }
            port.disconnect();
          }
        } else if (message.type === EXPERIMENT_STREAM_METADATA) {
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
          // Only close if the writer is still active
          if (writerState === "active") {
            writerState = "closed";
            writer.close();
          }

          // Clean up the AbortController map
          abortControllers.delete(requestId);
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
          if (writerState === "active") {
            writerState = "aborted";
            writer.abort(error);
          }
          abortControllers.delete(requestId);
          port.disconnect();
        }
      });

      port.onDisconnect.addListener(() => {
        console.log("Custom background fetch port disconnected");
        abortControllers.delete(requestId);

        if (chrome.runtime.lastError) {
          const error = new Error(
            chrome.runtime.lastError.message || "Unknown disconnect error"
          );
          console.error("Port disconnected with error:", error);
          if (writerState === "active") {
            writerState = "aborted";
            writer.abort(error);
          }
        } else {
          // If the port disconnected cleanly *without* an error,
          // and we haven't already closed the writer (via COMPLETE or ERROR),
          // This handles cases where the background script might terminate unexpectedly.
          try {
            if (writerState === "active") {
              writerState = "closed";
              writer.close();
              console.log("Writer closed due to clean disconnect.");
            }
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
          requestId,
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
