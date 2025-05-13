import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { ChatBehaviorProps, ChatPreview } from "../types/chat";
import { getCompactLocaleDateTime } from "../util/datetime";
import { Chat } from "../views-components/Chat";
import { Spinner } from "../common/icons/Spinner";
import { UIMessage } from "ai";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, MessageSquarePlus } from "lucide-react";
import { chatDb } from "../storage/chatDatabase";
import { Realtime } from "../views-components/Realtime";

type ChatTabProps = ChatBehaviorProps & {
  initialChatName?: string;
};

type CurrentChatSelection = {
  id: string;
  name: string;
  messages: UIMessage[];
  url?: URL;
};

// New type for grouped chats
type ChatGroup = {
  url: URL | null;
  chats: ChatPreview[];
};

export const ChatTab = ({ systemPrompt, sendInitialMessage }: ChatTabProps) => {
  const [currentChatSelection, setCurrentChatSelection] =
    useState<CurrentChatSelection>({
      id: crypto.randomUUID(),
      name: "New Chat",
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
      const allChats = await chatDb.getAllChatPreviews();

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
    const allChats = await chatDb.getAllChatPreviews();

    setChats(groupChats(allChats));
  }, [groupChats]);

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
      id: crypto.randomUUID(),
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
      <div className="flex items-center p-2 border-b">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <button
              className="bg-transparent border-none cursor-pointer text-base p-1 rounded-sm"
              title="Chat history"
            >
              <Menu size={16} className="text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Your Chats</SheetTitle>
              <SheetDescription className="sr-only">
                Your saved chats
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {isLoadingChats ? (
                <Spinner />
              ) : chats.length === 0 ? (
                <div className="text-center py-6">No saved chats</div>
              ) : (
                chats.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-3">
                    <div className="text-xs font-medium mb-1 px-3">
                      {group.url ? prettyUrl(group.url) : "Extension"}
                    </div>
                    <div className="border-l-2 pl-2">
                      {group.chats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-3 rounded-sm mb-1 cursor-pointer relative flex flex-col"
                          onClick={() => loadChat(chat.id)}
                        >
                          <span className="font-medium mb-1 whitespace-nowrap overflow-hidden text-ellipsis pr-6">
                            {chat.name}
                          </span>
                          <span className="text-xs">
                            {getCompactLocaleDateTime(chat.updatedAt)}
                          </span>
                          <button
                            className="absolute right-2 top-2 bg-transparent border-none text-base cursor-pointer opacity-50 hover:opacity-100"
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
          </SheetContent>
        </Sheet>
        <Input
          required
          value={editingChatName}
          onChange={(e) => setEditingChatName(e.target.value)}
          onBlur={handleChatNameBlur}
          className="flex-1 mx-2"
        />
        <button
          className="bg-transparent border-none cursor-pointer text-base p-1 rounded-sm"
          onClick={createNewChat}
          title="New chat"
        >
          <MessageSquarePlus size={16} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chat
          key={chatInstanceKey}
          pageUrl={currentChatSelection.url}
          initialChatId={currentChatSelection.id}
          initialChatName={currentChatSelection.name}
          initialMessages={currentChatSelection.messages}
          systemPrompt={systemPrompt}
          sendInitialMessage={sendInitialMessage}
        />
      </div>
      <Realtime chatId={currentChatSelection.id} />
    </div>
  );
};
