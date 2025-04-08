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
import { SettingsStorage } from "../storage/providerSettings";
import { Provider, ProviderSettings } from "../types/settings";
import { Tooltip } from "./Tooltip";

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
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const providerIconRef = useRef<HTMLButtonElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadProviderSettings();
      setProviderSettings(settings);
    };
    loadSettings();
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

  const handleProviderSelect = async (index: number | null) => {
    try {
      const newSettings = await SettingsStorage.setActiveProvider(index);
      setProviderSettings(newSettings);
    } catch (error) {
      console.error("Failed to set active provider:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update provider"
      );
    }
    setShowProviderDropdown(false);
  };

  const getProviderDisplayName = (provider: Provider) => {
    return provider.name || provider.provider;
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showProviderDropdown &&
        providerIconRef.current &&
        !providerIconRef.current.contains(event.target as Node) &&
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProviderDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProviderDropdown]);

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
          <div className="relative w-full flex">
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
              className={`${textareaClasses} w-full pr-6`}
              rows={compact ? 1 : 2}
            />
            {providerSettings && (
              <div className="absolute top-1 right-1 z-10">
                <Tooltip
                  position="top"
                  disabled={showProviderDropdown}
                  target={
                    <button
                      ref={providerIconRef}
                      type="button"
                      onClick={() =>
                        setShowProviderDropdown(!showProviderDropdown)
                      }
                      className={`p-0.5 rounded ${
                        providerSettings.active
                          ? "text-gray-400 hover:text-gray-200"
                          : "text-red-500 hover:text-red-400"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.28a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </button>
                  }
                  className="w-auto"
                >
                  {providerSettings.active
                    ? `${providerSettings.active.model}`
                    : "None Selected"}
                </Tooltip>

                {showProviderDropdown && (
                  <div
                    ref={providerDropdownRef}
                    className="absolute right-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto p-2 bg-black/75 text-xs text-gray-200 rounded shadow-lg z-20"
                  >
                    <ul>
                      {providerSettings.all.map((provider, index) => (
                        <li
                          key={`${provider.provider}-${provider.model}-${index}`}
                        >
                          <button
                            onClick={() => handleProviderSelect(index)}
                            className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-400/20 ${
                              providerSettings.active?.provider ===
                                provider.provider &&
                              providerSettings.active?.model === provider.model
                                ? "bg-gray-200/10 font-semibold"
                                : ""
                            }`}
                          >
                            {provider.model} ({getProviderDisplayName(provider)}
                            )
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

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
