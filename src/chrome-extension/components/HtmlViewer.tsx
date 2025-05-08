import { useState } from "react";
import { getActiveTabHTML } from "../util/pageContent";
import { Button } from "@/components/ui/button";

export function HtmlViewer() {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHtml = async () => {
    setLoading(true);
    setError(null);

    try {
      const pageHtml = await getActiveTabHTML();
      setHtml(pageHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHtml(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Page HTML Viewer</h3>

      <Button onClick={fetchHtml} disabled={loading}>
        {loading ? "Loading..." : "Get HTML"}
      </Button>

      {error && <div>Error: {error}</div>}

      {html && (
        <div>
          <h4>HTML Content:</h4>
          <pre>{html}</pre>
        </div>
      )}
    </div>
  );
}
