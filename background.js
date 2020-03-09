//
//      DON'T FORGET TO REMOVE DEBUGGING CODE!!!
//

// Add context menu item for hiding selected tabs
browser.menus.create({
    id: "hide_tab",
    title: browser.i18n.getMessage("menuItemHideTab"),
    visible: false,
    contexts: ["tab"]
}, function () {
    browser.tabs.query({
        highlighted: true
    }).then((tabs) => {
        if (tabs.length == 2) {
            browser.menus.update(
                "hide_tab",
                {
                    visible: true
                }
            );
        } else if (tabs.length >= 3) {
            browser.menus.update(
                "hide_tab",
                {
                    visible: true,
                    title: browser.i18n.getMessage("menuItemHideTabs")
                }
            );
        }
    });
});

// Add context menu item for hiding other tabs
browser.menus.create({
    id: "hide_other_tabs",
    title: browser.i18n.getMessage("menuItemHideOtherTabs"),
    visible: true,
    contexts: ["tab"]
}, function() {
    browser.tabs.query({
        hidden: false,
        highlighted: false
    }).then((tabs) => {
        if (tabs.length == 0) {
            browser.menus.update(
                "hide_other_tabs",
                {
                    visible: false
                }
            );
        }
    });
});

// Add menu item to show all hidden tabs. This is already easy to do with the
// address bar but might as well add it to the context menu since the context
// menu can already do so much.
browser.menus.create({
    id: "show_tabs",
    title: browser.i18n.getMessage("menuItemShowTabs"),
    visible: false,
    contexts: ["tab"]
}, function() {
    browser.tabs.query({
        hidden: true
    }).then((tabs) => {
        if (tabs.length > 1) {
            browser.menus.update(
                "show_tabs",
                {
                    visible: true
                }
            );
        }
    });
});

browser.menus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
        case "hide_tab":
            browser.tabs.query({
                highlighted: true
            }).then((tabs) => {
                browser.tabs.hide(getTabIds(tabs));
            });

            browser.menus.update(
                "hide_tab",
                {
                    visible: false
                }
            );
            break;
        case "hide_other_tabs":
            browser.tabs.query({
                highlighted: false,
                currentWindow: true
            }).then((tabs) => {
                browser.tabs.hide(getTabIds(tabs));
            })
            break;
        case "show_tabs":
            browser.tabs.query({
                currentWindow: true,
                hidden: true
            }).then((tabs) => {
                browser.tabs.show(getTabIds(tabs));
            });
            break;
    }
});

browser.tabs.onHighlighted.addListener((highlightInfo) => {
    // Hide menu option if only current tab is highlighted since it can't be hidden anyway
    if (highlightInfo.tabIds.length == 1) {
        browser.menus.update(
            "hide_tab",
            {
                visible: false
            }
        );
    // Show the menu item with the singular form when two tabs are highlighted
    } else if (highlightInfo.tabIds.length == 2) {
        browser.menus.update(
            "hide_tab",
            {
                title: browser.i18n.getMessage("menuItemHideTab"),
                visible: true
            }
        );
    // Change the menu item to show the plural form when more than three tabs are highlighted
    } else if (highlightInfo.tabIds.length > 2) {
        browser.menus.update(
            "hide_tab",
            {
                visible: true,
                title: browser.i18n.getMessage("menuItemHideTabs")
            }
        );
    }

    checkHideOtherTabs();
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    browser.tabs.query({
        hidden: true
    }).then((tabs) => {
        if (tabs.length > 0) {
            browser.menus.update(
                "show_tabs",
                {
                    visible: true
                }
            );
        } else {
            browser.menus.update(
                "show_tabs",
                {
                    visible: false
                }
            );
        }
    });

    checkHideOtherTabs();
}, {
    properties: ["hidden"]
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
    const HIDE = 1;
    const SHOW = 2;
    const NOTHING = 3;

    // Default actions when no modifiers are present
    let on_match_action = SHOW;
    let not_match_action = HIDE;

    // Allows user to hide specific webpages
    if (text.charAt(0) === '!') {
        on_match_action = HIDE;
        not_match_action = NOTHING;
        text = text.slice(1);
    }
    // Allows user to unhide specific webpages
    if (text.charAt(0) === '|') {
        on_match_action = SHOW;
        not_match_action = NOTHING;
        text = text.slice(1);
    }

    // Build regex for our filter
    let filter = RegExp(text, "i");

    // Apply filter to tabs in current window
    browser.tabs.query({
        currentWindow: true
    }).then((tabs) => {
        matchIds = [];
        nonMatchIds =[];

        for (let tab of tabs) {
            // Apply actions on tabs if they match
            if ((filter.test(tab.title) || filter.test(tab.url))) {
                matchIds.push(tab.id);
            }
            // Hide tabs that didn't match a condition when not inverted
            else {
                nonMatchIds.push(tab.id);
            }
        }

        if (on_match_action == HIDE) {
            browser.tabs.hide(matchIds);
        } else if (on_match_action == SHOW) {
            browser.tabs.show(matchIds);
        }

        if (not_match_action == HIDE) {
            browser.tabs.hide(nonMatchIds);
        } else if (not_match_action == SHOW) {
            browser.tabs.show(nonMatchIds);
        }
    });
});

function getTabIds(tabs) {
    let tabIds = [];
    for (let tab of tabs) {
        tabIds.push(tab.id);
    }
    return tabIds;
}

function checkHideOtherTabs() {
    browser.tabs.query({
        hidden: false,
        highlighted: false
    }).then((tabs) => {
        if (tabs.length > 0) {
            browser.menus.update(
                "hide_other_tabs",
                {
                    visible: true
                }
            );
        } else {
            browser.menus.update(
                "hide_other_tabs",
                {
                    visible: false
                }
            );
        }
    });
}
