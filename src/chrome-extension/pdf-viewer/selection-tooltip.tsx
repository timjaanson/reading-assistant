import { createRoot } from "react-dom/client";
import Chat from "../components/Chat";
import { summarizeTextSystemMessage } from "../ai/prompts";

// Based on the original SelectionTooltip from content.tsx, but adapted for the PDF viewer
export class PdfSelectionTooltip {
  private tooltip: HTMLElement | null = null;
  private actions: { name: string; handler: (selectedText: string) => void }[] =
    [];
  private floatingSummary: HTMLElement | null = null;
  private summaryRoot: ReturnType<typeof createRoot> | null = null;
  private lastSelectionRect: DOMRect | null = null;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    // Add initial action
    this.addAction("Summary", (selectedText: string) => {
      this.showSummaryReact(selectedText);
    });

    // Set up event listeners on the PDF viewer text layer
    this.setupPdfTextLayerListeners();
  }

  private setupPdfTextLayerListeners(): void {
    // We need to observe DOM changes to catch when the PDF.js text layer is added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Look for text layers in the added nodes
          mutation.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              (node.classList.contains("react-pdf__Page__textContent") ||
                node.classList.contains("textLayer"))
            ) {
              // Found a text layer, add our event listeners
              node.addEventListener("mouseup", this.handleMouseUp.bind(this));
              node.addEventListener(
                "mousedown",
                this.handleMouseDown.bind(this)
              );
            }
          });
        }
      });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also attach to the document for fallback
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }

  private handleMouseUp(event: MouseEvent): void {
    // Do not show tooltip if summary window is open.
    if (this.floatingSummary) {
      return;
    }
    if (
      this.tooltip &&
      event.target instanceof Node &&
      this.tooltip.contains(event.target)
    ) {
      // If mouseup occurred within the tooltip, do nothing.
      return;
    }

    const selection = window.getSelection();
    // Check that there is selected text.
    if (
      selection &&
      !selection.isCollapsed &&
      selection.toString().trim().length > 0
    ) {
      // Save the selection rectangle for positioning the floating summary later
      const range = selection.getRangeAt(0);
      this.lastSelectionRect = range.getBoundingClientRect();

      // Show the tooltip
      this.showTooltip(selection, event);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    // Only hide tooltip if summary window is not open.
    if (
      this.tooltip &&
      event.target instanceof Node &&
      !this.tooltip.contains(event.target)
    ) {
      this.hideTooltip();
    }
  }

  private showTooltip(selection: Selection, event: MouseEvent): void {
    // Remove any existing tooltip.
    this.hideTooltip();

    // Capture the selected text.
    const capturedText = selection.toString();

    // Create tooltip element.
    this.tooltip = document.createElement("div");
    this.tooltip.className = "assisted-reading-tooltip";

    // Style the tooltip.
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

    // Create a container for the action button(s)
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "12px";

    // Add the action button(s)
    this.actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.name;
      button.addEventListener("click", () => {
        action.handler(capturedText);
      });
      // Style the button.
      Object.assign(button.style, {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        border: "none",
        padding: "4px 8px",
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

    // Position the tooltip relative to the mouse position.
    this.tooltip.style.left = `${
      event.clientX + window.scrollX - (this.tooltip.offsetWidth || 0) / 2
    }px`;
    this.tooltip.style.top = `${event.clientY + window.scrollY - 10}px`;

    // Add tooltip to the DOM.
    document.body.appendChild(this.tooltip);

    // After the tooltip is rendered, adjust its position
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

  private hideTooltip(): void {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  private closeSummaryWindow(): void {
    if (this.floatingSummary && this.floatingSummary.parentNode) {
      this.floatingSummary.parentNode.removeChild(this.floatingSummary);
    }
    this.floatingSummary = null;
    this.summaryRoot = null;
    this.isDragging = false;
  }

  private showSummaryReact(selectedText: string): void {
    // Close the tooltip if it's visible.
    this.hideTooltip();

    // If a summary window already exists, do not recreate or update it.
    if (this.floatingSummary) {
      return;
    }

    // Create the summary window container.
    this.floatingSummary = document.createElement("div");
    this.floatingSummary.className = "floating-summary";
    Object.assign(this.floatingSummary.style, {
      all: "unset",
      position: "absolute",
      minWidth: "150px",
      maxWidth: "40vw",
      width: "400px",
      height: "400px",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(8px)",
      color: "#000",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: "10000",
      border: "1px solid #ccc",
      display: "flex",
      flexDirection: "column",
    });

    // Calculate position based on viewport and scroll position
    const viewportWidth = window.innerWidth;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Position the window near the selection or in the middle of viewport
    if (this.lastSelectionRect) {
      const topPosition = this.lastSelectionRect.top + scrollY;
      const leftPosition = Math.min(
        this.lastSelectionRect.left + scrollX,
        scrollX + viewportWidth - 420 // account for window width + margin
      );
      this.floatingSummary.style.top = `${topPosition}px`;
      this.floatingSummary.style.left = `${leftPosition}px`;
    } else {
      // Fallback to center of viewport
      this.floatingSummary.style.top = `${scrollY + 100}px`;
      this.floatingSummary.style.left = `${
        scrollX + (viewportWidth / 2 - 200)
      }px`;
    }
    document.body.appendChild(this.floatingSummary);

    // Create a header bar for the summary window.
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "2px 4px",
      backgroundColor: "rgba(255,255,255,0.2)",
      backdropFilter: "blur(8px)",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#333",
      cursor: "grab",
      userSelect: "none",
    });

    // Add drag functionality
    const handleDragStart = (e: MouseEvent) => {
      if (this.floatingSummary) {
        this.isDragging = true;
        this.dragOffset = {
          x: e.pageX - parseInt(this.floatingSummary.style.left),
          y: e.pageY - parseInt(this.floatingSummary.style.top),
        };

        header.style.cursor = "grabbing";
        e.preventDefault();
      }
    };

    const handleDrag = (e: MouseEvent) => {
      if (this.isDragging && this.floatingSummary) {
        const newX = e.pageX - this.dragOffset.x;
        const newY = e.pageY - this.dragOffset.y;

        const docWidth = Math.max(
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth
        );
        const docHeight = Math.max(
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight
        );

        const windowWidth = this.floatingSummary.offsetWidth;
        const windowHeight = this.floatingSummary.offsetHeight;

        const maxX = docWidth - windowWidth;
        const maxY = docHeight - windowHeight;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        this.floatingSummary.style.left = `${constrainedX}px`;
        this.floatingSummary.style.top = `${constrainedY}px`;
      }
    };

    const handleDragEnd = () => {
      this.isDragging = false;
      if (header) {
        header.style.cursor = "grab";
      }
    };

    // Add mouse event listeners
    header.addEventListener("mousedown", handleDragStart);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);

    // Clean up event listeners when window is closed
    const cleanup = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    // Add cleanup to existing close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "✖";
    Object.assign(closeButton.style, {
      cursor: "pointer",
      background: "transparent",
      border: "none",
      fontSize: "12px",
      lineHeight: "1",
      color: "#333",
      padding: "2px 2px",
      marginRight: "2px",
    });
    closeButton.addEventListener("click", () => {
      cleanup();
      this.closeSummaryWindow();
    });

    const title = document.createElement("span");
    title.textContent = "Summary";
    header.appendChild(title);
    header.appendChild(closeButton);
    this.floatingSummary.appendChild(header);

    // Create a content container for the Chat component.
    const contentContainer = document.createElement("div");
    Object.assign(contentContainer.style, {
      flex: "1",
      overflowY: "auto",
      padding: "0px",
    });
    this.floatingSummary.appendChild(contentContainer);

    // Render the Chat component into the content container.
    this.summaryRoot = createRoot(contentContainer);
    this.summaryRoot.render(
      <Chat
        initialUserMessage={selectedText}
        systemPrompt={summarizeTextSystemMessage()}
        collapseInitialMessage={true}
        compact={true}
      />
    );
  }

  // Public method to add new actions.
  public addAction(
    name: string,
    handler: (selectedText: string) => void
  ): void {
    this.actions.push({ name, handler });
  }
}

// Initialize and export for use in the PDF viewer
export default new PdfSelectionTooltip();
