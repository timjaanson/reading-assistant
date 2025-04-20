import { explainTextSystemMessage } from "../../ai/prompts";
import { Chat } from "../../components/Chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingExplainWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("explain", { parentId });
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
          pageUrl={this.currentPageUrl}
          initialUserMessage={options.selectedText}
          initialChatName={"Explain"}
          systemPrompt={await explainTextSystemMessage()}
          collapseInitialMessage={true}
          sendInitialMessage={true}
        />
      ),
    });
  }
}
