import { setupPdfHandler } from "./pdf-handler";
import { setupContextMenu } from "./context-menu";
import { setupExperimentStreamHandler } from "./experimental-stream-handler";
import { setupDatabaseHandler } from "./database-handler";

setupPdfHandler();
setupContextMenu();
setupExperimentStreamHandler();
setupDatabaseHandler();

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .catch((error) => console.error(error));

console.log("Reading assistant background script loaded");
