import React, { useMemo, useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(pdfjsWorker);

interface PdfViewerProps {
  url: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.2);

  useEffect(() => {
    document.title = url.split("/").pop() || "Document";
  }, [url]);

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

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  }

  function downloadPdf() {
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // New function to copy URL to clipboard
  function copyUrl() {
    navigator.clipboard
      .writeText(url)
      .then(() => console.log("URL copied to clipboard"))
      .catch((err) => console.error("Error copying URL", err));
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-background border-b">
        <div className="flex flex-grow items-center gap-3">
          <div className="items-center">Pages: {numPages}</div>
          <Button size="sm" onClick={zoomOut}>
            Zoom -
          </Button>
          <Button size="sm" onClick={zoomIn}>
            Zoom +
          </Button>
          <Separator orientation="vertical" />
          <div className="flex flex-grow items-center gap-2">
            <span className="text-sm">URL:</span>
            <Input
              type="text"
              readOnly
              value={url}
              className="w-full max-w-96"
            />
            <Button size="sm" onClick={copyUrl}>
              Copy
            </Button>
          </div>
        </div>

        <Button size="sm" onClick={downloadPdf}>
          Download PDF
        </Button>
      </div>

      <div
        id="pdf-document-container"
        className="flex-1 overflow-auto flex justify-center bg-[#666] p-5 relative"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
            if (error instanceof Error) {
              console.error("Error message:", error.message);
              console.error("Error stack:", error.stack);
            } else {
              console.error("Unknown error type:", typeof error, error);
            }
          }}
          options={pdfOptions}
          className="bg-background shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => {
              const pageNumberValue = index + 1;
              return (
                <div
                  key={`page_container_${pageNumberValue}`}
                  className="relative"
                  data-page-number={pageNumberValue}
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
