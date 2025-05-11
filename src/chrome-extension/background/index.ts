import "./extract-active-tab";

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .then(() => {
    console.log("Side panel on 'action click => open' behavior set");
  })
  .catch((error) => console.error(error));

console.log("Reading assistant background script loaded");
