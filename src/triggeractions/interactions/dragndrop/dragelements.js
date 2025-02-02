/**
 * @returns {HTMLElement}
 */
export function createDragLabel() {
    const dragLabel = document.createElement("div");
    dragLabel.textContent = "beans";
    dragLabel.className = "dragged-item-label";
    return dragLabel;
}

/**
 * @param {HTMLElement} dragLabel 
 * @param {string} text 
 */
export function setDragLabelText(dragLabel, text) {
    dragLabel.textContent = text;
}

/**
 * @param {HTMLElement} dragLabel 
 * @param {number} x 
 * @param {number} y 
 */
export function moveDragLabel(dragLabel, x, y) {
    dragLabel.style.transform = `translate(${x}px, ${y}px)`;
}

/**
 * @param {HTMLElement} dragLabel 
 * @param {boolean} state 
 */
export function setDragLabelVisibility(dragLabel, state) {
    dragLabel.classList.toggle("dragged-item-label--visible", state);
}

/**
 * @returns {HTMLElement}
 */
export function createGapHighlight() {
    const gapHighlight = document.createElement("div");
    gapHighlight.className = "trigger-action-gap-highlight";
    return gapHighlight;
}

/**
 * @param {HTMLElement} gapHighlight 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 */
export function moveGapHighlight(gapHighlight, x, y, width) {
    gapHighlight.style.transform = `translate(${x}px, ${y}px)`;
    gapHighlight.style.width = width + "px";
}

/**
 * @param {HTMLElement} gapHighlight 
 * @param {boolean} state 
 */
export function setGapHighlightVisibility(gapHighlight, state) {
    gapHighlight.classList.toggle("trigger-action-gap-highlight--visible", state);
}