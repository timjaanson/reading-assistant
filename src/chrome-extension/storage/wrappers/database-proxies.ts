import { IChatDatabase, IMemoryDatabase } from "../../types/database";
import { Chat, ChatPreview } from "../../types/chat";
import { MemoryItem, NewMemoryData } from "../../types/memory";
import { callDbMethod } from "./db-message-sender";

export class ChatDbProxy implements IChatDatabase {
  async saveChat(
    chatData: Omit<Chat, "createdAt" | "updatedAt">
  ): Promise<string> {
    return callDbMethod<string>("chat", "saveChat", [chatData]);
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return callDbMethod<Chat | undefined>("chat", "getChat", [id]);
  }

  async getAllChatPreviews(): Promise<ChatPreview[]> {
    return callDbMethod<ChatPreview[]>("chat", "getAllChatPreviews", []);
  }

  async deleteChat(id: string): Promise<void> {
    return callDbMethod<void>("chat", "deleteChat", [id]);
  }
}

export class MemoryDbProxy implements IMemoryDatabase {
  async addMemory(itemData: NewMemoryData): Promise<number> {
    return callDbMethod<number>("memory", "addMemory", [itemData]);
  }

  async updateMemory(
    id: number,
    updates: Partial<Pick<MemoryItem, "active" | "content">>
  ): Promise<void> {
    return callDbMethod<void>("memory", "updateMemory", [id, updates]);
  }

  async deleteMemory(id: number): Promise<void> {
    return callDbMethod<void>("memory", "deleteMemory", [id]);
  }

  async getAllMemories(): Promise<MemoryItem[]> {
    return callDbMethod<MemoryItem[]>("memory", "getAllMemories", []);
  }

  async getMemoryById(id: number): Promise<MemoryItem | undefined> {
    return callDbMethod<MemoryItem | undefined>("memory", "getMemoryById", [
      id,
    ]);
  }

  async getActiveMemories(): Promise<MemoryItem[]> {
    return callDbMethod<MemoryItem[]>("memory", "getActiveMemories", []);
  }
}

export const chatDbProxy = new ChatDbProxy();
export const memoryDbProxy = new MemoryDbProxy();
