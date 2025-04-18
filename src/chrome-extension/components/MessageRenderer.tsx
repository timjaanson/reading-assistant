import { UIMessage } from "@ai-sdk/ui-utils";
import { useCallback } from "react";
import {
  CollapsableSection,
  ReasoningPartRenderer,
  TextPartRenderer,
  ToolPartRenderer,
} from "./MessagePartRenderer";

type MessagePart = UIMessage["parts"][number];

interface MessageRendererProps {
  message: UIMessage;
  collapsableMessage?: boolean;
}

const PartRenderer = ({
  part,
  textColor,
}: {
  part: MessagePart;
  textColor: string;
}) => {
  switch (part.type) {
    case "step-start":
      // we render every message separately, so we don't need logic to identify the start of a step
      return null;
    case "text":
      return <TextPartRenderer content={part.text} textColor={textColor} />;

    case "reasoning":
      return (
        <ReasoningPartRenderer content={part.reasoning} textColor={textColor} />
      );

    case "tool-invocation":
      return (
        <ToolPartRenderer
          toolInvocation={part.toolInvocation}
          textColor={textColor}
        />
      );

    case "source":
    case "file":
      return (
        <div className={`text-xs ${textColor}`}>
          NOT HANDLED TYPE: [{part.type}]
        </div>
      );
    default:
      // Handle potential unknown part types gracefully
      return (
        <div className={`text-xs ${textColor}`}>
          {/* @ts-ignore - in case in the future other part types are added */}
          UNKNOWN TYPE: [{part.type}]
        </div>
      );
  }
};

export const MessageRenderer = ({
  message,
  collapsableMessage = false,
}: MessageRendererProps) => {
  const { role, parts } = message;

  const bubbleColor = useCallback(() => {
    return role === "user" ? "bg-gray-200/80" : "bg-[#1f1f1f]/85";
  }, [role]);

  const textColor = useCallback(() => {
    return role === "user" ? "text-gray-900" : "text-white/90";
  }, [role]);

  // Ensure parts is always an array, even if undefined in the message prop initially
  const validParts = Array.isArray(parts) ? parts : [];

  const messageContent = (
    <>
      {validParts.map((part, index) => (
        <PartRenderer key={index} part={part} textColor={textColor()} />
      ))}

      {/* Render message content if parts are not available (fallback/legacy) */}
      {validParts.length === 0 && message.content && (
        <div>LEGACY RENDERING:{message.content}</div>
      )}
    </>
  );

  return (
    <div
      className={`flex flex-col gap-1 p-1.5 rounded-lg ${bubbleColor()} max-w-7xl w-fit overflow-hidden`}
    >
      {collapsableMessage ? (
        <CollapsableSection textColor={textColor()}>
          {messageContent}
        </CollapsableSection>
      ) : (
        messageContent
      )}
    </div>
  );
};
