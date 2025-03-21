import { summarizeTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { createMessageCollection } from "../../types/chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingSummaryWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("summary", { parentId });
  }

  public show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): void {
    // Generate a unique ID for this summary session
    const sessionId = `summary-${Date.now()}`;

    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialMessages={createMessageCollection([], sessionId)}
          initialUserMessage={options.selectedText}
          systemPrompt={summarizeTextSystemMessage()}
          collapseInitialMessage={true}
          compact={true}
        />
      ),
    });
  }
}
