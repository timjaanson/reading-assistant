import { CoreMessage } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import MessageGroup from "./MessageGroup";
import { getStreamedTextResponse } from "../ai/ai";
import { Spinner } from "../common/Spinner";
import { MessageCollection, createMessageCollection } from "../types/chat";

type ChatProps = {
  initialMessages: MessageCollection;
  onMessagesChange?: (messages: CoreMessage[]) => void;
  systemPrompt?: string;
  initialUserMessage?: string;
  collapseInitialMessage?: boolean;
  compact?: boolean;
};

export const Chat = ({
  initialMessages,
  onMessagesChange,
  systemPrompt,
  initialUserMessage,
  collapseInitialMessage = false,
  compact = false,
}: ChatProps) => {
  const messageCollection = Array.isArray(initialMessages)
    ? createMessageCollection(initialMessages)
    : initialMessages;

  const [messages, setMessages] = useState<CoreMessage[]>(
    messageCollection.messages
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const lastCollectionIdRef = useRef<string | number | null>(
    messageCollection.id
  );

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
    const collection = Array.isArray(initialMessages)
      ? createMessageCollection(initialMessages)
      : initialMessages;

    const idChanged = collection.id !== lastCollectionIdRef.current;
    const isArray = Array.isArray(initialMessages);
    const messagesLengthChanged =
      collection.messages.length !== messages.length;

    // Update if collection ID changed, it's a new array, or messages length changed
    if (idChanged || isArray || messagesLengthChanged) {
      console.log("Message collection changed, updating chat", {
        idChanged,
        isArray,
        messagesLengthChanged,
        messageCount: collection.messages.length,
      });
      setMessages(collection.messages);
      lastCollectionIdRef.current = collection.id;
    }
  }, [initialMessages]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
      return () =>
        messagesContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      try {
        setIsLoading(true);
        setStreamedMessage("");
        const userMessage: CoreMessage = { role: "user", content: messageText };

        // Create a message array with the new user message
        const newMessages = [...messages, userMessage];

        // Update local state immediately
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

        // Important: Use the current messages state rather than the closure value
        // to ensure we don't lose any messages added while waiting for the response
        const latestMessages = [...messages, userMessage];
        const updatedMessages = [...latestMessages, ...finalResponse.messages];

        console.log(
          "Updating with AI response, total:",
          updatedMessages.length
        );
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
    },
    [messages, systemPrompt, onMessagesChange]
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const messageText = input;
    setInput("");
    await sendMessage(messageText);
  }, [input, sendMessage]);

  useEffect(() => {
    if (initialUserMessage?.trim() && messages.length === 0) {
      sendMessage(initialUserMessage);
    }
  }, [initialUserMessage, messages.length, sendMessage]);

  // Define conditional classes for messages container based on compact prop
  const messagesContainerClasses = compact
    ? "flex-1 overflow-y-auto p-2 space-y-1 bg-transparent"
    : "flex-1 overflow-y-auto p-4 space-y-4 bg-transparent";

  // Define conditional classes for input section based on compact prop
  const inputContainerClasses = compact
    ? "flex-shrink-0 bg-transparent p-1 border-t border-gray-900"
    : "flex-shrink-0 bg-transparent p-4 border-t border-gray-900";
  const inputFlexClasses = compact ? "flex space-x-1" : "flex space-x-2";
  const textareaClasses = compact
    ? "flex-1 text-gray-200 border border-gray-800 rounded-md p-1 resize-none bg-[#1f1f1f]/50 text-sm"
    : "flex-1 text-gray-200 border border-gray-800 rounded-md p-2 resize-none bg-[#1f1f1f]/50";
  const buttonClasses = compact
    ? "bg-gray-200/80 text-gray-900 rounded-md px-2 py-1 text-sm"
    : "bg-gray-200/80 text-gray-900 rounded-md px-4 py-2";

  return (
    <div className="flex flex-col h-full w-full max-w-[800px] mx-auto relative">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className={messagesContainerClasses}
        onScroll={handleScroll}
      >
        <MessageGroup
          messages={messages}
          collapseInitialMessage={collapseInitialMessage}
          compact={compact}
        />

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
          className={`absolute left-1/2 ${
            compact ? "bottom-[40px]" : "bottom-[88px]"
          } -translate-x-1/2 bg-gray-300/65 hover:bg-gray-300/80 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10`}
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
              // Prevent event propagation to stop host website shortcuts
              e.stopPropagation();

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            placeholder="Type your message"
            className={textareaClasses}
            rows={compact ? 1 : 2}
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSendMessage}
            className={buttonClasses}
          >
            {isLoading ? (
              <span className="mx-1">
                <Spinner size={5} />
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default Chat;
