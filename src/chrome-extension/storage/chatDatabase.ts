import Dexie, { Table } from "dexie";
import { Chat, ChatPreview } from "../types/chat";

export class ChatDatabase extends Dexie {
  chats!: Table<Chat, string>;

  constructor() {
    super("AssistantChatsDB");
    this.version(1).stores({
      chats: "id, name, updatedAt",
    });
  }

  async saveChat(
    chatData: Omit<Chat, "createdAt" | "updatedAt">
  ): Promise<string> {
    const now = new Date();
    const existing = await this.chats.get(chatData.id);

    const chatToSave: Chat = {
      ...chatData,
      createdAt: existing?.createdAt || now, // Keep original creation date
      updatedAt: now,
    };

    await this.chats.put(chatToSave);
    console.log(`Saved/Updated chat ${chatData.id}`);
    return chatData.id;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const chat = await this.chats.get(id);
    if (chat) {
      console.log(
        "Retrieved chat with",
        chat.messages?.length || 0,
        "messages"
      );

      if (!chat.messages) {
        chat.messages = [];
      }
    }
    return chat;
  }

  async getAllChatPreviews(): Promise<ChatPreview[]> {
    console.log("Getting all chat previews");
    return this.chats
      .orderBy("updatedAt")
      .reverse()
      .toArray((chats) =>
        chats.map((chat) => ({
          id: chat.id,
          name: chat.name,
          updatedAt: chat.updatedAt,
        }))
      );
  }

  async deleteChat(id: string): Promise<void> {
    console.log("Deleting chat", id);
    await this.chats.delete(id);
  }
}

export const chatDb = new ChatDatabase();
