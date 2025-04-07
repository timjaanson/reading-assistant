import { freePromptSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { createMessageCollection } from "../../types/chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingFreePromptWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("custom", { parentId });
  }

  public show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): void {
    // Generate a unique ID for this summary session
    const sessionId = `free-prompt-${Date.now()}`;

    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialMessages={createMessageCollection([], sessionId)}
          initialUserMessage={options.selectedText}
          systemPrompt={freePromptSystemMessage()}
          collapseInitialMessage={true}
          sendInitialMessage={false}
          compact={true}
        />
      ),
    });
  }
}
