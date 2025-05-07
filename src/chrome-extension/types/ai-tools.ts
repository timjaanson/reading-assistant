import { Tool, ToolChoice } from "ai";

export interface AiTools {
  tools: Record<string, Tool>;
  toolChoice?: ToolChoice<AiTools["tools"]>;
}
