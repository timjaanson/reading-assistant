import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import PdfViewer from "../components/PdfViewer";
import "../global.css";
import globalCssUrl from "../global.css?url";
import { PdfSelectionTooltip } from "./PdfSelectionTooltip";

// Add some basic styling for the PDF viewer
const styles = `
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.pdf-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
}

.pdf-controls button {
  padding: 6px 12px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.pdf-controls button:hover {
  background-color: #f9f9f9;
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-document-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  background-color: #666;
  padding: 20px;
}

.react-pdf__Document {
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
`;

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

// Add the styles to the document
const styleElement = document.createElement("style");
styleElement.textContent = styles;
document.head.appendChild(styleElement);

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
