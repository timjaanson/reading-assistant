// Function to check if a URL is a PDF
function isPdfUrl(url: string): boolean {
  // Check for common PDF URL patterns
  return (
    url.endsWith(".pdf") || // Direct PDF file
    url.endsWith(".PDF") ||
    url.includes(".pdf?") || // PDF with query params
    url.includes(".PDF?") ||
    url.includes("content-type=application/pdf") || // Content-type in URL
    (url.includes("content-disposition=inline") && url.includes(".pdf")) || // Inline disposition
    url.includes("https://arxiv.org/pdf/")
  );
}

// Listen for tab updates to detect PDF navigations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url && isPdfUrl(tab.url)) {
    // Skip URLs that are already using our PDF viewer
    if (tab.url.includes("pdf-viewer.html")) {
      return;
    }

    // Skip Chrome's PDF viewer URL
    if (
      tab.url.startsWith("chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/")
    ) {
      return;
    }

    // Redirect to our custom PDF viewer with the PDF URL as a parameter
    const viewerUrl = chrome.runtime.getURL(
      `pdf-viewer.html?url=${encodeURIComponent(tab.url)}`
    );
    chrome.tabs.update(tabId, { url: viewerUrl });
  }
});

// Handle PDF downloads
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (item.mime === "application/pdf") {
    // If the user is trying to download a PDF, let Chrome handle it normally
    suggest();
  }
});
