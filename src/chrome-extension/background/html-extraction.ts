export interface TabContentResponse {
  html: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Extracts the HTML content and URL of the currently active tab
 * @returns Object containing HTML content, URL, success status, and any error message
 */
async function extractActiveTabContent(): Promise<TabContentResponse> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.id) {
      console.error("No active tab found");
      return {
        html: "",
        url: "",
        success: false,
        error: "No active tab found",
      };
    }

    // Store whether URL is available
    const hasUrl = !!tab.url;
    const url = tab.url || "";

    if (!hasUrl) {
      console.warn(
        "Active tab URL not available, will try to extract content anyway"
      );
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
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

    // If we have HTML but no URL, it's a partial success
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
  if (request.action === "getActiveTabHTML") {
    extractActiveTabContent()
      .then((result) => {
        if (result.success) {
          console.log(
            `Successfully retrieved HTML (${result.html.length} bytes) from ${result.url}`
          );
        } else {
          console.warn(`Failed to retrieve HTML: ${result.error}`);
        }
        sendResponse(result);
      })
      .catch((error) => {
        // This should never happen since extractActiveTabContent handles errors internally
        console.error("Unexpected error in getActiveTabHTML:", error);
        sendResponse({
          html: "",
          url: "",
          success: false,
          error: "Unexpected error occurred",
        });
      });

    return true;
  }
});
