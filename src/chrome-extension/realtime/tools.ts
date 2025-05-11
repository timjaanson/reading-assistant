export enum RealtimeTools {
  PASS_TO_AGENT = "pass_to_agent",
}

const toolsDefinition = [
  {
    name: RealtimeTools.PASS_TO_AGENT,
    description:
      "Pass a task to an advanced AI agent that can handle complex tasks. It can see what the user is currently looking at, search the web, extract information from URLs, and more. Provide full context needed for any task and/or query.",
    parameters: {
      type: "object",
      properties: {
        agentTask: {
          type: "string",
          description:
            "The full task to pass to the agent, along with all necessary context.",
        },
      },
      required: ["agentTask"],
    },
  },
];

export const TOOLS = toolsDefinition.map((tool) => ({
  type: "function",
  ...tool,
}));
