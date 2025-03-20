import { explainTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingExplainWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("explain", { parentId });
  }

  public show(options: {
    selectedText: string;
    anchorPoint?: { x: number; y: number };
  }): void {
    super.renderComponent({
      ...options,
      renderedComponent: (
        <Chat
          initialUserMessage={options.selectedText}
          systemPrompt={explainTextSystemMessage()}
          collapseInitialMessage={true}
          compact={true}
        />
      ),
    });
  }
}
