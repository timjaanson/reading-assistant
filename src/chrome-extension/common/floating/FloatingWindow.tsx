import { createRoot } from "react-dom/client";

export interface FloatingEmbeddedWindowOptions {
  width: string;
  height: string;
  minWidth: string;
  maxWidth: string;
}

export class FloatingEmbeddedWindow {
  public isClosed: boolean = false;

  private element: HTMLElement;
  private root: ReturnType<typeof createRoot>;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private header: HTMLElement;
  private contentContainer: HTMLElement;
  private options: FloatingEmbeddedWindowOptions = {
    width: "400px",
    height: "400px",
    minWidth: "150px",
    maxWidth: "40vw",
  };

  private title: string;

  constructor(title: string) {
    this.title = title;
    this.element = this.createContainer();
    this.header = this.createHeader();
    this.contentContainer = this.createContentContainer();

    // Append in correct order
    this.element.appendChild(this.header);
    this.element.appendChild(this.contentContainer);

    // Create root in content container instead of main element
    this.root = createRoot(this.contentContainer);
    this.setupDragHandlers();
  }

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
      minWidth: this.options.minWidth,
      maxWidth: this.options.maxWidth,
      backgroundColor: "rgba(70, 70, 70, 0.4)",
      backdropFilter: "blur(8px)",
      color: "#FAFAFA",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: "10000",
      border: "1px solid #333",
      display: "flex",
      flexDirection: "column",
    });
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

  public renderComponent(options: {
    selectedText: string;
    renderedComponent: React.ReactNode;
    position?: { top: number; left: number };
  }): void {
    // Position the window
    if (options.position) {
      this.element.style.top = `${options.position.top}px`;
      this.element.style.left = `${options.position.left}px`;
    } else {
      // Center in viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = parseInt(this.options.width.split("px")[0]);
      const height = parseInt(this.options.height.split("px")[0]);

      this.element.style.top = `${Math.max(
        0,
        (viewportHeight - height) / 2
      )}px`;
      this.element.style.left = `${Math.max(0, (viewportWidth - width) / 2)}px`;
    }

    // Add to DOM if not already present
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }

    // Render the Chat component
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
