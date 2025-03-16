import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import { FloatingSummary } from "../common/selection/FloatingSummary";

export class PdfSelectionTooltip extends BaseSelectionTooltip {
  private observer: MutationObserver;

  constructor() {
    super();
    this.addAction("Summary", (selectedText: string) => {
      this.showSummaryReact(selectedText);
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

  private showSummaryReact(selectedText: string): void {
    // Close the tooltip if it's visible
    this.hideTooltip();

    // Calculate position near selection if available
    let position = undefined;
    if (this.lastSelectionRect) {
      position = {
        top: this.lastSelectionRect.top + window.scrollY,
        left: Math.min(
          this.lastSelectionRect.left + window.scrollX,
          window.scrollX + window.innerWidth - 420
        ),
      };
    }

    // Create a new floating summary instance
    const summary = new FloatingSummary();
    summary.show(selectedText, position);
  }

  public destroy(): void {
    // Clean up the observer when the tooltip is destroyed
    this.observer.disconnect();
  }
}
