import { IChatDatabase, IMemoryDatabase } from "../types/database";

// Message types
export const DB_OPERATION_REQUEST = "DB_OPERATION_REQUEST";
export const DB_OPERATION_RESPONSE = "DB_OPERATION_RESPONSE";
export const DB_OPERATION_ERROR = "DB_OPERATION_ERROR";

export type DbTarget = "chat" | "memory";
export type DbMethodName = keyof IChatDatabase | keyof IMemoryDatabase;

export interface DbOperationRequestPayload {
  dbTarget: DbTarget;
  methodName: DbMethodName;
  args: any[];
}

export interface DbOperationRequest {
  type: typeof DB_OPERATION_REQUEST;
  payload: DbOperationRequestPayload;
  requestId: string;
}

export interface DbOperationResponsePayload {
  data?: any;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
}

export interface DbOperationResponse {
  type: typeof DB_OPERATION_RESPONSE | typeof DB_OPERATION_ERROR;
  payload: DbOperationResponsePayload;
  requestId: string;
}

export function isDbOperationRequest(
  message: any
): message is DbOperationRequest {
  return (
    message &&
    typeof message === "object" &&
    message.type === DB_OPERATION_REQUEST &&
    message.payload &&
    typeof message.payload.dbTarget === "string" &&
    typeof message.payload.methodName === "string" &&
    Array.isArray(message.payload.args) &&
    typeof message.requestId === "string"
  );
}
