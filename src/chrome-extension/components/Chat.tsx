import { CoreMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { getStreamedTextResponse } from "../ai/ai";

type ChatProps = {
  initialMessages?: CoreMessage[];
  onMessagesChange?: (messages: CoreMessage[]) => void;
  systemPrompt?: string;
  initialUserMessage?: string;
  collapseInitialMessage?: boolean;
  compact?: boolean;
};

export const Chat = ({
  initialMessages = [],
  onMessagesChange,
  systemPrompt,
  initialUserMessage,
  collapseInitialMessage = false,
  compact = false,
}: ChatProps) => {
  const [messages, setMessages] = useState<CoreMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // within 50px of bottom
      setShowScrollButton(!isAtBottom);
    }
  };

  useEffect(() => {
    console.log("messages", JSON.stringify(messages, null, 2));
  }, [messages]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
      return () =>
        messagesContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const sendMessage = async (messageText: string) => {
    try {
      setIsLoading(true);
      setStreamedMessage("");
      const userMessage: CoreMessage = { role: "user", content: messageText };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      const streamedResponse = await getStreamedTextResponse(newMessages, {
        systemPrompt: systemPrompt,
      });

      let completeText = "";
      for await (const textChunk of streamedResponse.textStream) {
        completeText += textChunk;
        setStreamedMessage(completeText);
      }

      const finalResponse = await streamedResponse.response;
      const updatedMessages = [...newMessages, ...finalResponse.messages];
      setMessages(updatedMessages);
      onMessagesChange?.(updatedMessages);
      setStreamedMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`An unknown error occurred: ${JSON.stringify(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const messageText = input;
    setInput("");
    await sendMessage(messageText);
  };

  useEffect(() => {
    if (initialUserMessage?.trim() && messages.length === 0) {
      sendMessage(initialUserMessage);
    }
  }, []);

  // Define conditional classes for messages container based on compact prop
  const messagesContainerClasses = compact
    ? "flex-1 overflow-y-auto p-2 space-y-1 bg-transparent"
    : "flex-1 overflow-y-auto p-4 space-y-4 bg-transparent";

  // Define conditional classes for input section based on compact prop
  const inputContainerClasses = compact
    ? "flex-shrink-0 bg-transparent p-[1px] border-t border-gray-300"
    : "flex-shrink-0 bg-transparent p-4 border-t border-gray-300";
  const inputFlexClasses = compact ? "flex space-x-1" : "flex space-x-2";
  const textareaClasses = compact
    ? "flex-1 border border-gray-300 rounded-md p-1 resize-none bg-white/50 text-sm"
    : "flex-1 border border-gray-300 rounded-md p-2 resize-none bg-white/50";
  const buttonClasses = compact
    ? "bg-blue-500/85 text-white rounded-md px-2 py-1 text-sm"
    : "bg-blue-500/85 text-white rounded-md px-4 py-2";

  return (
    <div className="flex flex-col h-full w-full max-w-[800px] mx-auto relative">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className={messagesContainerClasses}
        onScroll={handleScroll}
      >
        {messages.map((message, index) => {
          const showRole =
            index === 0 || messages[index].role !== messages[index - 1].role;
          return (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              showRole={showRole}
              isCollapsible={
                collapseInitialMessage && index === 0 && message.role === "user"
              }
              compact={compact}
            />
          );
        })}

        {streamedMessage && (
          <MessageBubble
            role="assistant"
            content={streamedMessage}
            showRole={
              messages.length === 0 ||
              messages[messages.length - 1].role !== "assistant"
            }
            compact={compact}
          />
        )}
      </div>

      {showScrollButton && (
        <div
          onClick={scrollToBottom}
          className="absolute left-1/2 bottom-[88px] -translate-x-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          ↓
        </div>
      )}

      {/* Input Container */}
      <div className={inputContainerClasses}>
        <div className={inputFlexClasses}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message"
            className={textareaClasses}
            rows={compact ? 1 : 2}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className={buttonClasses}
          >
            Send
          </button>
        </div>
        {isLoading && <p className="text-gray-500 mt-2 text-sm">Loading...</p>}
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default Chat;
