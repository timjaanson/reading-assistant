// Import the built global.css asset via Vite so that we get the hashed filename.
import { FloatingSummaryWindow } from "../common/floating/FloatingSummaryWindow";
import { FloatingExplainWindow } from "../common/floating/FloatingExplainWindow";
import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import globalCssUrl from "../global.css?url";
import {
  getExtensionSettings,
  urlMatchesAllowedUrls,
} from "../storage/extensionSettings";

// Inject the global stylesheet using the hashed asset URL.
(function injectTailwindStyles() {
  const link = document.createElement("link");
  // chrome.runtime.getURL will prepend the extension URL to the hashed asset path.
  link.href = chrome.runtime.getURL(globalCssUrl);
  link.rel = "stylesheet";
  link.type = "text/css";
  document.head.appendChild(link);
})();

export class ContentSelectionTooltip extends BaseSelectionTooltip {
  constructor() {
    super();
    this.addAction("Summary", (selectedText: string) => {
      this.showFloatingWindow(FloatingSummaryWindow, selectedText);
    });

    this.addAction("Explain", (selectedText: string) => {
      this.showFloatingWindow(FloatingExplainWindow, selectedText);
    });

    // Set up message listener for context menu actions
    this.setupMessageListener();
  }

  protected async setupEventListeners(): Promise<void> {
    const settings = await getExtensionSettings();
    const currentUrl = window.location.href;
    const allowedUrls = settings.whenSelectingText.hoveringTooltip.allowedUrls;
    if (
      settings.whenSelectingText.hoveringTooltip.active &&
      urlMatchesAllowedUrls(currentUrl, allowedUrls)
    ) {
      // For content pages, we listen to events on the document
      document.addEventListener("mouseup", this.handleMouseUp.bind(this));
      document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      sender;
      if (message.action === "openFloatingWindow" && message.selectedText) {
        if (message.windowType === "summary") {
          this.showFloatingWindow(FloatingSummaryWindow, message.selectedText);
          sendResponse({ success: true });
        } else if (message.windowType === "explain") {
          this.showFloatingWindow(FloatingExplainWindow, message.selectedText);
          sendResponse({ success: true });
        }
        return true; // Indicates async response
      }
    });
  }
}

new ContentSelectionTooltip();
