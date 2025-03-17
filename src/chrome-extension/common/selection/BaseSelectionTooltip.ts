import { createRoot } from "react-dom/client";
import { FloatingSummaryWindow } from "../floating/FloatingSummaryWindow";
import { FloatingExplainWindow } from "../floating/FloatingExplainWindow";

export interface TooltipAction {
  name: string;
  handler: (selectedText: string, clickEvent?: MouseEvent) => void;
}

export abstract class BaseSelectionTooltip {
  protected tooltip: HTMLElement | null = null;
  protected actions: TooltipAction[] = [];
  protected summaryRoot: ReturnType<typeof createRoot> | null = null;
  protected lastSelectionRect: DOMRect | null = null;
  protected isDragging: boolean = false;
  protected dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    this.setupEventListeners();
  }

  // Abstract method that must be implemented by subclasses
  protected abstract setupEventListeners(): void;

  protected handleMouseUp(event: MouseEvent): void {
    if (
      this.tooltip &&
      event.target instanceof Node &&
      this.tooltip.contains(event.target)
    ) {
      return;
    }

    const selection = window.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.toString().trim().length > 0
    ) {
      this.lastSelectionRect = selection.getRangeAt(0).getBoundingClientRect();
      this.showTooltip(selection, event);
    }
  }

  protected handleMouseDown(event: MouseEvent): void {
    if (
      this.tooltip &&
      event.target instanceof Node &&
      !this.tooltip.contains(event.target)
    ) {
      this.hideTooltip();
    }
  }

  protected showTooltip(selection: Selection, event: MouseEvent): void {
    this.hideTooltip();
    const capturedText = selection.toString();

    this.tooltip = document.createElement("div");
    this.tooltip.className = "assisted-reading-tooltip";

    Object.assign(this.tooltip.style, {
      position: "absolute",
      zIndex: "10000",
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "6px",
      padding: "0",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      fontSize: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backdropFilter: "blur(8px)",
    });

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "4px";

    this.actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.name;
      button.addEventListener("click", (e: MouseEvent) => {
        action.handler(capturedText, e);
      });
      Object.assign(button.style, {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        border: "none",
        padding: "2px 4px",
        cursor: "pointer",
        fontSize: "12px",
        color: "#333",
        transition: "background-color 0.2s ease, opacity 0.2s ease",
      });
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
      });
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
      });
      buttonContainer.appendChild(button);
    });
    this.tooltip.appendChild(buttonContainer);

    this.positionTooltip(event);
  }

  protected positionTooltip(event: MouseEvent): void {
    if (!this.tooltip) return;

    this.tooltip.style.left = `${
      event.clientX + window.scrollX - (this.tooltip.offsetWidth || 0) / 2
    }px`;
    this.tooltip.style.top = `${event.clientY + window.scrollY - 10}px`;

    document.body.appendChild(this.tooltip);

    requestAnimationFrame(() => {
      if (this.tooltip) {
        const tooltipHeight = this.tooltip.offsetHeight;
        this.tooltip.style.left = `${
          event.clientX + window.scrollX - this.tooltip.offsetWidth / 2
        }px`;
        this.tooltip.style.top = `${
          event.clientY + window.scrollY - tooltipHeight - 10
        }px`;
      }
    });
  }

  protected hideTooltip(): void {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  protected showSummaryWindow(selectedText: string): void {
    // Close the tooltip if it's visible
    this.hideTooltip();

    // Create a new floating summary instance
    const summary = new FloatingSummaryWindow();
    summary.show({
      selectedText,
      position: this.calculatePositionForWindowBasedOnTooltip(),
    });
  }

  protected showExplainWindow(selectedText: string): void {
    // Close the tooltip if it's visible
    this.hideTooltip();

    // Create a new floating explain instance
    const explain = new FloatingExplainWindow();
    explain.show({
      selectedText,
      position: this.calculatePositionForWindowBasedOnTooltip(),
    });
  }

  private calculatePositionForWindowBasedOnTooltip():
    | { top: number; left: number }
    | undefined {
    if (this.lastSelectionRect) {
      return {
        top: this.lastSelectionRect.top + window.scrollY,
        left: Math.min(
          this.lastSelectionRect.left + window.scrollX,
          window.scrollX + window.innerWidth - 420
        ),
      };
    }
  }

  public addAction(
    name: string,
    handler: (selectedText: string, clickEvent?: MouseEvent) => void
  ): void {
    this.actions.push({ name, handler });
  }
}
