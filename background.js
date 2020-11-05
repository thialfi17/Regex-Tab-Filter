//
//      DON'T FORGET TO REMOVE DEBUGGING CODE!!!
//

// Add context menu item for hiding selected tabs
browser.menus.create({
    id: "hide_tab",
    title: browser.i18n.getMessage("menuItemHideTab"),
    visible: false,
    contexts: ["tab"]
}, checkHideTabs);

// Add context menu item for hiding other tabs
browser.menus.create({
    id: "hide_other_tabs",
    title: browser.i18n.getMessage("menuItemHideOtherTabs"),
    visible: true,
    contexts: ["tab"]
}, checkHideOtherTabs);

// Add menu item to show all hidden tabs.
browser.menus.create({
    id: "show_tabs",
    title: browser.i18n.getMessage("menuItemShowTabs"),
    visible: false,
    contexts: ["tab"]
}, checkShowTabs);

browser.menus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
        case "hide_tab":
            browser.tabs.query({
                currentWindow: true,
                highlighted: true,
                hidden: false
            }).then((tabs) => {
                browser.tabs.hide(getTabIds(tabs));
            });

            // Tabs remain highlighted after being hidden which means the button doesn't disappear.
            browser.menus.update(
                "hide_tab",
                {
                    visible: false
                }
            );
            break;
        case "hide_other_tabs":
            browser.tabs.query({
                currentWindow: true,
                highlighted: false
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
    checkHideTabs();
    checkHideOtherTabs();
});

// Triggers when a tab is hidden or shown
browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    checkHideTabs();
    checkHideOtherTabs();
    checkShowTabs();
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

        // Sort the tabs into two arrays - matching and non-matching
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

        // Apply appropriate action to the arrays
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

// Converts an array of tabs into an array of tabIds for use with tabs.hide
function getTabIds(tabs) {
    let tabIds = [];
    for (let tab of tabs) {
        tabIds.push(tab.id);
    }
    return tabIds;
}

// Check if we want the hide tabs menu item to show
function checkHideTabs() {
    browser.tabs.query({
        currentWindow: true,
        hidden: false,
        highlighted: true
    }).then((tabs) => {
        // Hide menu option if only current tab is highlighted since it can't be hidden anyway
        if (tabs.length == 1) {
            browser.menus.update(
                "hide_tab",
                {
                    visible: false
                }
            );
        // Show the menu item with the singular form when two tabs are highlighted
        } else if (tabs.length == 2) {
            browser.menus.update(
                "hide_tab",
                {
                    title: browser.i18n.getMessage("menuItemHideTab"),
                    visible: true
                }
            );
        // Change the menu item to show the plural form when more than three tabs are highlighted
        } else if (tabs.length > 2) {
            browser.menus.update(
                "hide_tab",
                {
                    visible: true,
                    title: browser.i18n.getMessage("menuItemHideTabs")
                }
            );
        }
    });
}

// Check if we want the hide other tabs menu item to show
function checkHideOtherTabs() {
    browser.tabs.query({
        currentWindow: true,
        hidden: false,
        highlighted: false // Highlighted tabs don't get hidden
    }).then((tabs) => {
        // Check if there are any non-highlighted visible tabs
        if (tabs.length > 0) {
            browser.menus.update(
                "hide_other_tabs",
                {
                    visible: true
                }
            );
        }
        else {
            browser.menus.update(
                "hide_other_tabs",
                {
                    visible: false
                }
            );
        }
    });
}

// Check if we want the show hidden tabs menu item to show
function checkShowTabs() {
    browser.tabs.query({
        currentWindow: true,
        hidden: true
    }).then((tabs) => {
        // There are hidden tabs
        if (tabs.length > 0) {
            browser.menus.update(
                "show_tabs",
                {
                    visible: true
                }
            );
        }
        // No hidden tabs so don't show
        else {
            browser.menus.update(
                "show_tabs",
                {
                    visible: false
                }
            );
        }
    });
}
