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

    // Allows for inverted searches
    var inverted = false;
    if (text.charAt(0) === '!') {
        inverted = true;
        text = text.slice(1);
    }

    // Build regex for our filter
    var filter = RegExp(text, "i");
    // Apply filter to tabs in current window
    browser.tabs.query({
        currentWindow: true
    }).then((tabs) => { // Hides tabs if they don't match the filter in their URL or title
        for (let tab of tabs) {
            if ((filter.test(tab.title) || filter.test(tab.url))) {
                // At least one matched
                // Hide any tabs that match a condition when inverted
                if (inverted) {
                    browser.tabs.hide(tab.id);
                } else {
                    browser.tabs.show(tab.id);
                }
            }
            // Hide tabs that didn't match a condition when not inverted
            else if (!inverted) {
                // Didn't match
                browser.tabs.hide(tab.id);
            }
        }
    });
});