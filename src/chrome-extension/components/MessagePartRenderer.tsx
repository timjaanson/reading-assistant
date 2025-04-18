import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "../common/icons/Spinner";
import { ToolInvocation } from "@ai-sdk/ui-utils";
import { CodeBlock } from "./CodeBlock";

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
          code: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          table: ({ node, ...props }) => (
            <div className="max-w-full overflow-x-auto p-2">
              <table
                className={`border-collapse ${textColor} w-max`}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className={`border-b border-gray-500 ${textColor}`}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th className={`p-3 font-bold ${textColor}`} {...props} />
          ),
          tr: ({ node, children, ...props }) => (
            <tr
              className={`border-b border-gray-500 last:border-b-0 ${textColor}`}
              {...props}
            >
              {children}
            </tr>
          ),
          td: ({ node, ...props }) => (
            <td className={`p-3 max-w-48 ${textColor}`} {...props} />
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

  const spinnerColorCode = useMemo(() => {
    const colorCode = textColor.split("text-")[1];
    return colorCode;
  }, [textColor]);

  const openText = (
    <div className="flex items-center gap-2">
      <span>{`Show tool (${toolName})`}</span>
      {isLoading && <Spinner color={spinnerColorCode} />}
    </div>
  );

  const closeText = (
    <div className="flex items-center gap-2">
      <span>{`Hide tool (${toolName})`}</span>
      {isLoading && <Spinner color={spinnerColorCode} />}
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
                <CodeBlock>{JSON.stringify(args, null, 2)}</CodeBlock>
              </div>
            </div>
          </>
        )}

        {state === "result" && (
          <div className="mt-3">
            <div className="font-semibold mb-1">Result:</div>
            <div className="max-h-56 max-w-full overflow-auto">
              <CodeBlock>
                {JSON.stringify((toolInvocation as any).result, null, 2)}
              </CodeBlock>
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
          className="max-w-full rounded"
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
