import { summarizeTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { FloatingEmbeddedWindow } from "./FloatingWindow";

export class FloatingSummaryWindow extends FloatingEmbeddedWindow {
  constructor() {
    super("summary");
  }

  public show(options: {
    selectedText: string;
    position?: { top: number; left: number };
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
