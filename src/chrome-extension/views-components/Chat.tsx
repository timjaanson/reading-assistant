import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { ToolInvocation, UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageRenderer } from "./MessageRenderer";
import { StopIndicator } from "../common/icons/StopIndicator";
import { LoadingDots } from "../common/icons/LoadingDots";
import { ChatBehaviorProps } from "../types/chat";
import { SendIcon } from "../common/icons/Send";
import { Button } from "@/components/ui/button";
import { ProviderQuickSelect } from "./ProviderQuickSelect";
import { ThemeProvider } from "../theme/theme-provider";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip } from "lucide-react";
import { File as FileIcon } from "lucide-react";
import { chatDb } from "../storage/chatDatabase";

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
  isRootComponent?: boolean;
};

// Wrapper component for when Chat is used as a root
const ChatRoot = (props: ChatProps) => {
  if (props.isRootComponent) {
    return (
      <ThemeProvider>
        <div className="h-full w-full bg-background text-foreground rounded-b-lg">
          <Chat {...props} isRootComponent={false} />
        </div>
      </ThemeProvider>
    );
  }

  return <Chat {...props} />;
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
  isRootComponent = false,
}: ChatProps) => {
  // If this is a root component, use the wrapper
  if (isRootComponent) {
    return (
      <ChatRoot
        {...{
          initialChatId,
          pageUrl,
          initialChatName,
          initialMessages,
          systemPrompt,
          initialUserMessage,
          collapseInitialMessage,
          sendInitialMessage,
          isRootComponent,
        }}
      />
    );
  }

  const [internalChatName, setInternalChatName] =
    useState<string>(initialChatName);
  const [isModified, setIsModified] = useState(false);
  const chatSaveValues = useRef<SaveableChatValues | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatId = useMemo(() => initialChatId, [initialChatId]);

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
    error,
    addToolResult,
  } = useChat({
    id: chatId,
    initialMessages: initialMessages,
    fetch: createCustomBackgroundFetch(),
    body: {
      systemPrompt: systemPrompt,
    },
  });

  const isBusy = useMemo(
    () => status === "submitted" || status === "streaming",
    [status]
  );

  useEffect(() => {
    if (error) {
      console.error("Error in useChat hook", error);
      setVisualError(error.message);

      if (status === "error" && messages.length > 0) {
        const pendingToolInvocationsFromMessages = messages
          .filter((message) =>
            message.parts.some(
              (part) =>
                part.type === "tool-invocation" &&
                part.toolInvocation.state === "call"
            )
          )
          .flatMap((message) =>
            message.parts
              .filter(
                (part) =>
                  part.type === "tool-invocation" &&
                  part.toolInvocation.state === "call"
              )
              .map(
                (part) =>
                  (part as { toolInvocation: ToolInvocation }).toolInvocation
              )
          );
        if (pendingToolInvocationsFromMessages.length > 0) {
          console.warn(
            "Attempting to fix invalid messages state. Adding errors as results for tool calls without results.",
            pendingToolInvocationsFromMessages
          );
          pendingToolInvocationsFromMessages.forEach((toolInvocation) => {
            addToolResult({
              toolCallId: toolInvocation.toolCallId,
              result:
                error.message +
                " Most likely caused by invalid arguments for tool-call or invalid tool-call in general.",
            });
          });
        }
      }
    }
  }, [error, status, messages, addToolResult]);

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

  const submitMessageHandler = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      setVisualError(null);
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
      await chatDb.saveChat({
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
    } catch (error) {
      console.error("Error saving chat:", error);
      setVisualError(
        error instanceof Error ? error.message : "Failed to save chat"
      );
    }
  }, [id, internalChatName, messages, pageUrl]);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    if (!files) return;

    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file) => {
      if (file !== fileToRemove) {
        dataTransfer.items.add(file);
      }
    });

    setFiles(dataTransfer.files);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <div className={"text-sm flex flex-col h-full w-full mx-auto relative"}>
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

      {/* Selected Files Indicator */}
      {files && files.length > 0 && (
        <div className="flex flex-wrap gap-2 py-1 px-2">
          {Array.from(files).map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="inline-flex gap-1 items-center bg-card/80 rounded-md px-2 py-1 text-xs"
            >
              <FileIcon size={8} className="text-foreground" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(file)}
                className="ml-2"
                aria-label="Remove file"
              >
                <span className="text-foreground cursor-pointer">×</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showScrollButton && (
        <div
          onClick={scrollToBottom}
          className="absolute left-1/2 bottom-[50px] -translate-x-1/2 text-foreground bg-card/50 hover:bg-card rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          ↓
        </div>
      )}

      {/* Input Container */}
      <div className="shrink-0 bg-transparent p-1 border-t">
        <form onSubmit={submitMessageHandler}>
          <div className="flex items-center space-x-1">
            <div className="relative w-full flex text-sm max-h-24">
              <Textarea
                ref={textareaRef}
                disabled={isBusy}
                autoFocus
                value={input}
                onChange={(e) => {
                  handleInputChange(e);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitMessageHandler(e as any);
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                placeholder={isBusy ? "" : "Type your message"}
                className="flex-1 border rounded-md py-2 px-3 resize-none scrollbar-none text-sm w-full pr-6"
              />
              {isBusy && (
                <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                  <LoadingDots size={3} />
                </div>
              )}
              <button
                type="button"
                onClick={handleFileButtonClick}
                disabled={isBusy}
                title="Attach file"
                className="absolute text-md cursor-pointer right-2 top-1/2 -translate-y-1/2 transition-colors"
              >
                <Paperclip className="text-foreground p-1" />
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
              <span className="px-2 py-1 flex items-center justify-center">
                {isBusy ? <StopIndicator /> : <SendIcon />}
              </span>
            </Button>
          </div>
        </form>
      </div>
      <div>
        {visualError && (
          <div className="text-destructive overflow-y-auto break-all">
            {visualError}
          </div>
        )}
      </div>
    </div>
  );
};
