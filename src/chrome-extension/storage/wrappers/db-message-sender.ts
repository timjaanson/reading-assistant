import {
  DB_OPERATION_ERROR,
  DB_OPERATION_REQUEST,
  DB_OPERATION_RESPONSE,
  DbMethodName,
  DbOperationRequest,
  DbOperationResponse,
  DbTarget,
} from "../../common/db-messaging-types";
import { chatDb } from "../chatDatabase";
import { memoryDb } from "../memoryDatabase";

function generateRequestId(): string {
  return `db-req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function isBackgroundContext(): boolean {
  return typeof window === "undefined";
}

/**
 * Generic function to call database methods via message passing
 *
 * @param dbTarget The target database ("chat" or "memory")
 * @param methodName The method name to call
 * @param args The arguments to pass to the method
 * @param retryCount Number of retries if connection fails (default: 2)
 * @returns A promise that resolves with the result of the database operation
 */
export async function callDbMethod<T>(
  dbTarget: DbTarget,
  methodName: DbMethodName,
  args: any[]
): Promise<T> {
  // If we're in the background context, call the DB directly instead of using messaging
  if (isBackgroundContext()) {
    console.debug(
      `[db-sender] Running in background context, calling ${dbTarget}.${methodName} directly`
    );
    try {
      const dbInstance = dbTarget === "chat" ? chatDb : memoryDb;

      const method = dbInstance[methodName as keyof typeof dbInstance];
      if (typeof method !== "function") {
        throw new Error(
          `Method ${methodName} not found on ${dbTarget} database`
        );
      }

      const result = await (method as Function).apply(dbInstance, args);
      return result as T;
    } catch (err) {
      console.error(
        `[db-sender] Error calling ${dbTarget}.${methodName} directly:`,
        err
      );
      throw err;
    }
  }

  // Create request ID and request object
  const requestId = generateRequestId();
  const request: DbOperationRequest = {
    type: DB_OPERATION_REQUEST,
    payload: {
      dbTarget,
      methodName,
      args,
    },
    requestId,
  };

  console.debug(
    `[db-sender] Sending ${dbTarget}.${methodName} request ${requestId}`,
    {
      extensionId: chrome.runtime.id,
      messageType: request.type,
      target: dbTarget,
      method: methodName,
    }
  );

  return new Promise<T>((resolve, reject) => {
    try {
      if (!chrome.runtime?.id) {
        console.error("[db-sender] Extension context invalid or unavailable");
        return reject(new Error("Extension context unavailable"));
      }

      chrome.runtime.sendMessage(request, (response: DbOperationResponse) => {
        // Check for chrome runtime errors
        if (chrome.runtime.lastError) {
          const errorMessage =
            chrome.runtime.lastError.message || "Unknown error";
          console.warn(
            `[db-sender] DB operation error (${dbTarget}.${methodName}):`,
            errorMessage
          );

          return reject(new Error(`Chrome runtime error: ${errorMessage}`));
        }

        // Check if we got a valid response
        if (!response) {
          console.error(`[db-sender] No response received for ${requestId}`);
          return reject(new Error("No response received"));
        }

        if (response.requestId !== requestId) {
          console.error(
            `[db-sender] Request ID mismatch. Expected: ${requestId}, Received: ${response.requestId}`
          );
          return reject(
            new Error("Invalid response received (request ID mismatch)")
          );
        }

        // Handle error responses
        if (response.type === DB_OPERATION_ERROR && response.payload.error) {
          console.error(
            `[db-sender] Error response for ${requestId}:`,
            response.payload.error
          );
          const error = new Error(response.payload.error.message);
          if (response.payload.error.name) {
            error.name = response.payload.error.name;
          }
          if (response.payload.error.stack) {
            error.stack = response.payload.error.stack;
          }
          return reject(error);
        }

        if (response.type === DB_OPERATION_RESPONSE) {
          return resolve(response.payload.data as T);
        }

        // Fallback error
        console.error(
          `[db-sender] Unknown response type for ${requestId}: ${response.type}`
        );
        reject(new Error("Unknown response type"));
      });
    } catch (err) {
      console.error(
        `[db-sender] Exception during sendMessage for ${requestId}:`,
        err
      );
      reject(err);
    }
  });
}
