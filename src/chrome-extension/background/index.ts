console.log("Reading assistant background script loaded");

// Import the PDF handler setup function
// Removed: import "./pdf-handler";
import { setupPdfHandler } from "./pdf-handler";

// Import and setup context menu
import { setupContextMenu } from "./context-menu";

// Import and setup experiment stream handler
import { setupExperimentStreamHandler } from "./experiment-stream-handler";

// Initialize PDF handler
setupPdfHandler();

// Initialize context menu when the extension starts
setupContextMenu();

// Initialize experiment stream handler
setupExperimentStreamHandler();
