import { CoreMessage, UIMessage } from "ai";

export interface Chat {
  id: string;
  url?: string;
  name: string;
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatPreview {
  id: string;
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
