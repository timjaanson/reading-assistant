import { CoreMessage, ToolCallPart, ToolResultPart } from "ai";
import { useState, useEffect } from "react";
import MessageBubble from "./MessageBubble";

type MessageGroupProps = {
  messages: CoreMessage[];
  collapseInitialMessage?: boolean;
  compact?: boolean;
};

// Type for the combined tool call and result that ContentRenderer expects
interface CombinedToolPart {
  type: "combined-tool";
  toolName: string;
  args: any;
  toolCallId: string;
  result: any;
}

// Function to identify related messages like tool calls and their results
export const groupRelatedMessages = (messages: CoreMessage[]) => {
  const result: CoreMessage[] = [];
  let i = 0;
  // Keep track of processed tool call IDs to avoid duplicates
  const processedToolCallIds = new Set<string>();
  // Keep track of indices of messages we've already processed
  const processedIndices = new Set<number>();

  while (i < messages.length) {
    // Skip messages that have already been processed
    if (processedIndices.has(i)) {
      i++;
      continue;
    }

    const currentMessage = messages[i];

    // Check if the current message is from an assistant and potentially contains a tool call
    if (
      currentMessage.role === "assistant" &&
      Array.isArray(currentMessage.content)
    ) {
      // Look for tool calls in the content
      const toolCalls = (currentMessage.content as any[]).filter(
        (part) => part.type === "tool-call"
      ) as ToolCallPart[];

      if (toolCalls.length > 0) {
        // Create a new message starting with basic text content from the assistant message
        const mergedMessageContent = (currentMessage.content as any[]).filter(
          (part) => part.type !== "tool-call"
        );

        const toolCallsToProcess = [...toolCalls];
        const processedToolCalls = new Set<string>();
        let foundAnyToolResult = false;
        // Track the indices of messages we'll combine with this one
        const messagesToCombine = new Set<number>();

        // Also track any follow-up assistant messages to combine
        const followUpMessageIndices = new Set<number>();

        // Look ahead up to 20 messages to find matching tool results
        const lookAheadLimit = Math.min(messages.length - i - 1, 20);

        for (let j = 1; j <= lookAheadLimit; j++) {
          const lookAheadIndex = i + j;
          if (lookAheadIndex >= messages.length) break;

          const lookAheadMessage = messages[lookAheadIndex];

          // Process tool result messages
          if (
            lookAheadMessage.role === "tool" &&
            Array.isArray(lookAheadMessage.content)
          ) {
            const toolResults = (lookAheadMessage.content as any[]).filter(
              (part) => part.type === "tool-result"
            ) as ToolResultPart[];

            // Process each tool result
            for (const result of toolResults) {
              // Find matching tool call that hasn't been processed yet
              const matchingToolCallIndex = toolCallsToProcess.findIndex(
                (toolCall) =>
                  toolCall.toolCallId === result.toolCallId &&
                  !processedToolCalls.has(toolCall.toolCallId)
              );

              if (matchingToolCallIndex !== -1) {
                const toolCall = toolCallsToProcess[matchingToolCallIndex];

                // Create a combined tool part
                const combinedTool: CombinedToolPart = {
                  type: "combined-tool",
                  toolName: toolCall.toolName,
                  args: toolCall.args,
                  toolCallId: toolCall.toolCallId,
                  result: result.result,
                };

                // Add the combined tool to the merged message
                mergedMessageContent.push(combinedTool);

                // Mark this tool call as processed
                processedToolCalls.add(toolCall.toolCallId);
                processedToolCallIds.add(toolCall.toolCallId);
                messagesToCombine.add(lookAheadIndex);
                foundAnyToolResult = true;
              }
            }
          }

          // Check for follow-up assistant messages that should be merged
          if (lookAheadMessage.role === "assistant") {
            // Only include follow-up assistant messages if we have found tool results
            // or if this is the first follow-up message in a sequence after tool results
            if (foundAnyToolResult || followUpMessageIndices.size > 0) {
              followUpMessageIndices.add(lookAheadIndex);
            }
          }
        }

        // Add any remaining unprocessed tool calls (without results)
        toolCallsToProcess.forEach((toolCall) => {
          if (!processedToolCalls.has(toolCall.toolCallId)) {
            mergedMessageContent.push(toolCall);
          }
        });

        // Process and add content from follow-up assistant messages
        for (const index of followUpMessageIndices) {
          const followUpMessage = messages[index];

          if (typeof followUpMessage.content === "string") {
            mergedMessageContent.push({
              type: "text",
              text: followUpMessage.content,
            });
          } else if (Array.isArray(followUpMessage.content)) {
            // Add each content part individually to maintain the correct structure
            for (const part of followUpMessage.content) {
              // Don't duplicate tool calls from follow-up messages
              if (
                part.type !== "tool-call" ||
                !processedToolCalls.has((part as ToolCallPart).toolCallId)
              ) {
                mergedMessageContent.push(part);
              }
            }
          }

          // Mark follow-up message as processed
          processedIndices.add(index);
        }

        // Create the merged message
        const mergedMessage: CoreMessage = {
          role: "assistant",
          content: mergedMessageContent,
        };

        result.push(mergedMessage);

        // Mark all the tool result messages we've combined as processed
        for (const index of messagesToCombine) {
          processedIndices.add(index);
        }

        i++;
        continue;
      }
    }

    // Handle tool result messages - only add them if they haven't been processed
    if (
      currentMessage.role === "tool" &&
      Array.isArray(currentMessage.content)
    ) {
      const toolResults = (currentMessage.content as any[]).filter(
        (part) => part.type === "tool-result"
      ) as ToolResultPart[];

      if (toolResults.length > 0) {
        // Check if all tool results in this message have been processed
        const allProcessed = toolResults.every((result) =>
          processedToolCallIds.has(result.toolCallId)
        );

        // If all tool results have been processed, skip this message
        if (allProcessed) {
          i++;
          continue;
        }
      }
    }

    // Regular message or unmatched tool call/result - add as is
    result.push(currentMessage);
    i++;
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
