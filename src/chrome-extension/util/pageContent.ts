import { compile, HtmlToTextOptions } from "html-to-text";
import { TabContentResponse } from "../background/html-extraction";

const options = {
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
    maxDepth: 20, // 20 levels of nested elements
    ellipsis: "…",
  },
} satisfies HtmlToTextOptions;

const compiledConvert = compile(options);

/**
 * Result type for tab content with processed text
 */
export interface TabContentResult {
  text: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Gets the HTML from the active tab and converts it to text
 * @returns Processed text from the active tab's HTML or empty string on error
 */
export async function getActiveTabHTML(): Promise<string> {
  try {
    const result = await getActiveTabContent();
    return result.success
      ? result.text
      : result.error || "Unknown error when fetching page content";
  } catch (error) {
    console.error("Error getting active tab HTML:", error);
    return "";
  }
}

/**
 * Gets the HTML and URL from the active tab and converts HTML to text
 * @returns Object with processed text, URL, success status, and any error
 */
export async function getActiveTabContent(): Promise<TabContentResult> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "getActiveTabHTML" },
      (response: TabContentResponse) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          resolve({
            text: "",
            url: "",
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        if (!response || !response.success) {
          const errorMsg =
            response?.error || "Unknown error getting page content";
          console.error(errorMsg);
          resolve({
            text: "",
            url: response?.url || "",
            success: false,
            error: errorMsg,
          });
          return;
        }

        try {
          const text = compiledConvert(response.html);
          resolve({
            text,
            url: response.url,
            success: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error converting HTML to text";
          console.error(errorMessage);
          resolve({
            text: "",
            url: response.url,
            success: false,
            error: errorMessage,
          });
        }
      }
    );
  });
}
