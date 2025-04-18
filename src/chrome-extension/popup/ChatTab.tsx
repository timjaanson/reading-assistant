import Input from "../components/Input";
import { useCallback, useEffect, useState } from "react";
import { ChatPreview } from "../types/chat";
import { chatDb } from "../storage/chatDatabase";
import { getCompactLocaleDateTime } from "../util/datetime";
import { Chat2 } from "../components/Chat2";
import { Spinner } from "../common/Spinner";
import { UIMessage } from "ai";

type CurrentChatSelection = {
  id: string | undefined;
  name: string;
  messages: UIMessage[];
};

export const ChatTab = () => {
  const [currentChatSelection, setCurrentChatSelection] =
    useState<CurrentChatSelection>({
      id: undefined,
      name: "New Chat",
      messages: [],
    });
  const [chatInstanceKey, setChatInstanceKey] = useState<string>("initial");
  const [editingChatName, setEditingChatName] = useState(
    currentChatSelection.name
  );
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  useEffect(() => {
    setEditingChatName(currentChatSelection.name);
  }, [currentChatSelection.name]);

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const allChats = await chatDb.getAllChatPreviews();
      setChats(allChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  // Load chat list on component mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load chats when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      loadChats();
    }
  }, [isSidebarOpen, loadChats]);

  // Refresh chat list
  const refreshChatList = useCallback(async () => {
    const allChats = await chatDb.getAllChatPreviews();
    setChats(allChats);
  }, []);

  // Load specific chat when selected
  const loadChat = useCallback(async (id: string) => {
    try {
      const chat = await chatDb.getChat(id);
      if (chat) {
        console.log(
          "Loading chat:",
          chat.id,
          "with",
          chat.messages?.length || 0,
          "messages"
        );

        setCurrentChatSelection({
          id: chat.id,
          name: chat.name,
          messages:
            Array.isArray(chat.messages) && chat.messages.length > 0
              ? chat.messages
              : [],
        });

        setChatInstanceKey(chat.id);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  }, []);

  const createNewChat = useCallback(() => {
    setCurrentChatSelection({
      id: undefined,
      name: "New Chat",
      messages: [],
    });

    setChatInstanceKey(
      `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    );
    setIsSidebarOpen(false);
  }, []);

  // Delete chat
  const deleteChat = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await chatDb.deleteChat(id);

      // If current chat was deleted, create a new chat
      if (id === currentChatSelection.id) {
        createNewChat();
      }

      await refreshChatList();
    },
    [currentChatSelection.id, createNewChat, refreshChatList]
  );

  // Update chat name when input loses focus
  const handleChatNameBlur = async () => {
    const trimmedName = editingChatName.trim();
    if (trimmedName !== currentChatSelection.name) {
      // Update local state
      setCurrentChatSelection((prev) => ({ ...prev, name: trimmedName }));

      // If this is an existing chat (has an ID), update the name in the database
      if (currentChatSelection.id) {
        try {
          const chat = await chatDb.getChat(currentChatSelection.id);
          if (chat) {
            await chatDb.saveChat({
              ...chat,
              name: trimmedName,
            });
            console.log(`Updated name for chat ${currentChatSelection.id}`);
            // Refresh the chat list to show the updated name
            refreshChatList();
          }
        } catch (error) {
          console.error("Error updating chat name:", error);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center p-2 border-b border-gray-700">
        <button
          className="bg-transparent border-none cursor-pointer text-base p-1 hover:bg-gray-700/40 rounded text-gray-200"
          onClick={() => setIsSidebarOpen(true)}
          title="Open chats"
        >
          ☰
        </button>
        <Input
          required
          value={editingChatName}
          onChange={(e) => setEditingChatName(e.target.value)}
          onBlur={handleChatNameBlur}
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
              {isLoadingChats ? (
                <Spinner />
              ) : chats.length === 0 ? (
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
        <Chat2
          key={chatInstanceKey}
          initialChatId={currentChatSelection.id}
          initialChatName={currentChatSelection.name}
          initialMessages={currentChatSelection.messages}
        />
      </div>
    </div>
  );
};
