import { CoreMessage } from "ai";
import { useState } from "react";
import Chat from "../components/Chat";

export const ChatTab = () => {
  const [messages, setMessages] = useState<CoreMessage[]>([]);

  return <Chat initialMessages={messages} onMessagesChange={setMessages} />;
};

export default ChatTab;
