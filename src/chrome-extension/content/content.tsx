// Import the built global.css asset via Vite so that we get the hashed filename.
import { FloatingSummaryWindow } from "../common/floating/FloatingSummaryWindow";
import { FloatingExplainWindow } from "../common/floating/FloatingExplainWindow";
import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import globalCssUrl from "../global.css?url";
import {
  getExtensionSettings,
  urlMatchesAllowedUrls,
} from "../storage/extensionSettings";
import { FloatingFreePromptWindow } from "../common/floating/FloatingFreePromptWindow";

(function injectReadingAssistantShadowDomRoot() {
  const hostDiv = document.createElement("div");
  hostDiv.id = "reading-assistant-shadow-dom-root";
  hostDiv.style.all = "unset";
  hostDiv.style.position = "absolute";
  hostDiv.style.top = "0";
  hostDiv.style.left = "0";
  hostDiv.style.width = "100%";
  hostDiv.style.height = "100%";
  hostDiv.style.pointerEvents = "none";
  hostDiv.style.zIndex = "10001";
  document.body.appendChild(hostDiv);
  const shadowRoot = hostDiv.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  // chrome.runtime.getURL will prepend the extension URL to the hashed asset path.
  link.href = chrome.runtime.getURL(globalCssUrl);
  link.rel = "stylesheet";
  link.type = "text/css";
  shadowRoot.appendChild(link);
})();

export class ContentSelectionTooltip extends BaseSelectionTooltip {
  constructor() {
    super("reading-assistant-shadow-dom-root");
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

new ContentSelectionTooltip();
