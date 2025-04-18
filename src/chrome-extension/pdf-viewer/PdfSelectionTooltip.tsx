import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import { FloatingExplainWindow } from "../common/floating/FloatingExplainWindow";
import { FloatingSummaryWindow } from "../common/floating/FloatingSummaryWindow";
import {
  getExtensionSettings,
  MATCHED_URLS_PDF_SPECIAL_CASE,
} from "../storage/extensionSettings";
import { FloatingFreePromptWindow } from "../common/floating/FloatingFreePromptWindow";

export class PdfSelectionTooltip extends BaseSelectionTooltip {
  constructor() {
    super("ar-pdf-viewer-most-visible-page");
    this.addAction("Summary", (selectedText: string) => {
      this.showFloatingWindow(FloatingSummaryWindow, selectedText);
    });

    this.addAction("Explain", (selectedText: string) => {
      this.showFloatingWindow(FloatingExplainWindow, selectedText);
    });

    this.addAction("Custom", (selectedText: string) => {
      this.showFloatingWindow(FloatingFreePromptWindow, selectedText);
    });

    // Set up message listener for context menu actions
    this.setupMessageListener();
  }

  protected async setupEventListeners(): Promise<void> {
    const settings = await getExtensionSettings();
    if (
      settings.whenSelectingText.hoveringTooltip.active &&
      settings.whenSelectingText.hoveringTooltip.allowedUrls.includes(
        MATCHED_URLS_PDF_SPECIAL_CASE
      )
    ) {
      // For PDF viewer, we initially attach to document as fallback
      document.addEventListener("mouseup", this.handleMouseUp.bind(this));
      document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      sender;
      if (message.action === "openFloatingWindow" && message.selectedText) {
        if (message.windowType === "reading-assistant-summary") {
          this.showFloatingWindow(FloatingSummaryWindow, message.selectedText);
          sendResponse({ success: true });
        } else if (message.windowType === "reading-assistant-explain") {
          this.showFloatingWindow(FloatingExplainWindow, message.selectedText);
          sendResponse({ success: true });
        } else if (message.windowType === "reading-assistant-custom") {
          this.showFloatingWindow(
            FloatingFreePromptWindow,
            message.selectedText
          );
          sendResponse({ success: true });
        }
        return true; // Indicates async response
      }
    });
  }
}
