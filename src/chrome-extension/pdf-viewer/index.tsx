import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import PdfViewer from "./PdfViewer";
import "../global.css";
import { ThemeProvider } from "../theme/theme-provider";
import {
  BackgroundCommunicationMessageType,
  TabContentResponse,
} from "../types/background-communication";

function PdfViewerApp() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
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

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PdfViewerApp />
    </React.StrictMode>
  );
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (
    request.type ===
    BackgroundCommunicationMessageType.EXTRACT_ACTIVE_PDF_TAB_CONTENT
  ) {
    if (document.visibilityState === "hidden") {
      console.debug(
        "Pdf-viewer tab/window loaded but not the currently selected tab, ignoring request",
        document.URL
      );
      // pdf tab/window loaded but not the currently selected tab
      return undefined;
    }
    console.debug("Received message in pdf-viewer:", document.URL);
    const pdfRootUrl = new URL(document.URL);
    const urlString = pdfRootUrl.searchParams.get("url");

    if (!urlString) {
      sendResponse({
        html: "",
        url: "",
        success: false,
        error: "No URL found in query parameters",
      } satisfies TabContentResponse);
      return true;
    }

    const pdfSourceUrl = new URL(urlString);
    const pdfViewerHtml = document.documentElement.outerHTML;

    console.debug(
      "Sending response from pdf-viewer where original pdf url is:",
      pdfSourceUrl.toString()
    );

    sendResponse({
      html: pdfViewerHtml,
      url: pdfSourceUrl.toString(),
      success: true,
    } satisfies TabContentResponse);

    return true;
  }

  return undefined;
});
