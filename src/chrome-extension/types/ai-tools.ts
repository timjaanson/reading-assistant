import { ToolChoice } from "ai";
import { z } from "zod";

export interface AiTools {
  tools: Record<string, ToolDefinition>;
  toolChoice?: ToolChoice<AiTools["tools"]>;
}

interface ToolExecutionOptions {
  abortSignal?: AbortSignal;
}

type ToolParameters = z.ZodSchema<unknown, z.ZodTypeDef, unknown>;

export interface ToolDefinition<TResult = unknown> {
  description: string;
  parameters: ToolParameters;
  execute: (
    parameters: unknown,
    options?: ToolExecutionOptions
  ) => Promise<TResult>;
}

// Variant A: A function tool that uses the execute function.
// The `type` property is either not provided or explicitly set to 'function'.
export interface FunctionTool<TResult = unknown>
  extends ToolDefinition<TResult> {
  type?: undefined | "function";
}

// Variant B: A provider-defined tool.
// Instead of a local execute implementation, it is configured by an external provider.
export interface ProviderDefinedTool<TResult = unknown>
  extends ToolDefinition<TResult> {
  type: "provider-defined";
  id: `${string}.${string}`;
  args: Record<string, unknown>;
}

// A unified Tool type that can be either a FunctionTool or a ProviderDefinedTool.
export type Tool<TResult = unknown> =
  | FunctionTool<TResult>
  | ProviderDefinedTool<TResult>;
