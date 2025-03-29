import { AssistantContent, ToolContent, UserContent } from "ai";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import remarkGfm from "remark-gfm";

// Define a type for our combined tool call and result
export type CombinedToolPart = {
  type: "combined-tool";
  toolName: string;
  args: any;
  toolCallId: string;
  result: any;
};

export type ContentType =
  | UserContent
  | ToolContent
  | AssistantContent
  | CombinedToolPart;

type ContentRendererProps = {
  content: ContentType;
};

// Constants for think markers
const THINK_START = "<think>";
const THINK_END = "</think>";

export const getCustomMarkdown = (content: string) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
          <a
            href={href}
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        ),
        li: ({ children }) => (
          <li className="my-1 break-words whitespace-normal">{children}</li>
        ),
        code: ({ children }) => (
          <code className="bg-gray-200/85 text-gray-700 px-1 py-0.5 rounded-sm">
            {children}
          </code>
        ),
        table: ({ node, ...props }) => (
          <table className="w-full border-collapse" {...props} />
        ),
        thead: ({ node, ...props }) => (
          <thead className="border-b border-gray-400" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-gray-500" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="whitespace-pre-line" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Helper to render a text string; if it starts with a think tag, process it specially.
export const renderTextContent = (text: string) => {
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

// Component for handling the collapsible think content with the specified bg and text colors.
export const ThinkCollapsible = ({
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

// Component for displaying tool calls in a collapsible format
export const ToolCallCollapsible = ({
  toolName,
  args,
  toolCallId,
}: {
  toolName: string;
  args: any;
  toolCallId: string;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <div className="w-full">
      <div
        className={`cursor-pointer mb-1 flex items-center gap-1`}
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
        <span className="font-mono">Function: {toolName}</span>
      </div>
      {!isCollapsed && (
        <div className="p-2 rounded bg-[#2a2a2a] font-mono text-sm">
          <div>Tool ID: {toolCallId}</div>
          <div className="mt-1">
            Arguments:
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for displaying tool results in a collapsible format
export const ToolResultCollapsible = ({
  result,
  toolCallId,
  toolName,
}: {
  result: any;
  toolCallId: string;
  toolName: string;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <div className="w-full">
      <div
        className={`cursor-pointer mb-1 flex items-center gap-1`}
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
        <span className="font-mono">Result: {toolName}</span>
      </div>
      {!isCollapsed && (
        <div className="p-2 rounded bg-[#2a2a2a] font-mono text-sm">
          <div>Tool ID: {toolCallId}</div>
          <div className="mt-1">
            Result:
            <pre className="mt-1 overflow-x-auto">
              {typeof result === "string"
                ? result
                : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// New component that combines tool call and tool result
export const CombinedToolCallResultCollapsible = ({
  toolName,
  args,
  toolCallId,
  result,
}: {
  toolName: string;
  args: any;
  toolCallId: string;
  result?: any;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <div className="w-full">
      <div
        className={`cursor-pointer mb-1 flex items-center gap-1`}
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
        <span className="font-mono">Tool use ({toolName})</span>
      </div>
      {!isCollapsed && (
        <div className="p-2 rounded bg-[#2a2a2a] font-mono text-xs">
          <div className="font-bold">Tool call ID:{toolCallId}</div>
          {args && (
            <div className="mt-1">
              Arguments:
              <pre className="mt-1 overflow-x-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className="mt-3 border-t border-gray-700 pt-2">
              Result:
              <pre className="mt-1 overflow-x-auto">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main content renderer component
const ContentRenderer = ({ content }: ContentRendererProps) => {
  if (typeof content === "string") {
    return renderTextContent(content);
  }

  if (Array.isArray(content)) {
    // Process the array to find tool-call and tool-result pairs
    const processedContent = [];
    let i = 0;

    while (i < content.length) {
      const currentPart = content[i];

      // Check for tool-call followed by tool-result
      if (
        i + 1 < content.length &&
        currentPart &&
        typeof currentPart === "object" &&
        "type" in currentPart &&
        currentPart.type === "tool-call"
      ) {
        const nextPart = content[i + 1];
        if (
          nextPart &&
          typeof nextPart === "object" &&
          "type" in nextPart &&
          nextPart.type === "tool-result" &&
          nextPart.toolCallId === currentPart.toolCallId
        ) {
          // Found a matching pair, combine them
          processedContent.push({
            type: "combined-tool",
            toolName: currentPart.toolName,
            args: currentPart.args,
            toolCallId: currentPart.toolCallId,
            result: nextPart.result,
            _idx: i, // For keying
          });
          i += 2; // Skip both parts
          continue;
        }
      }

      // No match, keep the part as is
      processedContent.push({
        ...currentPart,
        _idx: i, // For keying
      });
      i++;
    }

    return (
      <>
        {processedContent.map((part) => {
          const idx = part._idx;

          if (part && typeof part === "object" && "type" in part) {
            const type = part.type;

            switch (type) {
              case "text":
                if ("text" in part) {
                  return <span key={idx}>{renderTextContent(part.text)}</span>;
                }
                break;
              case "reasoning":
                if ("text" in part) {
                  return (
                    <ThinkCollapsible
                      key={idx}
                      thinkPart={
                        typeof part.text === "string"
                          ? part.text
                          : String(part.text)
                      }
                      normalPart=""
                    />
                  );
                }
                break;
              case "redacted-reasoning":
                if ("data" in part) {
                  return (
                    <ThinkCollapsible
                      key={idx}
                      thinkPart={
                        typeof part.data === "string"
                          ? "Redacted reasoning: " + part.data
                          : "Redacted reasoning: " + String(part.data)
                      }
                      normalPart=""
                    />
                  );
                }
                break;
              case "image":
                if ("image" in part) {
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
                }
                break;
              case "combined-tool":
                if ("toolName" in part && "toolCallId" in part) {
                  return (
                    <CombinedToolCallResultCollapsible
                      key={idx}
                      toolName={part.toolName}
                      args={part.args}
                      toolCallId={part.toolCallId}
                      result={part.result}
                    />
                  );
                }
                break;
              case "tool-call":
                if ("toolName" in part && "toolCallId" in part) {
                  return (
                    <ToolCallCollapsible
                      key={idx}
                      toolName={part.toolName}
                      args={part.args}
                      toolCallId={part.toolCallId}
                    />
                  );
                }
                break;
              case "tool-result":
                if (
                  "toolCallId" in part &&
                  "result" in part &&
                  "toolName" in part
                ) {
                  return (
                    <ToolResultCollapsible
                      key={idx}
                      result={part.result}
                      toolCallId={part.toolCallId}
                      toolName={part.toolName}
                    />
                  );
                }
                break;
              default:
                return <span key={idx}>{JSON.stringify(part)}</span>;
            }
          }
          return <span key={idx}>{renderTextContent(String(part))}</span>;
        })}
      </>
    );
  }

  return renderTextContent(String(content));
};

export default ContentRenderer;
