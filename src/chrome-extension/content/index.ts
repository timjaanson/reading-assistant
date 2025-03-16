(async () => {
  // We have to provide the resource as web_accessible in manifest.json
  // So that its available when we request using chrome.runtime.getURL
  const src = chrome.runtime.getURL("content-main.js");
  await import(src);
  console.log("Assisted Reading content script loaded");
})();
