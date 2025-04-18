import { summarizeTextSystemMessage } from "../../ai/prompts";
import { Chat2 } from "../../components/Chat2";
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
        <Chat2
          compact
          initialUserMessage={options.selectedText}
          initialChatName={sessionId}
          initialMessages={[]}
          systemPrompt={await summarizeTextSystemMessage()}
          collapseInitialMessage={true}
          sendInitialMessage={true}
        />
      ),
    });
  }
}
