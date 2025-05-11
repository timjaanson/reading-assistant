import { compile, HtmlToTextOptions } from "html-to-text";
import {
  BackgroundCommunicationMessageType,
  TabContentResponse,
} from "../types/background-communication";

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
        maxColumnWidth: 500,
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
 * Gets the HTML and URL from the active tab and converts HTML to text
 * @returns Object with processed text, URL, success status, and any error
 */
export async function getActiveTabContent(): Promise<TabContentResult> {
  try {
    const response = await chrome.runtime.sendMessage<
      { type: BackgroundCommunicationMessageType.EXTRACT_ACTIVE_TAB_CONTENT },
      TabContentResponse
    >({ type: BackgroundCommunicationMessageType.EXTRACT_ACTIVE_TAB_CONTENT });

    if (!response) {
      const errorMsg = "Unknown error getting page content from background";
      console.error(errorMsg);
      return {
        text: "",
        url: "",
        success: false,
        error: errorMsg,
      };
    }

    if (!response.success) {
      const errorMsg =
        response.error || "Unknown error getting page content from background";
      console.error(errorMsg);
      return {
        text: "",
        url: response.url || "",
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
