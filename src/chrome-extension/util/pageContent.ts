import { compile, HtmlToTextOptions } from "html-to-text";

/**
 * Response from extracting tab content
 */
export interface TabContentResponse {
  html: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Result type for tab content with processed text
 */
export interface TabContentResult {
  text: string;
  url: string;
  success: boolean;
  error?: string;
}

const htmlToTextOptions = {
  baseElements: {
    selectors: ["article", "main", "#main", "body"],
    orderBy: "occurrence",
    returnDomByDefault: false,
  },

  wordwrap: false,
  longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false },

  decodeEntities: true,
  preserveNewlines: false,

  selectors: [
    ...["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => ({
      selector: h,
      options: {
        uppercase: false,
        leadingLineBreaks: 2,
        trailingLineBreaks: 1,
      },
    })),

    /* LINKS — keep URL, but:                                     *
     *  • drop brackets if text === href                           *
     *  • strip "utm_" & similar query params to save tokens.      */
    {
      selector: "a",
      format: "anchor",
      options: {
        hideLinkHrefIfSameAsText: true,
        linkBrackets: ["<", ">"], // cheaper than default "[ ]"
        pathRewrite: (href: string) => {
          try {
            const u = new URL(href, "http://dummy-base"); // works for both abs/rel
            // Kill common tracking params
            [
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_term",
              "utm_content",
            ].forEach((p) => u.searchParams.delete(p));
            return u.pathname + u.search + u.hash || href;
          } catch {
            return href;
          }
        },
      },
    },

    { selector: "img", format: "skip" },

    { selector: "ul", options: { itemPrefix: " • " } },

    {
      selector: "table",
      format: "dataTable",
      options: {
        maxColumnWidth: 40,
        colSpacing: 2,
        rowSpacing: 1,
        uppercaseHeaderCells: false,
      },
    },
  ],

  limits: {
    maxInputLength: 2_000_000, // 2MB
    maxDepth: 30, // 20 levels of nested elements
    ellipsis: "…",
  },
} satisfies HtmlToTextOptions;

const compiledConvert = compile(htmlToTextOptions);

/**
 * Extracts the HTML content and URL of the currently active tab
 * @returns Object containing HTML content, URL, success status, and any error message
 */
export async function extractActiveTabContent(): Promise<TabContentResponse> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.id) {
      console.error("No active tab found");
      return {
        html: "",
        url: "",
        success: false,
        error: "No active tab found",
      };
    }

    // Store whether URL is available
    const hasUrl = !!tab.url;
    const url = tab.url || "";

    if (!hasUrl) {
      console.warn(
        "Active tab URL not available, will try to extract content anyway"
      );
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return document.documentElement.outerHTML as string;
      },
    });

    if (!results || results.length === 0) {
      console.error("Script execution failed");
      return {
        html: "",
        url,
        success: false,
        error:
          "Script execution failed" + (!hasUrl ? " and URL not available" : ""),
      };
    }

    const html = results[0].result as string;

    // If we have HTML but no URL, it's a partial success
    if (!hasUrl) {
      return {
        html,
        url: "Active tab URL not available",
        success: true,
        error: "Active tab URL not available, but HTML was retrieved",
      };
    }

    return { html, url, success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error getting page content:", error);
    return {
      html: "",
      url: "",
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Gets the HTML and URL from the active tab and converts HTML to text
 * @returns Object with processed text, URL, success status, and any error
 */
export async function getActiveTabContent(): Promise<TabContentResult> {
  try {
    const response = await extractActiveTabContent();

    if (!response || !response.success) {
      const errorMsg = response?.error || "Unknown error getting page content";
      console.error(errorMsg);
      return {
        text: "",
        url: response?.url || "",
        success: false,
        error: errorMsg,
      };
    }

    try {
      const text = compiledConvert(response.html);
      return {
        text,
        url: response.url,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error converting HTML to text";
      console.error(errorMessage);
      return {
        text: "",
        url: response.url,
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in getActiveTabContent:", error);
    return {
      text: "",
      url: "",
      success: false,
      error: errorMessage,
    };
  }
}
