import { UIMessage } from "ai";
import { useEffect, useRef } from "react";
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
    </div>
  );
};
