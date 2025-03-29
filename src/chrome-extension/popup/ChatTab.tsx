import { CoreMessage } from "ai";
import { useEffect, useState, useCallback, useRef } from "react";
import Chat from "../components/Chat";
import { chatDb } from "../storage/chatDatabase";
import { ChatPreview, createMessageCollection } from "../types/chat";
import { getCompactLocaleDateTime } from "../util/datetime";
import { Input } from "../components/Input";

export const ChatTab = () => {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatName, setChatName] = useState("New Chat");
  const [isSaving, setIsSaving] = useState(false);

  // Use refs to track message changes without causing re-renders
  const messagesRef = useRef<CoreMessage[]>([]);
  const shouldSaveRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug function to log all chats - triggered by double-clicking the hamburger menu
  const debugDumpChats = async () => {
    await chatDb.debugLogAllChats();
  };

  // Load chat list on component mount
  useEffect(() => {
    shouldSaveRef.current = true;

    const loadChats = async () => {
      const allChats = await chatDb.getAllChatPreviews();
      setChats(allChats);
    };

    loadChats();

    return () => {
      // Clean up timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Refresh chat list
  const refreshChatList = useCallback(async () => {
    const allChats = await chatDb.getAllChatPreviews();
    setChats(allChats);
  }, []);

  // Load specific chat when selected
  const loadChat = useCallback(async (id: number) => {
    try {
      // Prevent auto-saving while loading a chat
      shouldSaveRef.current = false;

      const chat = await chatDb.getChat(id);
      if (chat) {
        console.log(
          "Loading chat:",
          chat.id,
          "with",
          chat.messages?.length || 0,
          "messages"
        );
        setChatName(chat.name);
        setCurrentChatId(id);

        // Ensure messages are properly set
        if (Array.isArray(chat.messages) && chat.messages.length > 0) {
          // Update both state and ref to avoid save loop
          setMessages(chat.messages);
          messagesRef.current = chat.messages;
        } else {
          setMessages([]);
          messagesRef.current = [];
        }

        setIsSidebarOpen(false);

        // Re-enable saving after a short delay
        setTimeout(() => {
          shouldSaveRef.current = true;
        }, 1000);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      shouldSaveRef.current = true;
    }
  }, []);

  // Save current chat without causing loops
  const saveChat = useCallback(async () => {
    // Skip saving if not needed, but log for debugging
    if (isSaving) {
      console.log("Skipping save - already saving");
      return;
    }

    if (!shouldSaveRef.current) {
      console.log("Skipping save - shouldSave is false");
      return;
    }

    if (messagesRef.current.length === 0) {
      console.log("Skipping save - no messages to save");
      return;
    }

    setIsSaving(true);
    try {
      const messagesToSave = [...messagesRef.current]; // Create a copy to avoid race conditions
      console.log("Saving chat with messages:", messagesToSave.length);

      if (currentChatId) {
        await chatDb.updateChat(currentChatId, chatName, messagesToSave);
        console.log("Updated existing chat:", currentChatId);
      } else {
        const id = await chatDb.insertChat(chatName, messagesToSave);
        console.log("Created new chat with ID:", id);
        setCurrentChatId(id);
      }
      await refreshChatList();
    } catch (error) {
      console.error("Error saving chat:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentChatId, chatName, refreshChatList, isSaving]);

  // Create new chat
  const createNewChat = useCallback(() => {
    // Prevent auto-saving while creating a new chat
    shouldSaveRef.current = false;

    setMessages([]);
    messagesRef.current = [];
    setChatName("New Chat");
    setCurrentChatId(null);
    setIsSidebarOpen(false);

    // Re-enable saving after a short delay
    setTimeout(() => {
      shouldSaveRef.current = true;
    }, 500);
  }, []);

  // Delete chat
  const deleteChat = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      await chatDb.deleteChat(id);

      // If current chat was deleted, create a new chat
      if (id === currentChatId) {
        createNewChat();
      }

      await refreshChatList();
    },
    [currentChatId, createNewChat, refreshChatList]
  );

  // Save chat when name changes
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setChatName(e.target.value);
    },
    []
  );

  const handleNameBlur = useCallback(async () => {
    if (
      (messagesRef.current.length > 0 || currentChatId) &&
      shouldSaveRef.current
    ) {
      await saveChat();
    }
  }, [currentChatId, saveChat]);

  // Handle changes to messages from Chat component
  const handleMessagesChange = useCallback(
    (newMessages: CoreMessage[]) => {
      console.log("Messages changed:", newMessages.length);

      // Update both the state and our ref to track the latest messages
      setMessages(newMessages);
      messagesRef.current = newMessages;

      // Always clear previous timeout if it exists
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Schedule a save with debounce
      if (newMessages.length > 0 && shouldSaveRef.current) {
        console.log("Scheduling save for", newMessages.length, "messages");
        saveTimeoutRef.current = setTimeout(() => {
          console.log(
            "Executing scheduled save for",
            messagesRef.current.length,
            "messages"
          );
          saveChat();
          saveTimeoutRef.current = null;
        }, 1000);
      }
    },
    [saveChat]
  );

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center p-2 border-b border-gray-700">
        <button
          className="bg-transparent border-none cursor-pointer text-base p-1 hover:bg-gray-700/40 rounded text-gray-200"
          onClick={() => setIsSidebarOpen(true)}
          onDoubleClick={debugDumpChats}
          title="Open chats (double-click to debug)"
        >
          ☰
        </button>
        <Input
          value={chatName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          className="flex-1 mx-2"
        />
        <button
          className="bg-transparent border-none cursor-pointer text-base p-1 hover:bg-gray-700/40 rounded text-gray-200"
          onClick={createNewChat}
          title="New chat"
        >
          +
        </button>
      </div>

      {/* Sidebar for chat history */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#272522] shadow-md flex flex-col z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-700">
              <h3 className="m-0 text-base text-gray-200">Your Chats</h3>
              <button
                className="bg-transparent border-none text-xl cursor-pointer p-0 px-1 text-gray-300"
                onClick={() => setIsSidebarOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="text-center text-gray-400 py-6">
                  No saved chats
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-3 rounded mb-1 cursor-pointer relative flex flex-col hover:bg-gray-700/30"
                    onClick={() => loadChat(chat.id)}
                  >
                    <span className="font-medium mb-1 whitespace-nowrap overflow-hidden text-ellipsis pr-6 text-gray-200">
                      {chat.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getCompactLocaleDateTime(chat.updatedAt)}
                    </span>
                    <button
                      className="absolute right-2 top-2 bg-transparent border-none text-base cursor-pointer opacity-50 hover:opacity-100 text-gray-300"
                      onClick={(e) => deleteChat(chat.id, e)}
                      title="Delete chat"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Chat
          initialMessages={createMessageCollection(messages, currentChatId)}
          onMessagesChange={handleMessagesChange}
          key={`chat-${currentChatId || "new"}`}
        />
      </div>
    </div>
  );
};

export default ChatTab;
