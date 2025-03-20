import { summarizeTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { AbstractFloatingEmbeddedWindow } from "./AbstractFloatingEmbeddedWindow";

export class FloatingSummaryWindow extends AbstractFloatingEmbeddedWindow {
  constructor(parentId?: string) {
    super("summary", { parentId });
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
          systemPrompt={summarizeTextSystemMessage()}
          collapseInitialMessage={true}
          compact={true}
        />
      ),
    });
  }
}
