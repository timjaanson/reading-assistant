import { freePromptSystemMessage } from "../../ai/prompts";
import { ChatTab } from "../../popup/ChatTab";
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
        <ChatTab
          initialChatName={sessionId}
          systemPrompt={await freePromptSystemMessage()}
          initialUserMessage={options.selectedText}
          collapseInitialMessage={true}
          sendInitialMessage={false}
        />
      ),
    });
  }
}
