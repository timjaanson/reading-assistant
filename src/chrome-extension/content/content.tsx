import { createRoot } from "react-dom/client";
import Chat from "../components/Chat";
import { summarizeTextSystemMessage } from "../ai/prompts";

// Import the built global.css asset via Vite so that we get the hashed filename.
import globalCssUrl from "../global.css?url";

// Inject the global stylesheet using the hashed asset URL.
(function injectTailwindStyles() {
  const link = document.createElement("link");
  // chrome.runtime.getURL will prepend the extension URL to the hashed asset path.
  link.href = chrome.runtime.getURL(globalCssUrl);
  link.rel = "stylesheet";
  link.type = "text/css";
  document.head.appendChild(link);
})();

// Tooltip class for managing UI and interactions
class SelectionTooltip {
  private tooltip: HTMLElement | null = null;
  private actions: { name: string; handler: (selectedText: string) => void }[] =
    [];
  private floatingSummary: HTMLElement | null = null;
  private summaryRoot: ReturnType<typeof createRoot> | null = null;
  // New property to store selection rectangle
  private lastSelectionRect: DOMRect | null = null;

  constructor() {
    // Add initial action with the new handler signature.
    // When "Summary" is clicked, it will render the selected text.
    this.addAction("Summary", (selectedText: string) => {
      this.showSummaryReact(selectedText);
    });

    // Set up event listeners
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }

  private handleMouseUp(event: MouseEvent): void {
    if (
      this.tooltip &&
      event.target instanceof Node &&
      this.tooltip.contains(event.target)
    ) {
      // If the mouseup was within the tooltip, do nothing.
      return;
    }
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

    // Capture the selected text (since it may be lost on click)
    const capturedText = selection.toString();

    // Create tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = "assisted-reading-tooltip";

    // Style the tooltip
    Object.assign(this.tooltip.style, {
      position: "absolute",
      zIndex: "10000",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      border: "none",
      borderRadius: "6px",
      padding: "6px 10px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      fontSize: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backdropFilter: "blur(8px)",
    });

    // Create a container for the action button(s)
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "12px";

    // Add action button(s)
    this.actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.name;
      button.addEventListener("click", () => {
        // Call the action handler with the captured selected text.
        action.handler(capturedText);
      });
      // Style the button
      Object.assign(button.style, {
        backgroundColor: "transparent",
        border: "none",
        padding: "4px 12px",
        cursor: "pointer",
        fontSize: "12px",
        color: "white",
        transition: "background-color 0.2s ease",
      });

      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "transparent";
      });

      buttonContainer.appendChild(button);
    });
    this.tooltip.appendChild(buttonContainer);

    // Ensure floatingSummary exists and append it to the tooltip
    if (!this.floatingSummary) {
      this.floatingSummary = document.createElement("div");
      this.floatingSummary.className = "floating-summary";
    }
    this.tooltip.appendChild(this.floatingSummary);

    // Position the tooltip above the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // Save the selection rect for later positioning of the summary window
    this.lastSelectionRect = rect;
    this.tooltip.style.left = `${
      rect.left +
      window.scrollX +
      rect.width / 2 -
      (this.tooltip.offsetWidth || 0) / 2
    }px`;
    this.tooltip.style.top = `${rect.top + window.scrollY - 40}px`;

    // Add tooltip to the DOM
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
      // Reset floatingSummary, summaryRoot, and lastSelectionRect
      this.floatingSummary = null;
      this.summaryRoot = null;
      this.lastSelectionRect = null;
    }
  }

  // New method that renders a React component with the selected text.
  private showSummaryReact(selectedText: string): void {
    // Close tooltip since we want a separate summary window.
    this.hideTooltip();

    // Create floatingSummary as a standalone container if it doesn't exist.
    if (!this.floatingSummary) {
      this.floatingSummary = document.createElement("div");
      this.floatingSummary.className = "floating-summary";
      // Override any inherited styles and apply dynamic sizing:
      Object.assign(this.floatingSummary.style, {
        all: "unset",
        position: "fixed",
        left: "20px",
        right: "20px",
        // Remove bottom; we'll set top based on the selection position.
        minWidth: "150px",
        maxWidth: "40vw", // changed from 80vw to 40vw
        width: "100%",
        height: "400px",
        backgroundColor: "#fff",
        color: "#000",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: "10000",
        // Allow vertical scrolling if content overflows.
        overflowY: "auto",
        padding: "16px",
        border: "1px solid #ccc",
      });
      // Set top position based on the last selection's vertical position (if available)
      if (this.lastSelectionRect) {
        const topPosition = this.lastSelectionRect.top + window.scrollY + 10; // 10px offset below the selection
        this.floatingSummary.style.top = `${topPosition}px`;
      } else {
        this.floatingSummary.style.top = "20px"; // fallback position
      }
      document.body.appendChild(this.floatingSummary);
    }
    if (!this.summaryRoot) {
      this.summaryRoot = createRoot(this.floatingSummary);
    }
    // Render the Chat component with the selected text.
    this.summaryRoot.render(
      <Chat
        initialUserMessage={selectedText}
        systemPrompt={summarizeTextSystemMessage()}
      />
    );
  }

  // Public method to add new actions
  public addAction(
    name: string,
    handler: (selectedText: string) => void
  ): void {
    this.actions.push({ name, handler });
  }
}

// Initialize the tooltip
const selectionTooltip = new SelectionTooltip();

// Export for potential use in other extension scripts
export default selectionTooltip;
