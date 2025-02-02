/**
 * @param {number} actionNum 
 * @returns {HTMLElement|null}
 */
export function getTriggerActionContainer(actionNum) {
    const triggerActionContainer = document.getElementById(`pm_actions_${actionNum}_type`)?.parentElement.parentElement ?? null;
    if (triggerActionContainer === null || !triggerActionContainer.classList.contains("trigger-action")) {
        return null;
    }
    return triggerActionContainer;
}

/**
 * @param {HTMLElement} element 
 * @returns {boolean}
 */
export function isTriggerActionLabelElement(element) {
    if (!element.classList.contains("pa1")) return false;
    
    const firstParent = element.parentElement;
    const secondParent = firstParent.parentElement;
    if (!firstParent.classList.contains("p_i") || !secondParent.classList.contains("trigger-action")) return false;
    
    return true;
}

/**
 * @param {HTMLElement} element 
 * @returns {number|null}
 */
export function getActionNumFromLabel(element) {
    const triggerActionContainer = element.parentElement.parentElement;
    const actionNum = parseInt(triggerActionContainer.dataset.actionNum)
    return Number.isNaN(actionNum) ? null : actionNum;
}