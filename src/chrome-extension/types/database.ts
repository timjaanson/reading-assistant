import { Chat, ChatPreview } from "./chat";
import { MemoryItem, NewMemoryData } from "./memory";

export interface IChatDatabase {
  saveChat(chatData: Omit<Chat, "createdAt" | "updatedAt">): Promise<string>;
  getChat(id: string): Promise<Chat | undefined>;
  getAllChatPreviews(): Promise<ChatPreview[]>;
  deleteChat(id: string): Promise<void>;
}

export interface IMemoryDatabase {
  addMemory(itemData: NewMemoryData): Promise<number>;
  updateMemory(
    id: number,
    updates: Partial<Pick<MemoryItem, "active" | "content">>
  ): Promise<void>;
  deleteMemory(id: number): Promise<void>;
  getAllMemories(): Promise<MemoryItem[]>;
  getMemoryById(id: number): Promise<MemoryItem | undefined>;
  getActiveMemories(): Promise<MemoryItem[]>;
}
