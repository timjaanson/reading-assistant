export type MessageBubbleProps = {
  role: string;
  content: string | any[]; // Refer to vercel-ai-sdk-textStreamResponse.md for details
  showRole: boolean;
};

const MessageBubble = ({ role, content, showRole }: MessageBubbleProps) => {
  // If role is "user" then use the off-white style, otherwise blue
  const bubbleColor =
    role === "user" ? "bg-gray-200 text-gray-900" : "bg-blue-500 text-white";
  return (
    <div
      className={`flex flex-col ${
        role === "user" ? "items-end" : "items-start"
      }`}
    >
      {/* Container aligning based on role */}
      {showRole && <span className="text-sm mb-1">{role}</span>}
      <div className={`p-2 rounded-lg ${bubbleColor} whitespace-pre-line`}>
        {typeof content === "string"
          ? content
          : Array.isArray(content)
          ? content.map((part, idx) => {
              if (part && typeof part === "object" && "type" in part) {
                if (part.type === "text")
                  return <span key={idx}>{part.text}</span>;
                if (part.type === "image")
                  return (
                    <img
                      key={idx}
                      src={part.image}
                      alt={`image-${idx}`}
                      className="max-w-full"
                    />
                  );
                // For other parts, use JSON stringification
                return <span key={idx}>{JSON.stringify(part)}</span>;
              }
              return <span key={idx}>{String(part)}</span>;
            })
          : String(content)}
      </div>
    </div>
  );
};

export default MessageBubble;
