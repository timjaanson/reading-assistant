import { UIMessage } from "ai";

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

export type ChatBehaviorProps = {
  systemPrompt?: string;
  sendInitialMessage?: boolean;
};
