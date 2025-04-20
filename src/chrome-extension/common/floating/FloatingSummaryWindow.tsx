import { summarizeTextSystemMessage } from "../../ai/prompts";
import { Chat } from "../../components/Chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingSummaryWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("summary", { parentId });
  }

  public async show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): Promise<void> {
    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialMessages={[]}
          initialChatName={"Summary"}
          pageUrl={this.currentPageUrl}
          systemPrompt={await summarizeTextSystemMessage()}
          initialUserMessage={options.selectedText}
          collapseInitialMessage={true}
          sendInitialMessage={true}
        />
      ),
    });
  }
}
