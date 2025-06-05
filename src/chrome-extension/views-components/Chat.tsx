import { UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageRenderer } from "./MessageRenderer";
import { ChatBehaviorProps } from "../types/chat";
import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { chatDb } from "../storage/chatDatabase";

type ChatProps = ChatBehaviorProps & {
  initialChatId: string;
  initialMessages: UIMessage[];
  initialChatName: string;
  pageUrl?: URL;
};

export const Chat = ({
  initialChatId,
  initialMessages,
  initialChatName,
  pageUrl,
}: ChatProps) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const savedChatValues = useRef<{
    id: string;
    messagesLength: number;
  }>({
    id: initialChatId,
    messagesLength: initialMessages.length,
  });

  const { id, messages, status } = useChat({
    id: initialChatId,
    initialMessages,
    fetch: createCustomBackgroundFetch(),
    onResponse() {
      if (id !== savedChatValues.current.id) {
        savedChatValues.current.id = id;
      }
    },
  });

  const saveChat = async () => {
    try {
      const currentChat = await chatDb.getChat(id);

      await chatDb.saveChat({
        id,
        name: currentChat?.name || initialChatName,
        url: currentChat?.url || pageUrl?.toString(),
        messages: messages,
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  };

  useEffect(() => {
    if (
      !(
        status !== "ready" ||
        messages.length === 0 ||
        id !== savedChatValues.current.id ||
        messages.length === savedChatValues.current.messagesLength
      )
    ) {
      saveChat();
    }
  }, [messages, status]);

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
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => updateScrollButtonVisibility();
    messagesContainer.addEventListener("scroll", handleScroll);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollButtonVisibility();
    });
    resizeObserver.observe(messagesContainer);

    const mutationObserver = new MutationObserver(() => {
      updateScrollButtonVisibility();
    });

    mutationObserver.observe(messagesContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    updateScrollButtonVisibility();

    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollButtonVisibility]);

  useEffect(() => {
    const timeoutId = setTimeout(updateScrollButtonVisibility, 0);
    return () => clearTimeout(timeoutId);
  }, [messages, updateScrollButtonVisibility]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className={"text-sm flex flex-col h-full w-full mx-auto relative"}>
      <div
        ref={messagesContainerRef}
        className="max-w-full flex-1 overflow-y-auto p-2 space-y-2 bg-transparent"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <MessageRenderer message={message} />
          </div>
        ))}
      </div>

      {showScrollButton && (
        <div
          onClick={scrollToBottom}
          className="absolute left-1/2 bottom-[20px] -translate-x-1/2 text-foreground bg-card/70 hover:bg-card rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          ↓
        </div>
      )}
    </div>
  );
};
