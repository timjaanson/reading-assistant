import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatDb } from "../storage/chatDatabase";
import { Tooltip } from "./Tooltip";
import { SettingsStorage } from "../storage/providerSettings";
import { Provider, ProviderSettings } from "../types/settings";
import { Spinner } from "../common/Spinner";

type AnyUIPart = UIMessage["parts"][number];

export type SaveableChatValues = {
  id: string;
  chatName: string;
  messages: UIMessage[];
};

type ChatProps = {
  initialChatId?: string;
  initialChatName: string;
  initialMessages: UIMessage[];
  systemPrompt?: string;
  initialUserMessage?: string;
  collapseInitialMessage?: boolean;
  sendInitialMessage?: boolean;
  compact?: boolean;
};

export const Chat2 = ({
  initialChatId,
  initialChatName,
  initialMessages,
  systemPrompt,
  initialUserMessage,
  //collapseInitialMessage = false,
  sendInitialMessage = false,
  compact = false,
}: ChatProps) => {
  const [internalChatName, setInternalChatName] =
    useState<string>(initialChatName);
  const [isModified, setIsModified] = useState(false);
  const chatSaveValues = useRef<SaveableChatValues | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const providerIconRef = useRef<HTMLButtonElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  // This ensures useChat is reset when initialChatId changes (including undefined for new chat)
  const chatId = useMemo(() => initialChatId, [initialChatId]);

  const {
    id,
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    reload,
  } = useChat({
    id: chatId,
    initialMessages: initialMessages,
    fetch: createCustomBackgroundFetch(),
    body: {
      systemPrompt: systemPrompt,
    },
    onError(error) {
      console.error("Error in useChat", error);
      setError(error.message);
    },
  });

  const isBusy = useMemo(
    () => status === "submitted" || status === "streaming",
    [status]
  );

  useEffect(() => {
    if (initialUserMessage) {
      setMessages([{ id: "1", role: "user", content: initialUserMessage }]);
    }
  }, []);

  // Initialize or update the saved chat values reference
  useEffect(() => {
    if (id) {
      chatSaveValues.current = {
        id,
        chatName: initialChatName,
        messages: initialMessages,
      };
    }
  }, [id, initialChatName, initialMessages]);

  // Check for modifications
  useEffect(() => {
    if (chatSaveValues.current && id) {
      const nameChanged = internalChatName !== chatSaveValues.current.chatName;
      const messagesChanged =
        messages.length !== chatSaveValues.current.messages.length;

      // Check the last message content if there are messages
      let lastMessageChanged = false;
      if (messages.length > 0 && chatSaveValues.current.messages.length > 0) {
        const lastCurrent = messages[messages.length - 1];
        const lastSaved =
          chatSaveValues.current.messages[
            chatSaveValues.current.messages.length - 1
          ];
        lastMessageChanged =
          lastCurrent.parts.length !== lastSaved.parts.length;
      }

      setIsModified(nameChanged || messagesChanged || lastMessageChanged);
    }
  }, [id, internalChatName, messages]);

  useEffect(() => {
    if (sendInitialMessage && initialUserMessage && messages.length === 1) {
      reload();
    }
  }, [sendInitialMessage, initialUserMessage, messages, reload]);

  useEffect(() => {
    if (!isBusy && status === "ready" && messages.length > 0 && isModified) {
      saveChat();
    }
  }, [isBusy, status, messages, isModified]);

  // Update internal chat name when initialChatName changes
  useEffect(() => {
    setInternalChatName(initialChatName);
  }, [initialChatName]);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadProviderSettings();
      setProviderSettings(settings);
    };
    loadSettings();
  }, []);

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
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
      return () =>
        messagesContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const submitMessageHandler = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      setError(null);
      e.preventDefault();
      handleSubmit(e as any);
    },
    [handleSubmit]
  );

  const saveChat = useCallback(async () => {
    if (!id || messages.length === 0) return;

    try {
      await chatDb.saveChat({
        id,
        name: internalChatName,
        url: "",
        messages,
      });

      // Update saved values ref to track changes
      chatSaveValues.current = {
        id,
        chatName: internalChatName,
        messages: [...messages],
      };

      setIsModified(false);
      console.log(`Saved chat with ID: ${id}`);
    } catch (error) {
      console.error("Error saving chat:", error);
      setError(error instanceof Error ? error.message : "Failed to save chat");
    }
  }, [id, internalChatName, messages]);

  const renderMessagePart = (part: AnyUIPart) => {
    switch (part.type) {
      case "text":
        return <div>{part.text}</div>;
      default:
        return <div>Unsupported part type: {part.type}</div>;
    }
  };

  const handleProviderSelect = async (index: number | null) => {
    try {
      const newSettings = await SettingsStorage.setActiveProvider(index);
      setProviderSettings(newSettings);
    } catch (error) {
      console.error("Failed to set active provider:", error);
    }
    setShowProviderDropdown(false);
  };

  const getProviderDisplayName = (provider: Provider) => {
    return provider.name || provider.provider;
  };

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
        {messages.map((message) => (
          <div key={message.id} className="mb-2">
            <strong>{message.role === "user" ? "User: " : "AI: "}</strong>
            <div>
              {message.parts &&
                message.parts.map((part) => renderMessagePart(part))}
            </div>
          </div>
        ))}
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
        <form onSubmit={submitMessageHandler}>
          <div className={inputFlexClasses}>
            <div className="relative w-full flex">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitMessageHandler(e as any);
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
                      className="absolute right-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto p-2 bg-black/95 text-xs text-gray-200 rounded shadow-lg z-20"
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
                                providerSettings.active?.model ===
                                  provider.model
                                  ? "bg-gray-200/10 font-semibold"
                                  : ""
                              }`}
                            >
                              {provider.model} (
                              {getProviderDisplayName(provider)})
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" disabled={isBusy} className={buttonClasses}>
              {isBusy ? (
                <span className="mx-1">
                  <Spinner size={5} />
                </span>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
      </div>
      <div>
        {/* error message */}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
};
