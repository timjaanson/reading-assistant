// Tooltip class for managing UI and interactions
class SelectionTooltip {
  private tooltip: HTMLElement | null = null;
  private actions: { name: string; handler: () => void }[] = [];

  constructor() {
    // Add initial action
    this.addAction("Summary", () => {
      console.log(
        "Summary action clicked for text:",
        window.getSelection()?.toString()
      );
    });

    // Set up event listeners
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }

  private handleMouseUp(event: MouseEvent): void {
    console.log("Mouse up event", event);
    const selection = window.getSelection();

    // Check if there's selected text
    if (
      selection &&
      !selection.isCollapsed &&
      selection.toString().trim().length > 0
    ) {
      // Create tooltip near the selection
      this.showTooltip(selection);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    // Check if click is outside tooltip
    if (
      this.tooltip &&
      event.target instanceof Node &&
      !this.tooltip.contains(event.target)
    ) {
      this.hideTooltip();
    }
  }

  private showTooltip(selection: Selection): void {
    // Remove existing tooltip if any
    this.hideTooltip();

    // Create tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = "assisted-reading-tooltip";

    // Style the tooltip
    Object.assign(this.tooltip.style, {
      position: "absolute",
      zIndex: "10000",
      backgroundColor: "white",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "4px 8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
      fontSize: "14px",
      display: "flex",
      gap: "8px",
    });

    // Add action buttons
    this.actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.name;
      button.addEventListener("click", () => {
        action.handler();
        this.hideTooltip();
      });

      // Style the button
      Object.assign(button.style, {
        backgroundColor: "#f0f0f0",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: "12px",
      });

      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#e0e0e0";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#f0f0f0";
      });

      if (this.tooltip) {
        this.tooltip.appendChild(button);
      } else {
        console.error("Tooltip not found");
        throw new Error("Tooltip not found");
      }
    });

    // Position the tooltip above the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    this.tooltip.style.left = `${
      rect.left + window.scrollX + rect.width / 2 - this.tooltip.offsetWidth / 2
    }px`;
    this.tooltip.style.top = `${rect.top + window.scrollY - 40}px`;

    // Add tooltip to DOM
    document.body.appendChild(this.tooltip);

    // Adjust position after adding to DOM to get accurate width
    requestAnimationFrame(() => {
      if (this.tooltip) {
        this.tooltip.style.left = `${
          rect.left +
          window.scrollX +
          rect.width / 2 -
          this.tooltip.offsetWidth / 2
        }px`;
      }
    });
  }

  private hideTooltip(): void {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  // Public method to add new actions
  public addAction(name: string, handler: () => void): void {
    this.actions.push({ name, handler });
  }
}

// Initialize the tooltip
const selectionTooltip = new SelectionTooltip();

// Export for potential use in other extension scripts
export default selectionTooltip;
