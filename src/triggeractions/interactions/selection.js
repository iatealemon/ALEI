import { getTriggerActionContainer } from "../elements.js";

/** @type {Set<number>} */
export const selectedActions = new Set();

export function getOrderedSelectedActions() {
    return [...selectedActions].sort((a, b) => a - b);
}

export function clearSelectedActions() {
    for (const actionNum of selectedActions) {
        setSelectionColorState(actionNum, false);
    }
    selectedActions.clear();
}

export function toggleSelectionState(actionNum) {
    if (selectedActions.has(actionNum)) {
        // unselect
        selectedActions.delete(actionNum);
        setSelectionColorState(actionNum, false);
    }
    else {
        // select
        selectedActions.add(actionNum);
        setSelectionColorState(actionNum, true);
    }
}

export function addSelectedAction(actionNum) {
    selectedActions.add(actionNum);
    setSelectionColorState(actionNum, true);
}

/**
 * either removes or adds selection color to the trigger action element of actionNum
 * @param {number} actionNum 
 * @param {boolean} state 
 */
function setSelectionColorState(actionNum, state) {
    const triggerActionContainer = getTriggerActionContainer(actionNum);
    triggerActionContainer?.classList.toggle("trigger-action--selected", state);
}