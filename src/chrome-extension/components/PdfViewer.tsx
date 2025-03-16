import React, { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Import the worker script directly
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Set worker URL using Chrome extension URL mechanism
pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(pdfjsWorker);

interface PdfViewerProps {
  url: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: chrome.runtime.getURL("cmaps/"),
      cMapPacked: true,
    }),
    []
  );

  console.log(`Rendering PDFViewer - Page ${pageNumber} of ${numPages}`);

  useEffect(() => {
    console.log(`Page changed to ${pageNumber}`);
    // You could add any cleanup here if needed
  }, [pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log(`Document loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    //setPageNumber(1);
  }

  function changePage(offset: number) {
    console.log(
      `Attempting to change page: current=${pageNumber}, offset=${offset}`
    );
    const newPage = pageNumber + offset;
    console.log(`New page will be: ${newPage}`);

    if (numPages !== null) {
      if (newPage >= 1 && newPage <= numPages) {
        console.log(`Setting page to ${newPage}`);
        setPageNumber(newPage);
      } else {
        console.log(`Page ${newPage} is out of bounds (1-${numPages})`);
      }
    } else {
      console.log("No pages loaded yet");
    }
  }

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  }

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-controls">
        <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages || "--"}
        </span>
        <button
          onClick={() => changePage(1)}
          disabled={numPages === null || pageNumber >= numPages}
        >
          Next
        </button>
        <button onClick={zoomOut}>Zoom -</button>
        <button onClick={zoomIn}>Zoom +</button>
      </div>

      <div className="pdf-document-container">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
            // Try to log more details about the error
            if (error instanceof Error) {
              console.error("Error message:", error.message);
              console.error("Error stack:", error.stack);
            } else {
              console.error("Unknown error type:", typeof error, error);
            }
          }}
          options={pdfOptions}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onRenderSuccess={() =>
              console.log(`Page ${pageNumber} rendered successfully`)
            }
            onRenderError={(error) =>
              console.error(`Error rendering page ${pageNumber}:`, error)
            }
          />
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
