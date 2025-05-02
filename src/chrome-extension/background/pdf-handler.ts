function isPdfUrl(url: string): boolean {
  return (
    url.endsWith(".pdf") ||
    url.endsWith(".PDF") ||
    url.includes(".pdf?") ||
    url.includes(".PDF?") ||
    url.includes("content-type=application/pdf") ||
    (url.includes("content-disposition=inline") && url.includes(".pdf")) ||
    url.includes("https://arxiv.org/pdf/")
  );
}

export function setupPdfHandler() {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0 || !details.url || !isPdfUrl(details.url)) {
      return;
    }

    if (details.url.includes("pdf-viewer.html")) {
      return;
    }

    // Skip Chrome's PDF viewer URL
    if (
      details.url.startsWith(
        "chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/"
      )
    ) {
      return;
    }

    // Redirect to our custom PDF viewer with the PDF URL as a parameter
    const viewerUrl = chrome.runtime.getURL(
      `pdf-viewer.html?url=${encodeURIComponent(details.url)}`
    );
    chrome.tabs.update(details.tabId, { url: viewerUrl });
  });

  // Handle PDF downloads
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (item.mime === "application/pdf") {
      // If the user is trying to download a PDF, let Chrome handle it normally
      suggest();
    }
  });

  console.log("PDF handler initialized.");
}
