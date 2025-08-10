import { isToolUIPart, UIMessage } from "ai";
import { useCallback } from "react";
import {
  ReasoningPartRenderer,
  TextPartRenderer,
  ToolPartRenderer,
  SourcePartRenderer,
} from "./MessagePartRenderer";

type MessagePart = UIMessage["parts"][number];

interface MessageRendererProps {
  message: UIMessage;
  collapsableMessage?: boolean;
}

const PartRenderer = ({
  part,
  textColor,
  isUserMessage = false,
}: {
  part: MessagePart;
  textColor: string;
  isUserMessage: boolean;
}) => {
  switch (part.type) {
    case "step-start":
      // we render every message separately, so we don't need logic to identify the start of a step
      return null;
    case "text":
      return (
        <TextPartRenderer
          content={part.text}
          textColor={textColor}
          collapsable={isUserMessage}
        />
      );

    case "reasoning":
      return part.text ? (
        <ReasoningPartRenderer content={part.text} textColor={textColor} />
      ) : null;

    case "source-document":
    case "source-url":
      return <SourcePartRenderer source={part} textColor={textColor} />;

    case "file":
      if (part.mediaType?.startsWith("image/")) {
        return (
          <div className="flex flex-col">
            <img
              src={part.url}
              alt="Image attachment"
              className="max-w-[300px] max-h-[300px] object-contain rounded"
            />
          </div>
        );
      }
      return (
        <div className={`text-sm flex items-center pl-1.5 ${textColor}`}>
          <span>Attachment</span>
        </div>
      );
    case "dynamic-tool":
      return <ToolPartRenderer toolInvocation={part} textColor={textColor} />;
    default:
      if (isToolUIPart(part)) {
        return <ToolPartRenderer toolInvocation={part} textColor={textColor} />;
      }

      // Handle potential unknown part types gracefully
      return (
        <div className={`text-xs ${textColor}`}>
          UNKNOWN TYPE: [{JSON.stringify(part)}]
        </div>
      );
  }
};

export const MessageRenderer = ({ message }: MessageRendererProps) => {
  const { role, parts } = message;
  const isUserMessage = role === "user";

  const bubbleColor = useCallback(() => {
    return isUserMessage ? "bg-primary" : "bg-secondary";
  }, [isUserMessage]);

  const textColor = useCallback(() => {
    return isUserMessage
      ? "text-primary-foreground"
      : "text-secondary-foreground";
  }, [isUserMessage]);

  // Ensure parts is always an array, even if undefined in the message prop initially
  const validParts = Array.isArray(parts) ? parts : [];

  const messageContent = (
    <>
      {validParts
        .filter((part) => part.type !== "source-url")
        .map((part, index) => (
          <PartRenderer
            key={index}
            part={part}
            textColor={textColor()}
            isUserMessage={isUserMessage}
          />
        ))}

      {validParts.some((part) => part.type === "source-url") && (
        <div className="flex flex-wrap gap-1 mt-1">
          {validParts
            .filter((part) => part.type === "source-url")
            .map((part, index) => (
              <PartRenderer
                isUserMessage={isUserMessage}
                key={`source-${index}`}
                part={part}
                textColor={textColor()}
              />
            ))}
        </div>
      )}
    </>
  );

  return (
    <div
      className={`max-w-full flex flex-col ${
        isUserMessage ? "pl-1 items-end" : "pr-1"
      }`}
    >
      <div
        className={`flex flex-col gap-1 overflow-auto p-1.5 pl-3 rounded-lg ${bubbleColor()} border dark:border-none max-w-7xl`}
      >
        {messageContent}
      </div>
    </div>
  );
};
