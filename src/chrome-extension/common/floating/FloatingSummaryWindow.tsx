import { summarizeTextSystemMessage } from "../../ai/prompts";
import { ChatTab } from "../../popup/ChatTab";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingSummaryWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("summary", { parentId });
  }

  public async show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): Promise<void> {
    // Generate a unique ID for this summary session
    const sessionId = `summary-${Date.now()}`;

    super.renderComponent({
      ...options,
      renderedComponent: (
        <ChatTab
          initialChatName={sessionId}
          systemPrompt={await summarizeTextSystemMessage()}
          initialUserMessage={options.selectedText}
          collapseInitialMessage={true}
          sendInitialMessage={true}
        />
      ),
    });
  }
}
