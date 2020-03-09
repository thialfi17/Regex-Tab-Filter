//
//      DON'T FORGET TO REMOVE DEBUGGING CODE!!!
//

// Add context menu item for hiding selected tabs
browser.menus.create({
    id: "hide_tab",
    title: browser.i18n.getMessage("menuItemHideTab"),
    visible: false,
    contexts: ["tab"]
});

// Add context menu item for hiding other tabs
browser.menus.create({
    id: "hide_other_tabs",
    title: browser.i18n.getMessage("menuItemHideOtherTabs"),
    visible: true,
    contexts: ["tab"]
});

browser.menus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
        case "hide_tab":
            browser.tabs.query({
                highlighted: true
            }).then((tabs) => {
                for (let tab of tabs) {
                    browser.tabs.hide(tab.id);
                }
            })
            break;
        case "hide_other_tabs":
            browser.tabs.query({
                highlighted: false,
                currentWindow: true
            }).then((tabs) => {
                for (let tab of tabs) {
                    browser.tabs.hide(tab.id);
                }
            })
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
    } else if (highlightInfo.tabId.length == 2) {
        browser.menus.update(
            "hide_tab",
            {
                title: browser.i18n.getMessage("menuItemHideTab"),
                visible: true
            }
        );
    // Change the menu item to show the plural form when more than three tabs are highlighted
    } else if (highlightInfo.tabIds.length == 3) {
        browser.menus.update(
            "hide_tab",
            {
                title: browser.i18n.getMessage("menuItemHideTabs")
            }
        );
    }
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
        for (let tab of tabs) {
            // Apply actions on tabs if they match
            if ((filter.test(tab.title) || filter.test(tab.url))) {
                if (on_match_action == HIDE) {
                    browser.tabs.hide(tab.id);
                } else if (on_match_action == SHOW) {
                    browser.tabs.show(tab.id);
                }
            }
            // Hide tabs that didn't match a condition when not inverted
            else if (not_match_action == HIDE) {
                browser.tabs.hide(tab.id);
            }
        }
    });
});
