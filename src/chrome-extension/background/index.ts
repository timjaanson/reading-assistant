import { setupPdfHandler } from "./pdf-handler";

setupPdfHandler();

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .catch((error) => console.error(error));

console.log("Reading assistant background script loaded");
