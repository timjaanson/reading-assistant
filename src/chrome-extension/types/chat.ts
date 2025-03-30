import { CoreMessage } from "ai";

export interface Chat {
  id?: number; // Dexie will auto-generate this
  url?: string;
  name: string;
  messages: CoreMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatPreview {
  id: number;
  url?: string;
  name: string;
  updatedAt: Date;
}

// New interface for message collections
export interface MessageCollection {
  id: string | number | null; // Unique identifier for this collection
  messages: CoreMessage[];
}

// Create a utility function to create MessageCollection objects
export function createMessageCollection(
  messages: CoreMessage[] = [],
  id: string | number | null = null
): MessageCollection {
  return { id, messages };
}
