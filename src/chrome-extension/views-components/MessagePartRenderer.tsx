import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "../common/icons/Spinner";

import { CodeBox } from "./CodeBox";
import {
  DynamicToolUIPart,
  SourceDocumentUIPart,
  SourceUrlUIPart,
  ToolUIPart,
} from "ai";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
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
      {!isCollapsed && (
        <Card className="dark:bg-black/10">
          <CardContent>{children}</CardContent>
        </Card>
      )}
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
              className={`py-1 pl-2 ml-2 list-decimal whitespace-normal ${textColor}`}
            >
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul
              className={`py-1 pl-2 ml-2 list-disc whitespace-normal ${textColor}`}
            >
              {children}
            </ul>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="text-blue-500 hover:underline break-all-words"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          li: ({ children }) => (
            <li className={`my-0.5 whitespace-normal ${textColor}`}>
              {children}
            </li>
          ),

          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className={`px-1 py-0.5 break-all-words bg-black/10 dark:bg-black/30 rounded ${textColor}`}
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
            <div className="max-w-full overflow-x-auto p-1 scrollbar scrollbar-thumb-muted scrollbar-track-background">
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
            <th className={`p-2 font-bold ${textColor}`} {...props} />
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
            <td className={`p-2 max-w-48 ${textColor}`} {...props} />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          p: ({ node, ...props }) => (
            <p
              className={`whitespace-pre-wrap break-all-words ${textColor}`}
              {...props}
            />
          ),
          hr: ({ node, ...props }) => <hr className={"my-2"} {...props} />,
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
  return <TextPartRenderer content={content} textColor={textColor} />;
};

export const ToolPartRenderer = ({
  toolInvocation,
  textColor,
}: {
  toolInvocation: ToolUIPart | DynamicToolUIPart;
  textColor: string;
}) => {
  const { state, type, toolCallId, input } = toolInvocation;
  let displayName: string = type;
  if (type === "dynamic-tool") {
    displayName = toolInvocation.toolName;
  }

  const isLoading = state === "input-streaming" || state === "input-available";

  const openText = (
    <div className="flex items-center gap-2">
      <span>{`Show (${displayName})`}</span>
      {isLoading && <Spinner />}
    </div>
  );

  const closeText = (
    <div className="flex items-center gap-2">
      <span>{`Hide (${displayName})`}</span>
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
        {(state === "input-available" ||
          state === "output-error" ||
          state === "output-available") && (
          <>
            <div className="mb-1">
              <span className="font-semibold">Call ID:</span> {toolCallId}
            </div>
            <div>
              <div className="font-semibold mb-1">Arguments:</div>
              <div className="max-h-48 max-w-full overflow-auto">
                <CodeBox code={JSON.stringify(input, null, 2)} />
              </div>
            </div>
          </>
        )}

        {state === "output-available" && (
          <div className="mt-3">
            <div className="font-semibold mb-1">Result:</div>
            <div className="max-h-72 max-w-full overflow-auto">
              <CodeBox
                code={JSON.stringify(
                  (toolInvocation.state === "output-available"
                    ? toolInvocation
                    : { result: "No result" }
                  ).output,
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
  source: SourceUrlUIPart | SourceDocumentUIPart;
  textColor: string;
}) => {
  const isUrl = source.type === "source-url";

  // displayName: url or filename -> title -> "unnamed"
  const displayName = isUrl
    ? source.url || source.title || "unnamed"
    : source.filename || source.title || "unnamed";

  // icon choice
  const Icon = isUrl
    ? LinkIcon
    : source.mediaType?.startsWith("image/")
    ? ImageIcon
    : FileText;

  return (
    <span
      className={`${textColor} text-sm px-2 py-1 rounded-lg bg-black/20 inline-flex items-center`}
    >
      <Icon className="w-4 h-4 mr-1" />
      {isUrl ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${textColor} hover:underline`}
        >
          {displayName}
        </a>
      ) : (
        <span className={`${textColor}`}>{displayName}</span>
      )}
    </span>
  );
};
