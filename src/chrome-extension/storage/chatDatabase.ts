import Dexie, { Table } from "dexie";
import { Chat, ChatPreview } from "../types/chat";
import { CoreMessage } from "ai";

export class ChatDatabase extends Dexie {
  chats!: Table<Chat, number>;

  constructor() {
    super("AssistantChatsDB");
    this.version(1).stores({
      chats: "++id, name, createdAt, updatedAt",
    });
  }

  async insertChat(name: string, messages: CoreMessage[]): Promise<number> {
    console.log("Saving new chat with messages:", messages.length);
    const now = new Date();

    // Ensure we're not saving empty messages
    if (!messages || messages.length === 0) {
      throw new Error("Cannot save a chat with no messages");
    }

    return this.chats.add({
      name,
      messages,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateChat(
    id: number,
    name: string,
    messages: CoreMessage[]
  ): Promise<number> {
    console.log("Updating chat", id, "with messages:", messages.length);
    const now = new Date();

    // Check if chat exists
    const chat = await this.chats.get(id);
    if (!chat) {
      throw new Error(`Chat with ID ${id} not found`);
    }

    await this.chats.update(id, {
      name,
      messages,
      updatedAt: now,
    });
    return id;
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const chat = await this.chats.get(id);
    if (chat) {
      console.log(
        "Retrieved chat with",
        chat.messages?.length || 0,
        "messages"
      );

      // Ensure we have messages array, even if empty
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
          id: chat.id!,
          name: chat.name,
          updatedAt: chat.updatedAt,
        }))
      );
  }

  async deleteChat(id: number): Promise<void> {
    console.log("Deleting chat", id);
    await this.chats.delete(id);
  }

  // Debug utility to dump all chats to console
  async debugLogAllChats(): Promise<void> {
    console.log("=== DEBUG: All Chats ===");
    const allChats = await this.chats.toArray();

    console.log(`Found ${allChats.length} chats in database:`);

    allChats.forEach((chat) => {
      console.log(`- Chat ID ${chat.id}: "${chat.name}"`);
      console.log(`  Created: ${chat.createdAt.toLocaleString()}`);
      console.log(`  Updated: ${chat.updatedAt.toLocaleString()}`);
      console.log(`  Messages: ${chat.messages?.length || 0}`);

      if (chat.messages && chat.messages.length > 0) {
        console.log(
          `  First message: ${JSON.stringify(chat.messages[0]).substring(
            0,
            100
          )}...`
        );
        console.log(
          `  Last message: ${JSON.stringify(
            chat.messages[chat.messages.length - 1]
          ).substring(0, 100)}...`
        );
      }
      console.log("---");
    });

    console.log("=== END DEBUG ===");
  }
}

export const chatDb = new ChatDatabase();
