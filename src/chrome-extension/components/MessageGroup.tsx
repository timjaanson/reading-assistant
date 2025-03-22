import { CoreMessage } from "ai";
import { useState, useEffect } from "react";
import MessageBubble from "./MessageBubble";

type MessageGroupProps = {
  messages: CoreMessage[];
  collapseInitialMessage?: boolean;
  compact?: boolean;
};

// Function to identify related messages like tool calls and their results
export const groupRelatedMessages = (messages: CoreMessage[]) => {
  const result: CoreMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const currentMessage = messages[i];

    // Check if the current message is from an assistant and potentially contains a tool call
    if (currentMessage.role === "assistant" && i + 1 < messages.length) {
      const nextMessage = messages[i + 1];

      // Check if the next message is a tool response
      if (nextMessage.role === "tool") {
        // This is a tool call + tool result combination

        // Create a merged message with the assistant's content and the tool result
        const mergedMessage: CoreMessage = {
          role: "assistant",
          content: Array.isArray(currentMessage.content)
            ? [...currentMessage.content]
            : [{ type: "text", text: currentMessage.content as string }],
        };

        // Add the tool message content to the merged message
        if (typeof nextMessage.content === "string") {
          (mergedMessage.content as any[]).push({
            type: "text",
            text: nextMessage.content,
          });
        } else if (Array.isArray(nextMessage.content)) {
          (mergedMessage.content as any[]).push(...nextMessage.content);
        }

        // Check if there's a follow-up assistant message after the tool result
        if (i + 2 < messages.length && messages[i + 2].role === "assistant") {
          const followupMessage = messages[i + 2];

          // Add the follow-up assistant content to the merged message
          if (typeof followupMessage.content === "string") {
            (mergedMessage.content as any[]).push({
              type: "text",
              text: followupMessage.content,
            });
          } else if (Array.isArray(followupMessage.content)) {
            (mergedMessage.content as any[]).push(...followupMessage.content);
          }

          // Skip the follow-up message since we've merged it
          i += 3;
        } else {
          // Only skip the current message and the tool result
          i += 2;
        }

        result.push(mergedMessage);
      } else {
        // Not a tool call sequence, add the message as is
        result.push(currentMessage);
        i++;
      }
    } else {
      // Regular message, add as is
      result.push(currentMessage);
      i++;
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
