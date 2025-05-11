import {
  BackgroundCommunicationMessageType,
  TabContentResponse,
} from "../types/background-communication";

/**
 * Extracts the HTML content and URL of the currently active tab, including extension's internal pdf viewer
 * @returns Object containing HTML content, URL, success status, and any error message
 */
async function extractActiveTabContent(): Promise<TabContentResponse> {
  let activeTab: chrome.tabs.Tab | undefined;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    activeTab = tab;
  } catch (error) {}

  if (!activeTab || !activeTab.id || !activeTab.url) {
    //if no active tab, might be because of extension internal pdf viewer
    try {
      const response = await chrome.runtime.sendMessage<
        {
          type: BackgroundCommunicationMessageType.EXTRACT_ACTIVE_PDF_TAB_CONTENT;
        },
        TabContentResponse
      >({
        type: BackgroundCommunicationMessageType.EXTRACT_ACTIVE_PDF_TAB_CONTENT,
      });

      if (response) {
        return response;
      }
    } catch (error) {
      console.error(
        "Error in extractActiveTabContent for PDF listener:",
        error
      );
    }
  }

  try {
    console.debug("Tab in background call:", activeTab);

    if (!activeTab || !activeTab.id) {
      console.error("No active tab found");
      return {
        html: "",
        url: "",
        success: false,
        error: "No active tab found",
      };
    }

    // Store whether URL is available
    const hasUrl = !!activeTab.url;
    const url = activeTab.url || "";

    if (!hasUrl) {
      console.warn(
        "Active tab URL not available, will try to extract content anyway"
      );
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        return document.documentElement.outerHTML as string;
      },
    });

    if (!results || results.length === 0) {
      console.error("Script execution failed");
      return {
        html: "",
        url,
        success: false,
        error:
          "Script execution failed" + (!hasUrl ? " and URL not available" : ""),
      };
    }

    const html = results[0].result as string;

    if (!hasUrl) {
      return {
        html,
        url: "Active tab URL not available",
        success: true,
        error: "Active tab URL not available, but HTML was retrieved",
      };
    }

    return { html, url, success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error getting page content:", error);
    return {
      html: "",
      url: "",
      success: false,
      error: errorMessage,
    };
  }
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (
    request.type ===
    BackgroundCommunicationMessageType.EXTRACT_ACTIVE_TAB_CONTENT
  ) {
    extractActiveTabContent()
      .then(sendResponse)
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error in listener";
        console.error("Error in EXTRACT_CONTENT listener:", error);
        sendResponse({
          html: "",
          url: "",
          success: false,
          error: errorMessage,
        });
      });
    return true;
  }
  return undefined;
});
