import { freePromptSystemMessage } from "../../ai/prompts";
import { Chat } from "../../components/Chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingFreePromptWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("custom", { parentId });
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
          initialChatName={"Custom"}
          systemPrompt={await freePromptSystemMessage()}
          initialUserMessage={options.selectedText}
          collapseInitialMessage={true}
          sendInitialMessage={false}
        />
      ),
    });
  }
}
