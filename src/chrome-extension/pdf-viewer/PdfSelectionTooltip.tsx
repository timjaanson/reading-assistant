import { BaseSelectionTooltip } from "../common/selection/BaseSelectionTooltip";
import { FloatingExplainWindow } from "../common/floating/FloatingExplainWindow";
import { FloatingSummaryWindow } from "../common/floating/FloatingSummaryWindow";
import {
  getExtensionSettings,
  MATCHED_URLS_PDF_SPECIAL_CASE,
} from "../storage/extensionSettings";

export class PdfSelectionTooltip extends BaseSelectionTooltip {
  constructor() {
    super("ar-pdf-viewer-most-visible-page");
    this.addAction("Summary", (selectedText: string) => {
      this.showFloatingWindow(FloatingSummaryWindow, selectedText);
    });

    this.addAction("Explain", (selectedText: string) => {
      this.showFloatingWindow(FloatingExplainWindow, selectedText);
    });
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
}
