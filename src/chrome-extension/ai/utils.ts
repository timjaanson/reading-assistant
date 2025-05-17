import { Message } from "@ai-sdk/react";

export const messagesHasUnresolvedToolCalls = (messages: Message[]) => {
  return messages.some((message) =>
    message.parts?.some(
      (part) =>
        part.type === "tool-invocation" && part.toolInvocation.state === "call"
    )
  );
};
