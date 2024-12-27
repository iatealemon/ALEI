/**
 * patches letedit to modify the trigger action list after it has been created.  
 * fixes bugs where "Everything" button has color:undefined and "Do Nothing" button has whatever color the previous button had.  
 * displays trigger actions of the "experimental" group at the bottom of the list despite the order of the numerical IDs.
 */
export function patchTriggerActionList() {
    const experimentalActionIndexes = [];

    /** regex that captures category name from \<span style=color:#5f6887>Movable\</span> or similar */
    const getCategoryRegex = /^\<span.+?\>(.+?)\<\/span\>/;
    const actionsNums = Object.keys(special_values_table["trigger_type"]);
    for (let i = 0; i < actionsNums.length; i++) {
        const actionNum = actionsNums[i];
        const categoryMatch = special_values_table["trigger_type"][actionNum].match(getCategoryRegex);
        if (categoryMatch?.[1] === "Experimental") {
            experimentalActionIndexes.push(i);
        }
    }

    const original_letedit = unsafeWindow.letedit;
    unsafeWindow.letedit = function(obj, enablemode) {
        original_letedit(obj, enablemode);
        if (enablemode === "trigger_type") {
            const maskButtonsDiv = ff_drop.firstElementChild;
            maskButtonsDiv.firstElementChild.style.color = "#ffffff"; // fix color of "Everything" button
            maskButtonsDiv.lastElementChild.style.color = "#ffffff"; // fix color of "Do Nothing" button

            // make the buttons use the better MaskTriggerActions function
            for (const maskButton of maskButtonsDiv.children) {
                if (maskButton.getAttribute("onclick").startsWith("MaskTriggerActions(")) {
                    if (maskButton.textContent === "Everything") {
                        maskButton.setAttribute("onclick", `MaskTriggerActions('')`);
                    }
                    else {
                        maskButton.setAttribute("onclick", `MaskTriggerActions('${maskButton.textContent}')`);
                    }
                }
            }

            // make the search bar use the better maskTriggerActions function
            const searchBar = maskButtonsDiv.nextElementSibling.firstElementChild;
            searchBar.setAttribute("onkeyup", `MaskTriggerActions(this.value)`);

            // move trigger actions from "Experimental" category to the bottom of the list
            const options = [...ff_drop.children].slice(2, -1); // omit the first 2 and last
            const doNothingOption = ff_drop.lastElementChild;
            for (const index of experimentalActionIndexes) {
                ff_drop.insertBefore(options[index], doNothingOption);
            }
        }
    }
}

/**
 * makes trigger action search smarter by using textContent instead of innerHTML. also it searches by category name instead of color.  
 * the new MaskTriggerActions function doesn't take the same arguments as the original so it's necessary that letedit has been patched to use this properly
 */
export function patchMaskTriggerActions() {
    unsafeWindow.MaskTriggerActions = function(searchStr) {
        searchStr = searchStr.toLowerCase();
        // loop each child element, skipping over the first 2 (not trigger actions) and the last one (do nothing option)
        for (let i = 2; i < ff_drop.children.length - 1; i++) {
            const option = ff_drop.children[i];
            const text = option.textContent.toLowerCase();
            if (text.includes(searchStr)) {
                option.style.display = "inline-block";
            }
            else {
                option.style.display = "none";
            }
        }
    }
}