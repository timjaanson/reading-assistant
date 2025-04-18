import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "../common/Spinner";
import { ToolInvocation } from "@ai-sdk/ui-utils";

type CollapsibleSectionProps = {
  children: React.ReactNode;
  textColor: string;
  openText?: string;
  closeText?: string;
  openIcon?: string;
  closeIcon?: string;
  initialCollapsed?: boolean;
};

export const CollapsableSection = ({
  children,
  textColor,
  openText = "Show message",
  closeText = "Close message",
  openIcon = "→",
  closeIcon = "↓",
  initialCollapsed = true,
}: CollapsibleSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div
        className={`flex items-center cursor-pointer mb-1 ${textColor}`}
        onClick={toggleCollapse}
      >
        <span className="mr-1">{isCollapsed ? openIcon : closeIcon}</span>
        <span>{isCollapsed ? openText : closeText}</span>
      </div>
      {!isCollapsed && children}
    </>
  );
};

export const TextPartRenderer = ({
  content,
  textColor,
}: {
  content: string;
  textColor: string;
}) => {
  return (
    <div className={`${textColor}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ol: ({ children }) => (
            <ol
              className={`py-1 pl-3 list-decimal break-words whitespace-normal ${textColor}`}
            >
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul
              className={`py-1 pl-3 list-disc break-words whitespace-normal ${textColor}`}
            >
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
            <li className={`my-1 break-words whitespace-normal ${textColor}`}>
              {children}
            </li>
          ),
          code: ({ children }) => (
            <code className="bg-gray-200/85 text-gray-700 px-1 py-0.5 rounded-sm">
              {children}
            </code>
          ),
          table: ({ node, ...props }) => (
            <table
              className={`w-full border-collapse ${textColor}`}
              {...props}
            />
          ),
          thead: ({ node, ...props }) => (
            <thead
              className={`border-b border-gray-400 ${textColor}`}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className={`border border-gray-500 ${textColor}`} {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className={`whitespace-pre-line ${textColor}`} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const ReasoningPartRenderer = ({
  content,
  textColor,
}: {
  content: string;
  textColor: string;
}) => {
  return (
    <CollapsableSection
      openText="Show reasoning"
      closeText="Hide reasoning"
      textColor={textColor}
    >
      <TextPartRenderer content={content} textColor={textColor} />
    </CollapsableSection>
  );
};

export const ToolPartRenderer = ({
  toolInvocation,
  textColor,
}: {
  toolInvocation: ToolInvocation;
  textColor: string;
}) => {
  const { state, toolName, toolCallId, args } = toolInvocation;
  const isLoading = state === "partial-call" || state === "call";

  const openText = `Show tool (${toolName})${isLoading ? " " : ""}`;
  const closeText = `Hide tool (${toolName})${isLoading ? " " : ""}`;

  return (
    <CollapsableSection
      openText={openText}
      closeText={closeText}
      textColor={textColor}
    >
      <div className={`mt-2 font-mono ${textColor}`}>
        {isLoading && <Spinner />}

        {(state === "call" || state === "result") && (
          <>
            <div className="mb-1">
              <span className="font-semibold">Tool ID:</span> {toolCallId}
            </div>
            <div>
              <div className="font-semibold mb-1">Arguments:</div>
              <pre
                className={`bg-gray-800/50 p-1 rounded overflow-auto text-xs`}
              >
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          </>
        )}

        {state === "result" && (
          <div className="mt-3">
            <div className="font-semibold mb-1">Result:</div>
            <pre className={`bg-gray-800/50 p-1 rounded overflow-auto text-xs`}>
              {JSON.stringify((toolInvocation as any).result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </CollapsableSection>
  );
};
