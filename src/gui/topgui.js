import { logLevel, aleiLog } from "../log.js";

let addedButtonsCount = 0;
let topPanelPatched = false;

export function patchTopPanel() {
    // remove gap elements between buttons
    for (const q of [...top_panel.getElementsByClassName("q")]) {
        q.remove();
    }

    // remove gap elements between sections and make gap happen through margin instead
    for (const q3 of [...top_panel.getElementsByClassName("q3")]) {
        q3.previousElementSibling?.classList.add("topui__section-end");
        q3.remove()
    }

    // move field_dis_left and field_dis_right elements under a field_dis_container
    for (const leftElem of [...top_panel.getElementsByClassName("field_dis_left")]) {
        const rightElem = leftElem.nextElementSibling;
        if (rightElem.classList.contains("field_dis_right")) {
            const container = document.createElement("div");
            container.className = "field_dis_container";
            
            leftElem.insertAdjacentElement("beforebegin", container);

            leftElem.remove();
            rightElem.remove();

            container.appendChild(leftElem);
            container.appendChild(rightElem);
        }
        else {
            aleiLog(logLevel.WARN, "Element to the right of field_dis_left was not field_dis_right");
        }
    }

    // find open manual button and redirect it to EaglePB2's
    const manualButton = [...top_panel.getElementsByClassName("field_btn")].find(
        button => button.value === "Editor Manual" || button.getAttribute("onclick") === "window.open('../level_editor_manual/','_blank');"
    );
    if (manualButton !== undefined) {
        manualButton.value = "Eagle's Manual";
        manualButton.setAttribute("onclick", "window.open('https://eaglepb2.gitbook.io/pb2-editor-manual/', '_blank');");
    }
    else {
        aleiLog(logLevel.WARN, "Failed to find manual button to redirect it");
    }

    topPanelPatched = true;
}

/**
 * adds a button to the top panel. buttons are added after the last button into their own section of the top panel
 * @param {string} text - text to display on the button
 * @param {function} callback - function to call when the button is clicked
 * @returns {HTMLInputElement} the button that was added
 */
export function addTopButton(text, callback) {
    if (!topPanelPatched) {
        throw new Error("Attempted to call addTopButton before patchTopPanel was called");
    }
    const buttons = top_panel.getElementsByClassName("field_btn");
    const lastButton = buttons[buttons.length - 1];

    // add section gap if this is the first additional button
    if (addedButtonsCount === 0) {
        lastButton.classList.add("topui__section-end");
    }

    // create new button
    const newButton = document.createElement("input");
    newButton.className = "field_btn";
    newButton.type = "button";
    newButton.value = text;
    newButton.addEventListener("click", callback);

    // add new button after previous button
    lastButton.insertAdjacentElement("afterend", newButton);

    addedButtonsCount++;

    return newButton;
}