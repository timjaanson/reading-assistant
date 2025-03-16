import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import PdfViewer from "../components/PdfViewer";
import "../global.css";
// Import the selection tooltip
import "./selection-tooltip";

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
      console.log("Decoded URL:", decodeURIComponent(url));

      // Decode the URL if it's encoded
      setPdfUrl(decodeURIComponent(url));
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
