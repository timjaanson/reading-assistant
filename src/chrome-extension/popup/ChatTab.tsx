import Input from "../components/Input";
import { useCallback, useEffect, useState } from "react";
import { ChatBehaviorProps, ChatPreview } from "../types/chat";
import { getCompactLocaleDateTime } from "../util/datetime";
import { Chat } from "../components/Chat";
import { Spinner } from "../common/icons/Spinner";
import { UIMessage } from "ai";
import { chatDbProxy } from "../storage/wrappers";

type ChatTabProps = ChatBehaviorProps & {
  initialChatName?: string;
};

type CurrentChatSelection = {
  id: string | undefined;
  name: string;
  messages: UIMessage[];
  url?: URL;
};

// New type for grouped chats
type ChatGroup = {
  url: URL | null;
  chats: ChatPreview[];
};

export const ChatTab = ({
  initialChatName,
  systemPrompt,
  initialUserMessage,
  collapseInitialMessage,
  sendInitialMessage,
}: ChatTabProps) => {
  const [currentChatSelection, setCurrentChatSelection] =
    useState<CurrentChatSelection>({
      id: undefined,
      name: initialChatName || "New Chat",
      messages: [],
      url: undefined,
    });
  const [chatInstanceKey, setChatInstanceKey] = useState<string>("initial");
  const [editingChatName, setEditingChatName] = useState(
    currentChatSelection.name
  );
  const [chats, setChats] = useState<ChatGroup[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  useEffect(() => {
    setEditingChatName(currentChatSelection.name);
  }, [currentChatSelection.name]);

  const groupChats = useCallback((chats: ChatPreview[]) => {
    const groupedChats: ChatGroup[] = [];
    let currentGroup: ChatGroup | null = null;

    chats.forEach((chat) => {
      if (
        !currentGroup ||
        chat.url?.toString() !== currentGroup.url?.toString()
      ) {
        currentGroup = {
          url: chat.url ? new URL(chat.url) : null,
          chats: [chat],
        };
        groupedChats.push(currentGroup);
      } else {
        currentGroup.chats.push(chat);
      }
    });

    return groupedChats;
  }, []);

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const allChats = await chatDbProxy.getAllChatPreviews();

      setChats(groupChats(allChats));
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [groupChats]);

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
    const allChats = await chatDbProxy.getAllChatPreviews();

    setChats(groupChats(allChats));
  }, [groupChats]);

  // Load specific chat when selected
  const loadChat = useCallback(async (id: string) => {
    try {
      const chat = await chatDbProxy.getChat(id);
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
      await chatDbProxy.deleteChat(id);

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
          const chat = await chatDbProxy.getChat(currentChatSelection.id);
          if (chat) {
            await chatDbProxy.saveChat({
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

  const prettyUrl = (url: URL) => {
    if (!url) {
      return "Unknown URL";
    }

    const hostname = url.hostname || "";
    const pathname = url.pathname || "";

    // If the path is just "/" or empty, use just the hostname
    if (pathname === "/" || pathname === "") {
      return hostname;
    }

    // Split the path into segments and remove empty segments
    const segments = pathname.split("/").filter((segment) => segment !== "");

    if (segments.length === 0) {
      return hostname;
    }

    let lastSegment = "";
    if (pathname.endsWith("/")) {
      // For paths ending with "/", use the second-to-last segment if available
      lastSegment =
        segments.length > 1
          ? segments[segments.length - 2] + "/"
          : segments[segments.length - 1] + "/";
    } else {
      // Otherwise use the last segment
      lastSegment = segments[segments.length - 1];
    }

    return `${hostname} - ${lastSegment}`;
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
                chats.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-3">
                    <div className="text-xs text-gray-400 font-medium mb-1 px-3">
                      {group.url ? prettyUrl(group.url) : "Extension"}
                    </div>
                    <div className="border-l-2 border-gray-600 pl-2">
                      {group.chats.map((chat) => (
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
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Chat
          key={chatInstanceKey}
          pageUrl={currentChatSelection.url}
          initialChatId={currentChatSelection.id}
          initialChatName={currentChatSelection.name}
          initialMessages={currentChatSelection.messages}
          systemPrompt={systemPrompt}
          initialUserMessage={initialUserMessage}
          collapseInitialMessage={collapseInitialMessage}
          sendInitialMessage={sendInitialMessage}
        />
      </div>
    </div>
  );
};
