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
};

const getCustomMarkdown = (content: string) => {
  return (
    <ReactMarkdown
      components={{
        ol: ({ children }) => (
          <ol className="py-2 pl-6 list-decimal">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="py-2 pl-6 list-disc">{children}</ul>
        ),
        li: ({ children }) => <li className="my-1">{children}</li>,
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
}: MessageBubbleProps) => {
  const [isCollapsed, setIsCollapsed] = useState(isCollapsible);

  // If role is "user" then use the off-white style, otherwise blue
  const bubbleColor =
    role === "user" ? "bg-gray-200 text-gray-900" : "bg-blue-500 text-white";

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
              ? `py-1 px-2 rounded ${
                  role === "user" ? "bg-gray-300" : "bg-blue-600"
                }`
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
      }`}
    >
      {showRole && <span className="text-sm mb-1">{role}</span>}
      <div className={`p-2 rounded-lg ${bubbleColor}`}>{renderContent()}</div>
    </div>
  );
};

export default MessageBubble;
