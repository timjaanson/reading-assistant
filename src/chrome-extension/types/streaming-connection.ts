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
