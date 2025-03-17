import { explainTextSystemMessage } from "../../ai/prompts";
import Chat from "../../components/Chat";
import { FloatingEmbeddedWindow } from "./FloatingWindow";

export class FloatingExplainWindow extends FloatingEmbeddedWindow {
  constructor() {
    super("explain");
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
          systemPrompt={explainTextSystemMessage()}
          collapseInitialMessage={true}
          compact={true}
        />
      ),
    });
  }
}
