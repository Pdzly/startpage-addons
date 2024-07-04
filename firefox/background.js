const homepageUrl = "https://startyparty.dev/";

// Open New Window
browser.windows.onCreated.addListener(async (window) => {
  if (window.type !== "normal") return;

  const w = await browser.windows.get(window.id, { populate: true });
  const tabs = await browser.tabs.query({ windowId: w.id });

  if (
    tabs.length === 1 &&
    tabs[0].url === "about:blank" &&
    tabs[0].status === "complete" &&
    tabs[0].title === "New Tab"
  ) {
    await browser.tabs.update(tabs[0].id, {
      url: homepageUrl,
      loadReplace: true,
    });
  }
});

function resetIconAndBadge() {
  browser.browserAction.setIcon({
    "path": "icon.svg"
  });
  browser.browserAction.setBadgeText({ text: "" });
}

async function fetchTokenOrRedirect(store) {
  const token = await browser.cookies.get({
    url: "https://startyparty.dev/",
    name: "__Secure-next-auth.session-token",
  });

  if (!token) {
    await browser.tabs.create({
      url: homepageUrl + "login",
      cookieStoreId: store,
    });
    return;
  }
  return token.value;
}

async function sendWebsiteToApi(tab) {
  const url = tab.url;
  const title = tab.title;
  const favicon = tab.favIconUrl;
  const data = { url, title, favicon };

  const token = await fetchTokenOrRedirect(tab.cookieStoreId);

  if (!token) {
    // Todo fix this
    browser.browserAction.setIcon({
      path: "icon_red.svg"
    })
    setTimeout(resetIconAndBadge, 5000);
    return;
  }

  // fetch("https://startyparty.dev/api", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": "Bearer " + token
  //   },
  //   body: JSON.stringify(data),
  // });
  browser.browserAction.setIcon({
    "path": "icon_green.svg"
  });
  setTimeout(resetIconAndBadge, 5000);
}

function handleClick() {
  browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    sendWebsiteToApi(currentTab);
  });
}

browser.browserAction.onClicked.addListener(handleClick);
