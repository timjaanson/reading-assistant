import React, { useMemo, useState, useRef, useEffect } from "react";
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
  const [scale, setScale] = useState<number>(1.2);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const visiblePageRef = useRef(1);
  useEffect(() => {
    visiblePageRef.current = visiblePage;
  }, [visiblePage]);

  const pageRefs = useRef(new Map<number, HTMLDivElement | null>());
  const registerRef = (pageNum: number) => (el: HTMLDivElement | null) => {
    pageRefs.current.set(pageNum, el);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let mostVisible = visiblePageRef.current;
        entries.forEach((entry) => {
          const page = parseInt(
            entry.target.getAttribute("data-page-number") || "0",
            10
          );
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisible = page;
          }
        });
        if (mostVisible !== visiblePageRef.current) {
          setVisiblePage(mostVisible);
        }
      },
      // { threshold: [0, 0.25, 0.5, 0.75, 1] }
      { threshold: 0.5 }
    );

    pageRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: chrome.runtime.getURL("cmaps/"),
      cMapPacked: true,
    }),
    []
  );

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log(`Document loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
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

      <div
        id="pdf-document-container"
        className="pdf-document-container relative"
      >
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
          {numPages &&
            Array.from({ length: numPages }, (_, index) => {
              const pageNumberValue = index + 1;
              return (
                <div
                  key={`page_container_${pageNumberValue}`}
                  className="relative"
                  data-page-number={pageNumberValue}
                  ref={registerRef(pageNumberValue)}
                  id={
                    pageNumberValue === visiblePage
                      ? "ar-pdf-viewer-most-visible-page"
                      : undefined
                  }
                >
                  <Page
                    pageNumber={pageNumberValue}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={() =>
                      console.log(
                        `Page ${pageNumberValue} rendered successfully`
                      )
                    }
                    onRenderError={(error) =>
                      console.error(
                        `Error rendering page ${pageNumberValue}:`,
                        error
                      )
                    }
                  />
                </div>
              );
            })}
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
