import { chatDb } from "../storage/chatDatabase";
import { memoryDb } from "../storage/memoryDatabase";
import {
  DB_OPERATION_RESPONSE,
  DB_OPERATION_ERROR,
  isDbOperationRequest,
  DbOperationResponse,
} from "../common/db-messaging-types";

export function setupDatabaseHandler() {
  console.log("[database-handler] Initializing database handler...");

  const messageHandler = (
    message: any,
    _: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (!isDbOperationRequest(message)) {
      console.log("[database-handler] Not a DB operation request, ignoring.");
      return false;
    }

    const { dbTarget, methodName, args } = message.payload;
    const { requestId } = message;

    const dbInstance = dbTarget === "chat" ? chatDb : memoryDb;

    (async () => {
      try {
        const method = dbInstance[methodName as keyof typeof dbInstance];
        if (typeof method !== "function") {
          throw new Error(
            `Method ${methodName} not found on ${dbTarget} database`
          );
        }

        const result = await (method as Function).apply(dbInstance, args);

        const response: DbOperationResponse = {
          type: DB_OPERATION_RESPONSE,
          requestId,
          payload: { data: result },
        };

        sendResponse(response);
      } catch (err) {
        console.error(
          `[database-handler] Error executing ${dbTarget}.${methodName}:`,
          err
        );

        const error = err as Error;
        const response: DbOperationResponse = {
          type: DB_OPERATION_ERROR,
          requestId,
          payload: {
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack,
            },
          },
        };

        console.log(
          `[database-handler] Sending error response for ${requestId}.`
        );
        sendResponse(response);
      }
    })();

    return true;
  };

  chrome.runtime.onMessage.addListener(messageHandler);
}
