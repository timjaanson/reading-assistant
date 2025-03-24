export interface ReasoningPart {
  type: "reasoning";
  /**
  The reasoning text.
     */
  text: string;
  /**
  An optional signature for verifying that the reasoning originated from the model.
     */
  signature?: string;
  /**
  Additional provider-specific metadata. They are passed through
  to the provider from the AI SDK and enable provider-specific
  functionality that can be fully encapsulated in the provider.
   */
  providerOptions?: unknown;
  /**
  @deprecated Use `providerOptions` instead.
   */
  experimental_providerMetadata?: unknown;
}

export interface RedactedReasoningPart {
  type: "redacted-reasoning";
  /**
  Redacted reasoning data.
     */
  data: string;
  /**
  Additional provider-specific metadata. They are passed through
  to the provider from the AI SDK and enable provider-specific
  functionality that can be fully encapsulated in the provider.
   */
  providerOptions?: unknown;
  /**
  @deprecated Use `providerOptions` instead.
   */
  experimental_providerMetadata?: unknown;
}

type JSONValue = null | string | number | boolean | JSONObject | JSONArray;
type JSONObject = {
  [key: string]: JSONValue;
};
type JSONArray = JSONValue[];

export type ProviderOptions = Record<string, Record<string, JSONValue>>;
