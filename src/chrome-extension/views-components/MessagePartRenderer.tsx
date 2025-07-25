import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "../common/icons/Spinner";
import { ToolInvocation } from "@ai-sdk/ui-utils";

import { CodeBox } from "./CodeBox";
const TEXT_COLLAPSE_THRESHOLD = 500;

type CollapsibleSectionProps = {
  children: React.ReactNode;
  textColor: string;
  openText?: React.ReactNode;
  closeText?: React.ReactNode;
  openIcon?: string;
  closeIcon?: string;
  initialCollapsed?: boolean;
};

export const CollapsableSection = ({
  children,
  textColor,
  openText = "Show message",
  closeText = "Close message",
  openIcon = "▶︎",
  closeIcon = "▼︎",
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
  collapsable = false,
}: {
  content: string;
  textColor: string;
  collapsable?: boolean;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    collapsable && content?.length > TEXT_COLLAPSE_THRESHOLD
  );
  const displayContent =
    isCollapsed && content?.length > TEXT_COLLAPSE_THRESHOLD
      ? content.substring(0, TEXT_COLLAPSE_THRESHOLD) + "..."
      : content;

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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className={`px-1 py-0.5 bg-black/10 dark:bg-black/30 rounded ${textColor}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBox code={String(children).trim()} />;
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          table: ({ node, ...props }) => (
            <div className="max-w-full overflow-x-auto p-2 scrollbar scrollbar-thumb-muted scrollbar-track-background">
              <table
                className={`border-collapse ${textColor} w-max`}
                {...props}
              />
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          thead: ({ node, ...props }) => (
            <thead
              className={`border-b border-gray-500 ${textColor}`}
              {...props}
            />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          th: ({ node, ...props }) => (
            <th className={`p-3 font-bold ${textColor}`} {...props} />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          tr: ({ node, children, ...props }) => (
            <tr
              className={`border-b border-gray-500 last:border-b-0 ${textColor}`}
              {...props}
            >
              {children}
            </tr>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          td: ({ node, ...props }) => (
            <td className={`p-3 max-w-48 ${textColor}`} {...props} />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          p: ({ node, ...props }) => (
            <p
              className={`whitespace-pre-line break-words ${textColor}`}
              {...props}
            />
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>

      {collapsable && content?.length > TEXT_COLLAPSE_THRESHOLD && (
        <div
          className={`flex items-center cursor-pointer mt-1 font-bold ${textColor}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="mr-1">{isCollapsed ? "▶︎" : "▲︎"}</span>
          <span>{isCollapsed ? "Show full content" : "Hide long content"}</span>
        </div>
      )}
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

  const openText = (
    <div className="flex items-center gap-2">
      <span>{`Show tool (${toolName})`}</span>
      {isLoading && <Spinner />}
    </div>
  );

  const closeText = (
    <div className="flex items-center gap-2">
      <span>{`Hide tool (${toolName})`}</span>
      {isLoading && <Spinner />}
    </div>
  );

  return (
    <CollapsableSection
      openText={openText}
      closeText={closeText}
      textColor={textColor}
    >
      <div className={`mt-2 font-mono ${textColor} overflow-visible`}>
        {(state === "call" || state === "result") && (
          <>
            <div className="mb-1">
              <span className="font-semibold">Call ID:</span> {toolCallId}
            </div>
            <div>
              <div className="font-semibold mb-1">Arguments:</div>
              <div className="max-h-40 max-w-full overflow-auto">
                <CodeBox code={JSON.stringify(args, null, 2)} />
              </div>
            </div>
          </>
        )}

        {state === "result" && (
          <div className="mt-3">
            <div className="font-semibold mb-1">Result:</div>
            <div className="max-h-56 max-w-full overflow-auto">
              <CodeBox
                code={JSON.stringify(
                  (toolInvocation.state === "result"
                    ? toolInvocation
                    : { result: "No result" }
                  ).result,
                  null,
                  2
                )}
              />
            </div>
          </div>
        )}
      </div>
    </CollapsableSection>
  );
};

export const FilePartRenderer = ({
  mimeType,
  data,
  textColor,
}: {
  mimeType: string;
  data: string;
  textColor: string;
}) => {
  if (mimeType.startsWith("image/")) {
    return (
      <div className="mt-2">
        <img
          src={`data:${mimeType};base64,${data}`}
          alt="File content"
          className="max-w-full rounded-sm"
        />
      </div>
    );
  }

  return (
    <div className={`mt-2 ${textColor}`}>
      <div className="text-sm">File: {mimeType}</div>
      <div className="text-xs">Content not displayable</div>
    </div>
  );
};

export const SourcePartRenderer = ({
  source,
  textColor,
}: {
  source: {
    id: string;
    url: string;
    title?: string;
  };
  textColor: string;
}) => {
  let displayName = source.title || "Source";

  try {
    if (!source.title && source.url) {
      const url = new URL(source.url);
      displayName = url.hostname || url.pathname || source.url;
    }
  } catch (e) {
    console.error("Error in SourcePartRenderer:", e);
    displayName = source.title || source.url || "Source";
  }

  return (
    <span
      className={`${textColor} text-sm px-2 py-1 rounded-lg bg-black/20 inline-flex items-center`}
    >
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${textColor} hover:underline`}
      >
        {displayName}
      </a>
    </span>
  );
};
