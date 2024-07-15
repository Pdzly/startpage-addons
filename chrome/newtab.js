const homepageUrl = "https://startyparty.dev/";
async function redirectNewTab() {
  await chrome.windows.getCurrent(async (window) => {
    await chrome.tabs.query(
      { active: true, windowId: window.id },
      async (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.update(tab.id, { url: homepageUrl });
        }
      }
    );
  });
}

redirectNewTab();

function resetIconAndBadge() {
  chrome.action.setIcon({
    path: "icon--alt.png",
  });
  chrome.action.setBadgeText({ text: "" });
}

async function fetchTokenOrRedirect(store) {
  const token = await chrome.cookies.get({
    url: "https://startyparty.dev/",
    name: "__Secure-next-auth.session-token",
  });

  if (!token) {
    await chrome.tabs.create({
      url: homepageUrl + "login",
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
    // Doesnt work need to check.
    chrome.action.setIcon({
      path: "icon--alt_red.png",
    });
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
  chrome.action.setIcon({
    path: "icon--alt_green.png",
  });
  setTimeout(resetIconAndBadge, 5000);
}

function handleClick() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    sendWebsiteToApi(currentTab);
  });
}

chrome.action.onClicked.addListener(handleClick);

chrome.contextMenus.create(
  {
    id: "startyparty-save-bookmark",
    title: "Save to StartyParty",
    contexts: ["link"],
  },
  () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error creating context menu item:",
        chrome.runtime.lastError
      );
    }
  }
);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "startyparty-save-bookmark":
      sendWebsiteToApi({
        url: info.linkUrl,
        title: info.linkText,
        favIconUrl: undefined,
      });

      break;
  }
});
