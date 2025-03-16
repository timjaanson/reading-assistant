import { FilePart, ImagePart, TextPart, ToolCallPart, ToolContent } from "ai";
import ReactMarkdown from "react-markdown";
import { ReasoningPart, RedactedReasoningPart } from "../types/ai-sdk-missing";
import { useState } from "react";

export type MessageBubbleProps = {
  role: string;
  content:
    | string
    | (TextPart | ImagePart | FilePart)[]
    | (TextPart | ReasoningPart | RedactedReasoningPart | ToolCallPart)[]
    | ToolContent;
  showRole: boolean;
  isCollapsible?: boolean;
  compact?: boolean;
};

const getCustomMarkdown = (content: string) => {
  return (
    <ReactMarkdown
      components={{
        ol: ({ children }) => (
          <ol className="py-2 pl-6 list-decimal break-words whitespace-normal">
            {children}
          </ol>
        ),
        ul: ({ children }) => (
          <ul className="py-2 pl-6 list-disc break-words whitespace-normal">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="my-1 break-words whitespace-normal">{children}</li>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const MessageBubble = ({
  role,
  content,
  showRole,
  isCollapsible,
  compact = false,
}: MessageBubbleProps) => {
  const [isCollapsed, setIsCollapsed] = useState(isCollapsible);

  // If role is "user" then use the off-white style, otherwise blue
  const bubbleColor =
    role === "user"
      ? "bg-gray-200/85 !text-gray-900"
      : "bg-blue-500/85 !text-white";

  // Use smaller padding for the main bubble if compact
  const bubblePadding = compact ? "p-1" : "p-2";

  const renderContent = () => {
    if (!isCollapsible) {
      return typeof content === "string" ? (
        <span>{getCustomMarkdown(content)}</span>
      ) : Array.isArray(content) ? (
        content.map((part, idx) => {
          if (part && typeof part === "object" && "type" in part) {
            if (part.type === "text")
              return <span key={idx}>{getCustomMarkdown(part.text)}</span>;
            if (part.type === "image")
              return part.image instanceof URL ? (
                <img
                  key={idx}
                  src={part.image.href}
                  alt={`image-${idx}`}
                  className="max-w-full"
                />
              ) : (
                <img
                  key={idx}
                  src={part.image.toString()}
                  alt={`image-${idx}`}
                  className="max-w-full"
                />
              );
            // For other parts, use JSON stringification
            return <span key={idx}>{JSON.stringify(part)}</span>;
          }
          return <span key={idx}>{getCustomMarkdown(String(part))}</span>;
        })
      ) : (
        getCustomMarkdown(String(content))
      );
    }

    return (
      <div className="w-full">
        <div
          className={`cursor-pointer mb-1 flex items-center gap-1 ${
            !isCollapsed
              ? compact
                ? "py-0.5 px-1 rounded bg-white/85 backdrop-blur-sm text-sm"
                : "py-1 px-2 rounded bg-white/85 backdrop-blur-sm"
              : ""
          }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span
            className="transform transition-transform duration-200"
            style={{
              display: "inline-block",
              transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
            }}
          >
            ▶
          </span>
          {isCollapsed ? "Show full message" : "Collapse message"}
        </div>
        {!isCollapsed &&
          (typeof content === "string" ? (
            <span>{getCustomMarkdown(content)}</span>
          ) : Array.isArray(content) ? (
            content.map((part, idx) => {
              if (part && typeof part === "object" && "type" in part) {
                if (part.type === "text")
                  return <span key={idx}>{getCustomMarkdown(part.text)}</span>;
                if (part.type === "image")
                  return part.image instanceof URL ? (
                    <img
                      key={idx}
                      src={part.image.href}
                      alt={`image-${idx}`}
                      className="max-w-full"
                    />
                  ) : (
                    <img
                      key={idx}
                      src={part.image.toString()}
                      alt={`image-${idx}`}
                      className="max-w-full"
                    />
                  );
                // For other parts, use JSON stringification
                return <span key={idx}>{JSON.stringify(part)}</span>;
              }
              return <span key={idx}>{getCustomMarkdown(String(part))}</span>;
            })
          ) : (
            getCustomMarkdown(String(content))
          ))}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col ${
        role === "user" ? "items-end" : "items-start"
      } ${compact ? "text-sm" : ""}`}
    >
      {!compact && showRole && (
        <span className={`mb-1 ${compact ? "text-xs" : "text-sm"}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      )}
      <div className={`${bubblePadding} rounded-lg ${bubbleColor}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageBubble;
