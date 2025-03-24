import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import PdfViewer from "../components/PdfViewer";
import "../global.css";
import globalCssUrl from "../global.css?url";
import { PdfSelectionTooltip } from "./PdfSelectionTooltip";

function PdfViewerApp() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get the PDF URL from the query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const url = queryParams.get("url");

    if (url) {
      // Log the URL being loaded
      console.log("Attempting to load PDF from URL:", url);
      const decodedUrl = decodeURIComponent(url);
      console.log("Decoded URL:", decodedUrl);

      // Decode the URL if it's encoded
      setPdfUrl(decodedUrl);
    } else {
      console.error("No PDF URL provided in query parameters");
    }
  }, []);

  if (!pdfUrl) {
    return <div className="pdf-error">No PDF URL provided</div>;
  }

  return <PdfViewer url={pdfUrl} />;
}

// Inject the global stylesheet using the hashed asset URL.
(function injectTailwindStyles() {
  const link = document.createElement("link");
  // chrome.runtime.getURL will prepend the extension URL to the hashed asset path.
  link.href = chrome.runtime.getURL(globalCssUrl);
  link.rel = "stylesheet";
  link.type = "text/css";
  document.head.appendChild(link);
})();

// Initialize the PDF selection tooltip
new PdfSelectionTooltip();

// Render the component
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PdfViewerApp />
    </React.StrictMode>
  );
}
