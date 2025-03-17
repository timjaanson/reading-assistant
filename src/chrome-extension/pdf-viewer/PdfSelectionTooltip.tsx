import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";

export class PdfSelectionTooltip extends BaseSelectionTooltip {
  private observer: MutationObserver;

  constructor() {
    super();
    this.addAction("Summary", (selectedText: string) => {
      this.showSummaryWindow(selectedText);
    });

    this.addAction("Explain", (selectedText: string) => {
      this.showExplainWindow(selectedText);
    });

    // Create the observer instance
    this.observer = new MutationObserver(this.handleDomMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private handleDomMutations(mutations: MutationRecord[]): void {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains("react-pdf__Page__textContent") ||
              node.classList.contains("textLayer"))
          ) {
            // Found a text layer, add our event listeners
            this.attachEventListeners(node);
          }
        });
      }
    });
  }

  private attachEventListeners(element: HTMLElement): void {
    element.addEventListener("mouseup", this.handleMouseUp.bind(this));
    element.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }

  protected setupEventListeners(): void {
    // For PDF viewer, we initially attach to document as fallback
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }

  public destroy(): void {
    // Clean up the observer when the tooltip is destroyed
    this.observer.disconnect();
  }
}
