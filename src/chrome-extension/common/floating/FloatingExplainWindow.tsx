import { explainTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { createMessageCollection } from "../../types/chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingExplainWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("explain", { parentId });
  }

  public async show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): Promise<void> {
    // Generate a unique ID for this explain session
    const sessionId = `explain-${Date.now()}`;

    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialMessages={createMessageCollection([], sessionId)}
          initialUserMessage={options.selectedText}
          systemPrompt={await explainTextSystemMessage()}
          collapseInitialMessage={true}
          sendInitialMessage={true}
          compact={true}
        />
      ),
    });
  }
}
