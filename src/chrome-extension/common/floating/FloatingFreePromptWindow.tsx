import { freePromptSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { createMessageCollection } from "../../types/chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingFreePromptWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("custom", { parentId });
  }

  public async show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): Promise<void> {
    // Generate a unique ID for this summary session
    const sessionId = `free-prompt-${Date.now()}`;

    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialMessages={createMessageCollection([], sessionId)}
          initialUserMessage={options.selectedText}
          systemPrompt={await freePromptSystemMessage()}
          collapseInitialMessage={true}
          sendInitialMessage={false}
          compact={true}
        />
      ),
    });
  }
}
