import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import PdfViewer from "./PdfViewer";
import "../global.css";
import { ThemeProvider } from "../theme/theme-provider";

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

  return (
    <ThemeProvider>
      <PdfViewer url={pdfUrl} />
    </ThemeProvider>
  );
}

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
