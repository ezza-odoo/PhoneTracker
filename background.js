const api = typeof browser !== "undefined" ? browser : chrome;
api.action.onClicked.addListener((tab) => {
  const lastActiveTabId = tab.id;
  api.storage.local.set({ lastActiveTabId }, () => {
    api.windows.create({
      url: api.runtime.getURL("popup.html"),
      type: "popup",
      width: 360,
      height: 650,
    });
  });
});
