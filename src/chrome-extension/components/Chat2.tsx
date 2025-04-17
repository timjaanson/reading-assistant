import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatDb } from "../storage/chatDatabase";

type AnyUIPart = UIMessage["parts"][number];

type ChatSaveValues = {
  chatId?: number;
  chatName?: string;
  messages: UIMessage[];
};

const chatValuesChanged = (a: ChatSaveValues, b: ChatSaveValues) => {
  return (
    a.chatId !== b.chatId ||
    a.chatName !== b.chatName ||
    a.messages.length !== b.messages.length
  );
};

type ChatProps = {
  initialChatId?: number;
  chatName?: string;
  initialMessages: UIMessage[];
  systemPrompt?: string;
  initialUserMessage?: string;
  collapseInitialMessage?: boolean;
  sendInitialMessage?: boolean;
  compact?: boolean;
};

export const Chat2 = ({
  initialChatId,
  chatName,
  initialMessages,
  //onMessagesChange,
  systemPrompt,
  initialUserMessage,
  //collapseInitialMessage = false,
  sendInitialMessage = false,
}: //compact = false,
ChatProps) => {
  const [chatId, setChatId] = useState<number | undefined>(initialChatId);
  const chatSaveValues = useRef<ChatSaveValues>({
    chatId: initialChatId,
    chatName: chatName,
    messages: initialMessages,
  });

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    reload,
  } = useChat({
    id: chatId?.toString(),
    initialMessages: initialMessages,
    fetch: createCustomBackgroundFetch(),
    body: {
      systemPrompt: systemPrompt,
    },
    onError(error) {
      console.error("Error in useChat", error);
    },
  });

  useEffect(() => {
    if (initialUserMessage) {
      setMessages([{ id: "1", role: "user", content: initialUserMessage }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 1 && sendInitialMessage) {
      reload();
    }

    if (chatName && messages.length !== initialMessages.length) {
      saveChat();
    }
  }, [messages]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (chatName) {
      saveChat();
    }
  }, [chatName]);

  const saveChat = useCallback(async () => {
    if (
      messages.length > 0 &&
      chatValuesChanged(chatSaveValues.current, { chatId, chatName, messages })
    ) {
      let chatNewId: number | undefined;
      if (chatId && chatName) {
        chatNewId = await chatDb.updateChat(chatId, chatName, messages);
        console.log("Updated existing chat:", chatId);
      } else if (chatName) {
        chatNewId = await chatDb.insertChat(chatName, "", messages);
        console.log(
          `Created new chat with ID:${chatNewId} and name:${chatName}`
        );
      }
      chatSaveValues.current = {
        chatId: chatNewId,
        chatName: chatName,
        messages: messages,
      };
      setChatId(chatNewId);
    }
  }, [chatId, chatName, messages]);

  const isBusy = status === "submitted" || status === "streaming";

  const renderMessagePart = (part: AnyUIPart) => {
    switch (part.type) {
      case "text":
        return <div>{part.text}</div>;
      default:
        return <div>Unsupported part type: {part.type}</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="border p-4 mb-4 max-h-[300px] overflow-y-auto">
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

      <form onSubmit={handleSubmit}>
        <div className="flex">
          <input
            name="prompt"
            value={input}
            onChange={handleInputChange}
            className="flex-1 border p-2"
            placeholder="Type your message here..."
          />
          <button
            type="submit"
            className="ml-2 bg-blue-500 text-white px-4 py-2"
            disabled={isBusy}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
