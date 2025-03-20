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
          <ol className="py-1 pl-3 list-decimal break-words whitespace-normal">
            {children}
          </ol>
        ),
        ul: ({ children }) => (
          <ul className="py-1 pl-3 list-disc break-words whitespace-normal">
            {children}
          </ul>
        ),
        a: ({ children, href, ...props }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        ),
        li: ({ children }) => (
          <li className="my-1 break-words whitespace-normal">{children}</li>
        ),
        code: ({ children }) => (
          <code className="bg-gray-200/85 text-gray-700 p-1">{children}</code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// New constants for think markers
const THINK_START = "<think>";
const THINK_END = "</think>";

// Helper to render a text string; if it starts with a think tag, process it specially.
const renderTextContent = (text: string) => {
  if (text.startsWith(THINK_START)) {
    return renderThinkContent(text);
  }
  return getCustomMarkdown(text);
};

// Helper to extract the think part and any normal content that follows.
const renderThinkContent = (text: string) => {
  const startIndex = 0;
  //include THINK_START AND THINK_END in the thinkPart
  const endTagIndex = text.indexOf(THINK_END);
  if (endTagIndex !== -1) {
    const thinkPart = text.substring(
      startIndex,
      endTagIndex + THINK_END.length
    );
    const normalPart = text.substring(endTagIndex + THINK_END.length);
    return <ThinkCollapsible thinkPart={thinkPart} normalPart={normalPart} />;
  } else {
    const thinkPart = text.substring(startIndex);
    return <ThinkCollapsible thinkPart={thinkPart} normalPart="" />;
  }
};

// New component for handling the collapsible think content with the specified bg and text colors.
const ThinkCollapsible = ({
  thinkPart,
  normalPart,
  compact = false,
}: {
  thinkPart: string;
  normalPart: string;
  compact?: boolean;
}) => {
  const [isThinkCollapsed, setIsThinkCollapsed] = useState(true);
  return (
    <div className="w-full">
      <div
        className={`cursor-pointer mb-1 flex items-center gap-1 ${
          !isThinkCollapsed
            ? compact
              ? "rounded text-sm"
              : "py-0.5 px-1 rounded"
            : ""
        }`}
        onClick={() => setIsThinkCollapsed(!isThinkCollapsed)}
      >
        <span
          className="transform transition-transform duration-200"
          style={{
            display: "inline-block",
            transform: isThinkCollapsed ? "rotate(0deg)" : "rotate(90deg)",
          }}
        >
          ▶
        </span>
        {isThinkCollapsed ? "Show reasoning" : "Hide reasoning"}
      </div>
      {!isThinkCollapsed && (
        <div className="p-2 rounded bg-[#1f1f1f] text-white/90">
          {getCustomMarkdown(thinkPart)}
        </div>
      )}
      {normalPart && (
        <div className="mt-2">{getCustomMarkdown(normalPart)}</div>
      )}
    </div>
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
      ? "bg-gray-200/80 text-gray-900"
      : "bg-[#1f1f1f]/85 text-white/90";

  // Use smaller padding for the main bubble if compact
  const bubblePadding = "p-2";

  // Updated renderContent to handle think messages
  const renderContent = () => {
    if (!isCollapsible) {
      return typeof content === "string" ? (
        <span>{renderTextContent(content)}</span>
      ) : Array.isArray(content) ? (
        content.map((part, idx) => {
          if (part && typeof part === "object" && "type" in part) {
            if (part.type === "text")
              return <span key={idx}>{renderTextContent(part.text)}</span>;
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
          return <span key={idx}>{renderTextContent(String(part))}</span>;
        })
      ) : (
        renderTextContent(String(content))
      );
    }

    return (
      <div className={`w-full`}>
        <div
          className={`cursor-pointer mb-1 flex items-center gap-1 ${
            !isCollapsed
              ? compact
                ? "rounded bg-white/85 backdrop-blur-sm text-sm"
                : "py-0.5 px-1 rounded bg-white/85 backdrop-blur-sm"
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
            <span>{renderTextContent(content)}</span>
          ) : Array.isArray(content) ? (
            content.map((part, idx) => {
              if (part && typeof part === "object" && "type" in part) {
                if (part.type === "text")
                  return <span key={idx}>{renderTextContent(part.text)}</span>;
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
              return <span key={idx}>{renderTextContent(String(part))}</span>;
            })
          ) : (
            renderTextContent(String(content))
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
