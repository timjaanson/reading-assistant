import { UIMessage } from "ai";
import { useRef } from "react";
import { MessageRenderer } from "./MessageRenderer";
import { ChatBehaviorProps } from "../types/chat";
import { useChat } from "@ai-sdk/react";

type ChatProps = ChatBehaviorProps & {
  initialChatId: string;
  initialMessages: UIMessage[];
};

export const Chat = ({ initialChatId, initialMessages }: ChatProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages } = useChat({
    id: initialChatId,
    initialMessages,
  });

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
