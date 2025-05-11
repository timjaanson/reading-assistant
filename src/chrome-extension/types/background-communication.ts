export enum BackgroundCommunicationMessageType {
  EXTRACT_ACTIVE_TAB_CONTENT = "EXTRACT_ACTIVE_TAB_CONTENT",
  EXTRACT_ACTIVE_PDF_TAB_CONTENT = "EXTRACT_ACTIVE_PDF_TAB_CONTENT",
}

export interface TabContentResponse {
  html: string;
  url: string;
  success: boolean;
  error?: string;
}
