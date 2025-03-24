console.log("Reading assistant background script loaded");

// Import the PDF handler
import "./pdf-handler";

// Import and setup context menu
import { setupContextMenu } from "./context-menu";

// Initialize context menu when the extension starts
setupContextMenu();
