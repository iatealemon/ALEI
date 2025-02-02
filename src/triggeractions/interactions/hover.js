import { getTriggerActionContainer } from "../elements.js";

/**
 * either removes or adds hover color to the trigger action element of actionNum
 * @param {number} actionNum 
 * @param {boolean} state 
 */
export function setHoveredState(actionNum, state) {
    const triggerActionContainer = getTriggerActionContainer(actionNum);
    triggerActionContainer?.classList.toggle("trigger-action--hovered", state);
}