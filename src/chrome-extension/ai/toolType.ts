export enum ToolName {
  EXTRACT_ACTIVE_TAB_CONTENT = "extractActiveTabContent",
  EXTRACT_URLS_CONTENT = "extractUrlsContent",
  WEB_SEARCH = "webSearch",
}

export type ToolParameterFixResult =
  | {
      fixed: true;
      fixedParameters: Record<string, unknown>;
    }
  | {
      fixed: false;
    };
