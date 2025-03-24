import { useState } from "react";
import ContentRenderer, { ContentType } from "./ContentRenderer";

export type MessageBubbleProps = {
  role: string;
  content: ContentType;
  showRole: boolean;
  isCollapsible?: boolean;
  compact?: boolean;
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

  return (
    <div
      className={`flex flex-col ${
        role === "user" ? "items-end" : "items-start"
      } ${compact ? "text-sm" : ""}`}
    >
      {!compact && showRole && (
        <span
          className={`mb-1 ${compact ? "text-xs" : "text-sm"} text-white/90`}
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      )}
      <div className={`${bubblePadding} rounded-lg ${bubbleColor}`}>
        {isCollapsible ? (
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
            {!isCollapsed && <ContentRenderer content={content} />}
          </div>
        ) : (
          <ContentRenderer content={content} />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
