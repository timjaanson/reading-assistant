import Dexie, { Table } from "dexie";
import { MemoryItem, NewMemoryData } from "../types/memory";

export class MemoryDatabase extends Dexie {
  memories!: Table<MemoryItem, number>;

  constructor() {
    super("AssistantMemoryDB");
    this.version(1).stores({
      // ++id: auto-incrementing primary key
      // active: index for potentially filtering active/inactive memories
      // createdAt, updatedAt: indices for sorting
      memories: "++id, active, createdAt, updatedAt",
    });
  }

  /**
   * Adds a new memory item to the database.
   * Ensures that either a short or long description is provided.
   */
  async addMemory(itemData: NewMemoryData): Promise<number> {
    const { content } = itemData;
    if (content === null || content === undefined || content.trim() === "") {
      throw new Error("Memory item must have content.");
    }

    const now = new Date();
    const newItem: Omit<MemoryItem, "id"> = {
      active: true, // New memories are active by default
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    console.log("Adding new memory:", newItem);
    return this.memories.add(newItem as MemoryItem); // Cast needed as Dexie expects full type
  }

  /**
   * Updates an existing memory item.
   * Allows updating active status, short description, or long description.
   * Ensures the item remains valid (has at least one description).
   */
  async updateMemory(
    id: number,
    updates: Partial<Pick<MemoryItem, "active" | "content">>
  ): Promise<void> {
    const existingItem = await this.memories.get(id);
    if (!existingItem) {
      throw new Error(`Memory item with ID ${id} not found.`);
    }

    const potentialUpdates: Partial<MemoryItem> = { ...updates };

    // Validate that the update doesn't leave the item without content
    const finalContent =
      updates.content !== undefined ? updates.content : existingItem.content;

    if (
      finalContent === null ||
      finalContent === undefined ||
      finalContent.trim() === ""
    ) {
      throw new Error("Cannot update memory item to have empty content.");
    }

    // Clean up string inputs
    if (potentialUpdates.content !== undefined) {
      potentialUpdates.content = potentialUpdates.content.trim();
    }

    potentialUpdates.updatedAt = new Date();

    console.log("Updating memory", id, "with:", potentialUpdates);
    await this.memories.update(id, potentialUpdates);
  }

  /**
   * Deletes a memory item from the database.
   */
  async deleteMemory(id: number): Promise<void> {
    console.log("Deleting memory", id);
    await this.memories.delete(id);
  }

  /**
   * Retrieves all memory items, ordered by last updated time (newest first).
   */
  async getAllMemories(): Promise<MemoryItem[]> {
    console.log("Getting all memories");
    return this.memories.orderBy("updatedAt").reverse().toArray();
  }

  /**
   * Retrieves a memory item by its ID.
   */
  async getMemoryById(id: number): Promise<MemoryItem | undefined> {
    console.log("Getting memory by ID", id);
    return this.memories.get(id);
  }

  /**
   * Retrieves all *active* memory items, ordered by last updated time (newest first).
   */
  async getActiveMemories(): Promise<MemoryItem[]> {
    console.log("Getting active memories");

    return this.memories
      .orderBy("updatedAt")
      .reverse()
      .filter((item) => item.active)
      .toArray();
  }
}

export const memoryDb = new MemoryDatabase();
