import { createRoot } from "react-dom/client";

export interface FloatingEmbeddedWindowOptions {
  width: string;
  height: string;
  parentId?: string;
}

export interface FloatingWindowShowOptions {
  selectedText: string;
  anchorPoint?: { x: number; y: number };
}

export abstract class AbstractFloatingEmbeddedWindow {
  public isClosed: boolean = false;

  private element: HTMLElement;
  private root: ReturnType<typeof createRoot>;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private header: HTMLElement;
  private contentContainer: HTMLElement;
  private options: FloatingEmbeddedWindowOptions = {
    width: "600px",
    height: "400px",
  };

  private title: string;

  constructor(title: string, options?: Partial<FloatingEmbeddedWindowOptions>) {
    this.title = title;
    this.options = { ...this.options, ...options };
    this.element = this.createContainer();
    this.header = this.createHeader();
    this.contentContainer = this.createContentContainer();

    // Append in correct order
    this.element.appendChild(this.header);
    this.element.appendChild(this.contentContainer);

    // Create root in content container instead of main element
    this.root = createRoot(this.contentContainer);
    this.setupDragHandlers();
    this.addResizeHandles();
  }

  public abstract show(options: FloatingWindowShowOptions): void;

  private createContentContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = `floating-${this.title}-content`;
    Object.assign(container.style, {
      flex: "1",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    });
    return container;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = `floating-${this.title}-header`;
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "2px 4px",
      backgroundColor: "transparent",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#FAFAFA",
      cursor: "grab",
      userSelect: "none",
    });

    const title = document.createElement("span");
    title.textContent =
      this.title.charAt(0).toUpperCase() + this.title.slice(1);

    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    Object.assign(closeButton.style, {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      color: "#FAFAFA",
      padding: "0 4px",
    });
    closeButton.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  private createContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = `floating-${this.title}`;
    Object.assign(container.style, {
      all: "unset",
      position: "absolute",
      width: this.options.width,
      height: this.options.height,
      backgroundColor: "rgba(50, 47, 44, 0.4)",
      backdropFilter: "blur(8px)",
      color: "#FAFAFA",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: "10000",
      border: "1px solid #333",
      display: "flex",
      flexDirection: "column",
    });

    // If we have a parent element, verify it has valid positioning
    if (this.options.parentId) {
      const parent = document.getElementById(this.options.parentId);
      if (parent) {
        const parentPosition = window.getComputedStyle(parent).position;
        // If parent doesn't have valid positioning, remove the parentId option
        if (!["relative", "absolute", "fixed"].includes(parentPosition)) {
          console.warn(
            `Parent element #${this.options.parentId} does not have valid positioning (relative, absolute, or fixed). Falling back to document.body`
          );
          this.options.parentId = undefined;
        }
      } else {
        console.warn(
          `Parent element #${this.options.parentId} not found. Falling back to document.body`
        );
        this.options.parentId = undefined;
      }
    }

    return container;
  }

  private setupDragHandlers(): void {
    const handleDragStart = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && this.header.contains(e.target)) {
        this.isDragging = true;
        const elementLeft =
          parseFloat(this.element.style.left) ||
          this.element.getBoundingClientRect().left + window.scrollX;
        const elementTop =
          parseFloat(this.element.style.top) ||
          this.element.getBoundingClientRect().top + window.scrollY;
        this.dragOffset = {
          x: e.pageX - elementLeft,
          y: e.pageY - elementTop,
        };
        this.header.style.cursor = "grabbing";
        e.preventDefault();
      }
    };

    const handleDrag = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const newLeft = e.pageX - this.dragOffset.x;
      const newTop = e.pageY - this.dragOffset.y;
      this.element.style.left = `${newLeft}px`;
      this.element.style.top = `${newTop}px`;
      e.preventDefault();
    };

    const handleDragEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.header.style.cursor = "grab";
    };

    // Add event listeners
    this.header.addEventListener("mousedown", handleDragStart);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);

    // Cleanup function
    const cleanup = () => {
      this.header.removeEventListener("mousedown", handleDragStart);
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    // Store cleanup function for later use
    (this.element as any)._cleanup = cleanup;
  }

  private addResizeHandles(): void {
    // Create bottom-right handle
    const handleBottomRight = document.createElement("div");
    handleBottomRight.className = `floating-${this.title}-resize-handle-bottom-right`;
    Object.assign(handleBottomRight.style, {
      position: "absolute",
      right: "0px",
      bottom: "0px",
      width: "10px",
      height: "10px",
      cursor: "se-resize",
      background: "transparent",
    });
    handleBottomRight.addEventListener("mousedown", (e) =>
      this.initResize(e, "bottom-right")
    );

    // Create bottom-left handle
    const handleBottomLeft = document.createElement("div");
    handleBottomLeft.className = `floating-${this.title}-resize-handle-bottom-left`;
    Object.assign(handleBottomLeft.style, {
      position: "absolute",
      left: "0px",
      bottom: "0px",
      width: "10px",
      height: "10px",
      cursor: "sw-resize",
      background: "transparent",
    });
    handleBottomLeft.addEventListener("mousedown", (e) =>
      this.initResize(e, "bottom-left")
    );

    // Append the handles to the container element
    this.element.appendChild(handleBottomRight);
    this.element.appendChild(handleBottomLeft);
  }

  private initResize(
    event: MouseEvent,
    handlePosition: "bottom-right" | "bottom-left"
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const initialMouseX = event.clientX;
    const initialMouseY = event.clientY;
    const rect = this.element.getBoundingClientRect();
    const initialWidth = rect.width;
    const initialHeight = rect.height;
    const initialLeft = rect.left;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newLeft = initialLeft;

      if (handlePosition === "bottom-right") {
        // For the bottom-right, add the mouse movement to width and height
        newWidth = initialWidth + (moveEvent.clientX - initialMouseX);
        newHeight = initialHeight + (moveEvent.clientY - initialMouseY);
      } else if (handlePosition === "bottom-left") {
        // For the bottom-left, subtract horizontal movement from width and update left position
        newWidth = initialWidth - (moveEvent.clientX - initialMouseX);
        newHeight = initialHeight + (moveEvent.clientY - initialMouseY);
        newLeft = initialLeft + (moveEvent.clientX - initialMouseX);
      }

      // Optionally enforce minimum dimensions (using minWidth from options and a preset minHeight)
      const minWidth = 100;
      const minHeight = 100; // default minimum height
      if (newWidth < minWidth) {
        if (handlePosition === "bottom-left") {
          // Adjust left so that the width remains at minWidth
          newLeft = initialLeft + (initialWidth - minWidth);
        }
        newWidth = minWidth;
      }
      if (newHeight < minHeight) {
        newHeight = minHeight;
      }

      // Update the container style so that the window size remains changed
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
      if (handlePosition === "bottom-left") {
        this.element.style.left = `${newLeft}px`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  protected renderComponent(options: {
    selectedText: string;
    renderedComponent: React.ReactNode;
    anchorPoint?: { x: number; y: number };
  }): void {
    // Get the container (either parent element or window)
    const parent = this.options.parentId
      ? document.getElementById(this.options.parentId)
      : document.body;

    // Add to DOM early so we can measure dimensions
    if (!parent?.contains(this.element)) {
      if (parent?.shadowRoot) {
        parent.shadowRoot?.appendChild(this.element);
      } else {
        console.warn(
          "Parent element does not have a shadow root, falling back to appending to parent"
        );
        parent?.appendChild(this.element);
      }
    }

    // Position the window relative to anchor point
    if (options.anchorPoint) {
      console.log(
        "Anchor point provided, using anchor point positioning",
        options.anchorPoint
      );

      requestAnimationFrame(() => {
        // Wait for element to be in DOM to get its dimensions
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;

        // Use absolute positioning with page coordinates
        // This will ensure the window moves with page content when scrolling
        const pageX = options.anchorPoint!.x;
        const pageY = options.anchorPoint!.y;

        // Original centered position
        let left = pageX - width / 2;
        let top = pageY - height / 2;

        // Get viewport boundaries
        const rightEdge = window.scrollX + window.innerWidth;
        const bottomEdge = window.scrollY + window.innerHeight;
        const leftEdge = window.scrollX;
        const topEdge = window.scrollY;

        // Calculate how much adjustment is needed for each edge
        const rightOverflow = Math.max(0, left + width - rightEdge + 10);
        const leftOverflow = Math.max(0, leftEdge + 10 - left);
        const bottomOverflow = Math.max(0, top + height - bottomEdge + 10);
        const topOverflow = Math.max(0, topEdge + 10 - top);

        // Make minimal adjustments to stay in viewport while keeping close to mouse
        if (rightOverflow > 0) left -= rightOverflow;
        if (leftOverflow > 0) left += leftOverflow;
        if (bottomOverflow > 0) top -= bottomOverflow;
        if (topOverflow > 0) top += topOverflow;

        // Set position - use absolute positioning for scrolling with content
        this.element.style.position = "absolute";
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;

        // Make sure floating window captures pointer events (unlike parent)
        this.element.style.pointerEvents = "auto";
      });
    } else {
      console.log("No anchor point provided, using center-screen fallback");

      // Center in currently visible viewport using absolute positioning
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const width = parseInt(this.options.width);
      const height = parseInt(this.options.height);

      this.element.style.position = "absolute";
      this.element.style.top = `${Math.max(
        0,
        window.scrollY + (viewportHeight - height) / 2
      )}px`;
      this.element.style.left = `${Math.max(
        0,
        window.scrollX + (viewportWidth - width) / 2
      )}px`;
      this.element.style.pointerEvents = "auto";
    }

    // Render component
    this.root.render(options.renderedComponent);
  }

  public close(): void {
    // Clean up event listeners
    if ((this.element as any)._cleanup) {
      (this.element as any)._cleanup();
    }

    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    // Mark as closed so that callers know this instance is dead.
    this.isClosed = true;
  }
}
