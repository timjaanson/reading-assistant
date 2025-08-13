import { isToolUIPart, UIMessage } from "ai";
import { useCallback } from "react";
import {
  ReasoningPartRenderer,
  TextPartRenderer,
  ToolPartRenderer,
  SourcePartRenderer,
  CollapsableSection,
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

  const nonSourceParts = validParts.filter(
    (part) => part.type !== "source-url"
  );
  const sourceUrlParts = validParts.filter(
    (part) => part.type === "source-url"
  );

  type RenderChunk =
    | { kind: "other"; part: MessagePart }
    | { kind: "grouped-reasoning"; text: string };

  const renderChunks: RenderChunk[] = [];
  if (isUserMessage) {
    for (const p of nonSourceParts) {
      renderChunks.push({ kind: "other", part: p });
    }
  } else {
    for (let i = 0; i < nonSourceParts.length; i++) {
      const current = nonSourceParts[i];
      if (current.type === "reasoning" && (current as any).text) {
        const texts: string[] = [];
        let j = i;
        while (
          j < nonSourceParts.length &&
          nonSourceParts[j].type === "reasoning" &&
          (nonSourceParts[j] as any).text
        ) {
          texts.push((nonSourceParts[j] as any).text as string);
          j++;
        }
        //const combined = texts.join("\n\n> ——— \n\n");
        const combined = texts.join("\n\n---\n\n");
        if (combined.length > 0) {
          renderChunks.push({ kind: "grouped-reasoning", text: combined });
        }
        i = j - 1; // skip grouped items
      } else {
        renderChunks.push({ kind: "other", part: current });
      }
    }
  }

  const messageContent = (
    <>
      {renderChunks.map((chunk, index) => {
        if (chunk.kind === "grouped-reasoning") {
          return (
            <CollapsableSection
              key={`reasoning-${index}`}
              openText="Show reasoning"
              closeText="Hide reasoning"
              textColor={textColor()}
            >
              <TextPartRenderer content={chunk.text} textColor={textColor()} />
            </CollapsableSection>
          );
        }
        return (
          <PartRenderer
            key={index}
            part={chunk.part}
            textColor={textColor()}
            isUserMessage={isUserMessage}
          />
        );
      })}

      {sourceUrlParts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {sourceUrlParts.map((part, index) => (
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
