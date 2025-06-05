import "./extract-active-tab";

chrome.sidePanel
  .setPanelBehavior({
    openPanelOnActionClick: true,
  })
  .then(() => {
    console.debug("Side panel on 'action click => open' behavior set");
  })
  .catch((error) => console.error(error));

console.debug("Reading assistant background script loaded");
