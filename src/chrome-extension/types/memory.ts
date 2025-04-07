/**
 * Represents a single memory item stored in the database.
 */
export interface MemoryItem {
  id: number; // Auto-incrementing primary key
  active: boolean; // Whether the memory is currently active
  content: string; // The content of the memory item
  createdAt: Date; // Timestamp when the memory was created
  updatedAt: Date; // Timestamp when the memory was last updated
}

/**
 * Represents the data needed to create a new memory item.
 * Ensures that 'content' is provided and non-empty when trimmed.
 */
export type NewMemoryData = {
  content: string;
};
