import { freePromptSystemMessage } from "../../ai/prompts";
import { Chat2 } from "../../components/Chat2";
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
        <Chat2
          initialUserMessage={options.selectedText}
          initialChatName={sessionId}
          initialMessages={[]}
          systemPrompt={await freePromptSystemMessage()}
          collapseInitialMessage={false}
          sendInitialMessage={false}
        />
      ),
    });
  }
}
