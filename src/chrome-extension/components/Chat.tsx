import { CoreMessage } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import MessageGroup from "./MessageGroup";
import { Spinner } from "../common/Spinner";
import { MessageCollection, createMessageCollection } from "../types/chat";
import {
  AI_STREAM_CHUNK,
  AI_STREAM_END,
  AI_STREAM_ERROR,
  AI_STREAM_PORT_NAME,
  AiStreamEndPayload,
  AiStreamErrorPayload,
  GET_AI_STREAM,
  GetAiStreamPayload,
  isAiStreamMessage,
} from "../types/ai-extension-messaging";

type ChatProps = {
  initialMessages: MessageCollection;
  onMessagesChange?: (messages: CoreMessage[]) => void;
  systemPrompt?: string;
  initialUserMessage?: string;
  collapseInitialMessage?: boolean;
  sendInitialMessage?: boolean;
  compact?: boolean;
};

export const Chat = ({
  initialMessages,
  onMessagesChange,
  systemPrompt,
  initialUserMessage,
  collapseInitialMessage = false,
  sendInitialMessage = false,
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
  const portRef = useRef<chrome.runtime.Port | null>(null);

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

  useEffect(() => {
    return () => {
      if (portRef.current) {
        console.log("Disconnecting port on unmount");
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(
    (messageText: string) => {
      if (isLoading) {
        console.warn("sendMessage called while already loading");
        return;
      }

      try {
        setIsLoading(true);
        setStreamedMessage("");
        setError(null);
        const userMessage: CoreMessage = { role: "user", content: messageText };

        // Create the array to be sent, including the new user message
        const messagesToSend = [...messages, userMessage];

        // Schedule the state update using the functional form
        // This updates the UI state correctly based on the previous state
        setMessages((currentMessages) => [...currentMessages, userMessage]);

        // Disconnect previous port if it exists
        if (portRef.current) {
          console.log("Disconnecting existing port before new request");
          portRef.current.disconnect();
        }

        portRef.current = chrome.runtime.connect({ name: AI_STREAM_PORT_NAME });
        console.log("Port connected", portRef.current);

        let accumulatedStream = "";
        let finalAiMessages: CoreMessage[] = [];

        portRef.current.onMessage.addListener((message: unknown) => {
          console.log(
            "Received message from extension background script:",
            message
          );
          if (!isAiStreamMessage(message)) {
            console.warn("Received invalid message format:", message);
            return;
          }

          switch (message.type) {
            case AI_STREAM_CHUNK:
              accumulatedStream += message.payload;
              setStreamedMessage(accumulatedStream);
              break;
            case AI_STREAM_END:
              const endPayload = message.payload as AiStreamEndPayload; // Type assertion
              finalAiMessages = endPayload.messages;
              setMessages((currentMessages) => [
                ...currentMessages,
                ...finalAiMessages,
              ]);
              onMessagesChange?.([...messagesToSend, ...finalAiMessages]);
              setStreamedMessage("");
              setIsLoading(false);
              console.log(
                "Stream ended, updated messages count:",
                messagesToSend.length + finalAiMessages.length
              );
              portRef.current = null; // Port disconnects itself on end/error
              break;
            case AI_STREAM_ERROR:
              const errorPayload = message.payload as AiStreamErrorPayload; // Type assertion
              const errorMessage =
                typeof errorPayload === "string"
                  ? errorPayload
                  : JSON.stringify(errorPayload);
              setError(errorMessage || "Unknown error");
              setIsLoading(false);
              setStreamedMessage("");
              console.error("AI_STREAM_ERROR received:", message.payload);
              portRef.current = null; // Port disconnects itself on end/error
              break;
            default:
              // This case should ideally not be reached due to isAiStreamMessage check
              // but we keep it for robustness.
              console.warn(
                "Received unknown message type:",
                (message as any).type
              );
          }
        });

        portRef.current.onDisconnect.addListener(() => {
          console.log("Port disconnected.");
          if (isLoading) {
            setError("Connection to background script lost unexpectedly.");
            setIsLoading(false);
            setStreamedMessage("");
          }
          portRef.current = null;
        });

        // Send the message to the background script using the correctly constructed array
        console.log("Sending GET_AI_STREAM to background", {
          messages: messagesToSend,
          systemPrompt,
        });
        const messageToSend: {
          type: typeof GET_AI_STREAM;
          payload: GetAiStreamPayload;
        } = {
          type: GET_AI_STREAM,
          payload: { messages: messagesToSend, systemPrompt },
        };
        portRef.current.postMessage(messageToSend);
      } catch (error) {
        console.error("Error initiating AI stream connection:", error);
        if (error instanceof Error) {
          setError(`Initiation error: ${error.message}`);
        } else {
          setError(
            `An unknown error occurred during initiation: ${JSON.stringify(
              error
            )}`
          );
        }
        setIsLoading(false);
        if (portRef.current) {
          portRef.current.disconnect();
          portRef.current = null;
        }
      }
    },
    [messages, systemPrompt, onMessagesChange, isLoading]
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const messageText = input;
    setInput("");
    sendMessage(messageText);
  }, [input, sendMessage, isLoading]);

  useEffect(() => {
    if (
      initialUserMessage?.trim() &&
      messages.length === 0 &&
      !isLoading &&
      !portRef.current
    ) {
      if (sendInitialMessage) {
        console.log("Sending initial user message");
        sendMessage(initialUserMessage);
      } else {
        console.log(
          "Not sending initial user message, only adding to messages"
        );
        setMessages([{ role: "user", content: initialUserMessage }]);
      }
    }
  }, [initialUserMessage, messages.length, sendMessage, isLoading]);

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
    <div className="flex flex-col h-full w-full mx-auto relative">
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

        {isLoading && streamedMessage && (
          <MessageBubble
            role="assistant"
            content={streamedMessage}
            showRole={
              messages.length === 0 ||
              messages[messages.length - 1]?.role !== "assistant"
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

        {/* error whitespacing so everything is always shown and wrapped even if no good place to wrap like different words */}
        {error && (
          <div className="w-full break-all whitespace-normal text-red-500 mt-2 text-sm">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
