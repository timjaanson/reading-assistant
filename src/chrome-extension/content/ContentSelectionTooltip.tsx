import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import { FloatingSummary } from "../common/selection/FloatingSummary";

export class ContentSelectionTooltip extends BaseSelectionTooltip {
  constructor() {
    super();
    this.addAction("Summary", (selectedText: string) => {
      this.showSummaryReact(selectedText);
    });
  }

  protected setupEventListeners(): void {
    // For content pages, we listen to events on the document
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
}
