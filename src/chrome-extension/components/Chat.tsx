import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageRenderer } from "./MessageRenderer";
import { StopIndicator } from "../common/icons/StopIndicator";
import { LoadingDots } from "../common/icons/LoadingDots";
import { ChatBehaviorProps } from "../types/chat";
import { SendIcon } from "../common/icons/Send";
import { chatDbProxy } from "../storage/wrappers";
import { Button } from "../common/Button";
import { ProviderQuickSelect } from "./ProviderQuickSelect";

export type SaveableChatValues = {
  id: string;
  chatName: string;
  messages: UIMessage[];
};

type ChatProps = ChatBehaviorProps & {
  initialChatId?: string;
  pageUrl?: URL;
  initialChatName: string;
  initialMessages: UIMessage[];
};

export const Chat = ({
  initialChatId,
  pageUrl,
  initialChatName,
  initialMessages,
  systemPrompt,
  initialUserMessage,
  collapseInitialMessage = false,
  sendInitialMessage = false,
}: ChatProps) => {
  const [internalChatName, setInternalChatName] =
    useState<string>(initialChatName);
  const [isModified, setIsModified] = useState(false);
  const chatSaveValues = useRef<SaveableChatValues | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This ensures useChat is reset when initialChatId changes (including undefined for new chat)
  const chatId = useMemo(() => initialChatId, [initialChatId]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate the number of rows based on scrollHeight and line height
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const padding =
      parseInt(getComputedStyle(textarea).paddingTop) +
      parseInt(getComputedStyle(textarea).paddingBottom);
    const minHeight = lineHeight + padding; // Height for 1 row
    const maxHeight = lineHeight * 3 + padding; // Height for 3 rows

    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(newHeight, minHeight)}px`;
  }, []);

  const {
    id,
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
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

  // Check if scroll button should be shown
  const updateScrollButtonVisibility = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      // Only show button if content exceeds container height and we're not at the bottom
      const hasScrollableContent = scrollHeight > clientHeight;
      const isScrolledAway = scrollHeight - scrollTop - clientHeight > 50;
      setShowScrollButton(hasScrollableContent && isScrolledAway);
    }
  }, []);

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
    if (
      sendInitialMessage &&
      status === "ready" &&
      initialUserMessage &&
      messages.length === 1
    ) {
      reload();
    }
  }, [sendInitialMessage, status, initialUserMessage, messages, reload]);

  useEffect(() => {
    if (!isBusy && status === "ready" && messages.length > 0 && isModified) {
      saveChat();
    }
  }, [isBusy, status, messages, isModified]);

  // Update internal chat name when initialChatName changes
  useEffect(() => {
    setInternalChatName(initialChatName);
  }, [initialChatName]);

  // Set up observers to detect content changes
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    // Handle scroll events
    const handleScroll = () => updateScrollButtonVisibility();
    messagesContainer.addEventListener("scroll", handleScroll);

    // Create a resize observer to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      updateScrollButtonVisibility();
    });
    resizeObserver.observe(messagesContainer);

    // Create a mutation observer to detect DOM changes (like collapsing sections)
    const mutationObserver = new MutationObserver(() => {
      updateScrollButtonVisibility();
    });

    mutationObserver.observe(messagesContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Initial check
    updateScrollButtonVisibility();

    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollButtonVisibility]);

  // Update button visibility when messages change
  useEffect(() => {
    // Small delay to let the DOM update
    const timeoutId = setTimeout(updateScrollButtonVisibility, 0);
    return () => clearTimeout(timeoutId);
  }, [messages, updateScrollButtonVisibility]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Adjust textarea height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const submitMessageHandler = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      setError(null);
      e.preventDefault();
      handleSubmit(e as any, {
        experimental_attachments: files,
      });

      // Reset files after submission
      setFiles(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleSubmit, files]
  );

  const saveChat = useCallback(async () => {
    if (!id || messages.length === 0) return;

    try {
      await chatDbProxy.saveChat({
        id,
        name: internalChatName,
        url: pageUrl ? pageUrl.toString() : undefined,
        messages,
      });

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
  }, [id, internalChatName, messages, pageUrl]);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="text-sm flex flex-col h-full w-full mx-auto relative">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 bg-transparent"
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <MessageRenderer
              message={message}
              collapsableMessage={index === 0 ? collapseInitialMessage : false}
            />
          </div>
        ))}
      </div>

      {showScrollButton && (
        <div
          onClick={scrollToBottom}
          className="absolute left-1/2 bottom-[40px] -translate-x-1/2 bg-gray-300/65 hover:bg-gray-300/80 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          ↓
        </div>
      )}

      {/* Input Container */}
      <div className="shrink-0 bg-transparent p-1 border-t border-gray-900">
        <form onSubmit={submitMessageHandler}>
          <div className="flex items-center space-x-1">
            <div className="relative w-full flex text-sm">
              <textarea
                ref={textareaRef}
                disabled={isBusy}
                value={input}
                onChange={(e) => {
                  handleInputChange(e);
                  adjustTextareaHeight();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitMessageHandler(e as any);
                  } else if (e.key === "Enter" && e.shiftKey) {
                    adjustTextareaHeight();
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                placeholder={isBusy ? "" : "Type your message"}
                className="flex-1 text-gray-200 border border-gray-800 rounded-md py-2 px-3 resize-none scrollbar-none bg-[#1f1f1f]/50 text-sm w-full pr-6"
                rows={1}
              />
              {isBusy && (
                <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none">
                  <LoadingDots size={2} backgroundColor="bg-gray-200" />
                </div>
              )}
              <button
                type="button"
                onClick={handleFileButtonClick}
                disabled={isBusy}
                className="absolute text-md cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-100 transition-colors"
              >
                +
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(e.target.files);
                  }
                }}
              />
            </div>

            <ProviderQuickSelect disabled={isBusy} />

            <Button
              type={isBusy ? "button" : "submit"}
              onClick={isBusy ? () => stop() : undefined}
            >
              <span className="mx-1 flex items-center justify-center">
                {isBusy ? <StopIndicator /> : <SendIcon />}
              </span>
            </Button>
          </div>
        </form>
      </div>
      <div>
        {error && (
          <div className="text-red-500 overflow-y-auto break-all">{error}</div>
        )}
      </div>
    </div>
  );
};
