import { UIMessage } from "ai";
import { getCustomBackendResponse } from "./ai";

// It maintains compatibility with useChat by reconstructing a Response with a ReadableStream
export const createCustomBackgroundFetch = () => {
  return async (_input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init?.body) {
        throw new Error("No request body provided");
      }

      const body = JSON.parse(init.body.toString()) as {
        messages: UIMessage[];
        systemPrompt?: string;
      };

      if (!body.messages || !Array.isArray(body.messages)) {
        throw new Error("No messages found in request body");
      }

      const controller = new AbortController();

      // Link the controller to the original request signal if provided
      if (init.signal) {
        init.signal.addEventListener("abort", () => {
          controller.abort();
        });
      }

      // Create a TransformStream to pipe the reader data through
      const { readable, writable } = new TransformStream<Uint8Array>();
      const writer = writable.getWriter();

      const response = await getCustomBackendResponse(body.messages, {
        systemPrompt: body.systemPrompt,
        abortSignal: controller.signal,
      });

      const headers = new Headers(response.headers);

      const streamResponse = new Response(readable, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      if (response.body) {
        const reader = response.body.getReader();

        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                await writer.close();
                break;
              }

              await writer.write(value);
            }
          } catch (error) {
            console.error("Error processing stream:", error);
            await writer.abort(
              error instanceof Error
                ? error
                : new Error("Stream processing failed")
            );
          }
        })();
      } else {
        writer.close();
      }

      return streamResponse;
    } catch (error) {
      console.error("Error in custom fetch:", error);
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
