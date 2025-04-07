import { getExtensionSettings } from "../storage/extensionSettings";

// Create and manage the extension's context menu items
export async function setupContextMenu() {
  // Remove any existing context menu items first to avoid duplicates
  chrome.contextMenus.removeAll();

  // Get current extension settings
  const settings = await getExtensionSettings();

  // Only create context menu items if enabled in settings
  if (settings.whenSelectingText.contextMenu.active) {
    // Add Summary option
    chrome.contextMenus.create({
      id: "reading-assistant-summary",
      title: "Summary",
      contexts: ["selection"],
    });

    // Add Explain option
    chrome.contextMenus.create({
      id: "reading-assistant-explain",
      title: "Explain",
      contexts: ["selection"],
    });

    // Add Custom option
    chrome.contextMenus.create({
      id: "reading-assistant-custom",
      title: "Custom",
      contexts: ["selection"],
    });

    // Set up click handler for the context menu items
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (
        tab?.active &&
        tab?.id &&
        info.menuItemId.toString().startsWith("reading-assistant") &&
        info.selectionText
      ) {
        const selectedText = info.selectionText;

        const message = {
          action: "openFloatingWindow",
          selectedText,
          windowType: info.menuItemId,
        };

        // Send message to the appropriate context
        sendMessageToTab(tab.id, tab.url || "", message);
      }
    });
  }
}

/**
 * Send a message to the appropriate context based on the URL
 * Handles both regular content scripts and our custom PDF viewer
 */
function sendMessageToTab(tabId: number, url: string, message: any) {
  try {
    // Send the message to the tab
    chrome.tabs.sendMessage(tabId, message, (response) => {
      // Check for error, if there's an error, it might be because
      // we're in the PDF viewer which uses a different content script
      if (chrome.runtime.lastError) {
        console.log("Error sending message:", chrome.runtime.lastError.message);

        // If we get an error and we're in the PDF viewer, try to reload the page
        // This is a workaround for cases where the PDF viewer is loaded but the message listener isn't ready
        if (url.includes("pdf-viewer.html")) {
          console.log(
            "Detected PDF viewer, reloading to ensure message listener is ready"
          );
          chrome.tabs.reload(tabId);

          // After a short delay, try sending the message again
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, message);
          }, 1000);
        }
      } else {
        console.log("Message sent successfully:", response);
      }
    });
  } catch (error) {
    console.error("Error sending message to tab:", error);
  }
}

// Listen for changes to extension settings and update the context menu accordingly
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.extensionSettings) {
    setupContextMenu();
  }
});
