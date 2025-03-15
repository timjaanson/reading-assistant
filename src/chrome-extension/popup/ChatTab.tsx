import { CoreMessage } from "ai";
import { useState } from "react";
import MessageBubble from "../components/MessageBubble";
import { getStreamedTextResponse } from "../ai/ai";

export const ChatTab = () => {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState("");

  const handleSendMessage = async () => {
    try {
      setInput("");
      setIsLoading(true);
      setStreamedMessage("");
      const userMessage: CoreMessage = { role: "user", content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      const streamedResponse = await getStreamedTextResponse(newMessages);

      let completeText = "";
      for await (const textChunk of streamedResponse.textStream) {
        completeText += textChunk;
        setStreamedMessage(completeText);
      }

      const finalResponse = await streamedResponse.response;
      setMessages([...newMessages, ...finalResponse.messages]);
      setStreamedMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`An unknown error occurred: ${JSON.stringify(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[800px] mx-auto">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const showRole =
            index === 0 || messages[index].role !== messages[index - 1].role;
          return (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              showRole={showRole}
            />
          );
        })}

        {streamedMessage && (
          <MessageBubble
            role="assistant"
            content={streamedMessage}
            showRole={
              messages.length === 0 ||
              messages[messages.length - 1].role !== "assistant"
            }
          />
        )}
      </div>

      {/* Input Container */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-300">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message"
            className="flex-1 border border-gray-300 rounded-md p-2"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="bg-blue-500 text-white rounded-md px-4 py-2"
          >
            Send
          </button>
        </div>
        {isLoading && <p className="text-gray-500 mt-2">Loading...</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
};
