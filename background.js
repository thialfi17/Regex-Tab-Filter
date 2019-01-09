//
//      DON'T FORGET TO REMOVE DEBUGGING CODE!!!
//

browser.omnibox.onInputEntered.addListener((text, disposition) => {
    // If no text given, show all tabs
    if (text === "") {
        // Show all tabs that are hidden in the current window
        browser.tabs.query({
            currentWindow:true,
            hidden: true
        }).then((tabs) => {
            for (let tab of tabs) {
                browser.tabs.show(tab.id);
            }
        });
        return;
    }

    const HIDE = 1;
    const SHOW = 2;
    const NOTHING = 3;
    let on_match_action = SHOW;
    let not_match_action = HIDE;

    // Allows for inverted searches
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
    }).then((tabs) => { // Hides tabs if they don't match the filter in their URL or title
        for (let tab of tabs) {
            if ((filter.test(tab.title) || filter.test(tab.url))) {
                // At least one matched
                if (on_match_action == HIDE) {
                    browser.tabs.hide(tab.id);
                } else if (on_match_action == SHOW) {
                    browser.tabs.show(tab.id);
                }
            }
            // Hide tabs that didn't match a condition when not inverted
            else if (not_match_action == HIDE) {
                // Didn't match
                browser.tabs.hide(tab.id);
            }
        }
    });
});
