import { CoreMessage, ToolCallPart, ToolResultPart } from "ai";
import { useState, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { CombinedToolPart } from "./ContentRenderer";

type MessageGroupProps = {
  messages: CoreMessage[];
  collapseInitialMessage?: boolean;
  compact?: boolean;
};

// Function to identify and combine tool calls with their results
export const groupRelatedMessages = (messages: CoreMessage[]) => {
  const result: CoreMessage[] = [];

  // Maps to track tool calls and results
  const toolCallsById = new Map<string, ToolCallPart>();
  const toolResultsById = new Map<string, ToolResultPart>();
  const processedToolIds = new Set<string>();

  // First pass: Extract all tool calls and tool results
  for (const message of messages) {
    if (Array.isArray(message.content)) {
      // Extract all tool calls from assistant messages
      if (message.role === "assistant") {
        for (const part of message.content) {
          if (part.type === "tool-call") {
            toolCallsById.set(part.toolCallId, part as ToolCallPart);
          }
        }
      }

      // Extract all tool results from tool messages
      if (message.role === "tool") {
        for (const part of message.content) {
          if (part.type === "tool-result") {
            toolResultsById.set(part.toolCallId, part as ToolResultPart);
          }
        }
      }
    }
  }

  // Second pass: Process messages in order and create properly grouped output
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Process assistant messages
    if (message.role === "assistant" && Array.isArray(message.content)) {
      // Extract regular content and tool calls separately
      const regularContent = [];
      const toolCallsWithResults = [];

      for (const part of message.content) {
        if (part.type === "tool-call") {
          const toolCall = part as ToolCallPart;
          const toolResult = toolResultsById.get(toolCall.toolCallId);

          if (toolResult) {
            // We have a matching result, create a combined tool part
            // The type isn't directly supported by AssistantContent but ContentRenderer handles it
            const combinedPart: CombinedToolPart = {
              type: "combined-tool",
              toolName: toolCall.toolName,
              args: toolCall.args,
              toolCallId: toolCall.toolCallId,
              result: toolResult.result,
            };

            // Mark this tool result as processed
            processedToolIds.add(toolCall.toolCallId);

            // Add the combined part (with a type assertion for TypeScript)
            toolCallsWithResults.push(combinedPart as any);
          } else {
            // No matching result, keep the original tool call
            toolCallsWithResults.push(toolCall);
          }
        } else if (part.type === "text" && part.text.trim() === "") {
          // Skip empty text
          continue;
        } else {
          regularContent.push(part);
        }
      }

      // Add non-empty regular content with tool calls
      if (regularContent.length > 0 || toolCallsWithResults.length > 0) {
        result.push({
          role: "assistant",
          content: [...regularContent, ...toolCallsWithResults],
        });
      }
    }
    // Process tool messages for any unmatched tool results
    else if (message.role === "tool" && Array.isArray(message.content)) {
      const unmatchedResults = [];

      for (const part of message.content) {
        if (part.type === "tool-result") {
          const toolResult = part as ToolResultPart;
          // Only include tool results that weren't already processed
          if (!processedToolIds.has(toolResult.toolCallId)) {
            processedToolIds.add(toolResult.toolCallId);
            unmatchedResults.push(toolResult);
          }
        }
      }

      if (unmatchedResults.length > 0) {
        result.push({
          role: "tool",
          content: unmatchedResults,
        });
      }
    }
    // Add all other message types directly
    else if (message.role !== "assistant" && message.role !== "tool") {
      result.push(message);
    }
  }

  return result;
};

const MessageGroup = ({
  messages,
  collapseInitialMessage = false,
  compact = false,
}: MessageGroupProps) => {
  const [processedMessages, setProcessedMessages] = useState<CoreMessage[]>([]);

  useEffect(() => {
    // Process messages to group related ones
    const groupedMessages = groupRelatedMessages(messages);
    setProcessedMessages(groupedMessages);
  }, [messages]);

  return (
    <div className={compact ? "space-y-1" : "space-y-4"}>
      {processedMessages.map((message, index) => {
        const showRole =
          index === 0 ||
          processedMessages[index].role !== processedMessages[index - 1].role;

        return (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.content}
            showRole={showRole}
            isCollapsible={
              collapseInitialMessage && index === 0 && message.role === "user"
            }
            compact={compact}
          />
        );
      })}
    </div>
  );
};

export default MessageGroup;
