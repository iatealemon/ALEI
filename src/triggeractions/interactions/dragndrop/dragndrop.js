import { SelectedObjects } from "../../../entity/entity.js";

import { checkAutoScroll, stopAutoScroll } from "./autoscroll.js";
import { createDragLabel, setDragLabelText, moveDragLabel, setDragLabelVisibility, createGapHighlight, moveGapHighlight, setGapHighlightVisibility } from "./dragelements.js";
import { DragStateHandler } from "./dragstatehandler.js";
import { selectedActions, clearSelectedActions, addSelectedAction } from "../selection.js";

import { getTriggerActionContainer } from "../../elements.js";
import { getTriggerActions, setParametersFromActionArray } from "../../actionarray.js";

export const dragStateHandler = new DragStateHandler({
    onDragStarted: triggerActionDragStarted,
});

const dragLabel = createDragLabel();
const gapHighlight = createGapHighlight();

// state variables
let heldActionNum = null;
let draggedActions = [];

export function triggerActionPressedDown(event, actionNum) {
    if (SelectedObjects.length !== 1 || SelectedObjects[0]._class !== "trigger") return;
    
    heldActionNum = actionNum;
    draggedActions = [];
    dragStateHandler.initializeState(event.clientX, event.clientY);
    addEventListeners();
}

function addEventListeners() {
    const rparams = document.getElementById("rparams");
    rparams.addEventListener("mousemove", onMouseMove);
    rparams.addEventListener("scroll", onScroll);
    rparams.addEventListener("mouseleave", onMouseLeave);
    rparams.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseup", onMouseUp);
}

function removeEventListeners() {
    const rparams = document.getElementById("rparams");
    rparams?.removeEventListener("mousemove", onMouseMove);
    rparams?.removeEventListener("scroll", onScroll);
    rparams?.removeEventListener("mouseleave", onMouseLeave);
    rparams?.removeEventListener("mouseenter", onMouseEnter);
    document.removeEventListener("mouseup", onMouseUp);

    // ensure the throttled event listeners don't run after they're removed
    onMouseMove.cancel();
    onScroll.cancel();
}

const onMouseMove = throttled(function(event) {
    if (dragStateHandler.isDragging) {
        checkAutoScroll(event.clientY);
    }

    dragStateHandler.updateMousePos(event.clientX, event.clientY);

    if (dragStateHandler.isDragging) {
        updateDragUI();
    }
});

const onScroll = throttled(function() {
    if (dragStateHandler.isDragging) {
        dragStateHandler.recalculateDropPosition();
        updateDragUI();
    }
});

function onMouseLeave() {
    if (dragStateHandler.isDragging) {
        setDragLabelVisibility(dragLabel, false);
        setGapHighlightVisibility(gapHighlight, false);
        stopAutoScroll();
        dragStateHandler.resetDropPosition();
    }
}

function onMouseEnter() {
    if (dragStateHandler.isDragging) {
        setDragLabelVisibility(dragLabel, true);
        setGapHighlightVisibility(gapHighlight, true);
    }
}

function onMouseUp() {
    if (dragStateHandler.dropPosition !== null) {
        dropDraggedActions();
    }

    stopTriggerActionDrag();
}

function triggerActionDragStarted() {
    const triggerActionContainers = [...document.getElementById("rparams").getElementsByClassName("trigger-action")];
    dragStateHandler.setElements(triggerActionContainers);

    if (selectedActions.has(heldActionNum)) {
        draggedActions = [...selectedActions];
    }
    else {
        draggedActions = [heldActionNum];
    }

    addDragColors();

    document.body.appendChild(gapHighlight);
    document.body.appendChild(dragLabel);

    const actionsCount = draggedActions.length;
    const labelText = `${actionsCount} action${actionsCount === 1 ? "" : "s"}`;
    setDragLabelText(dragLabel, labelText);
    setDragLabelVisibility(dragLabel, true);
    setGapHighlightVisibility(gapHighlight, true);
}

function updateDragUI() {
    const mouseX = dragStateHandler.savedMouseX;
    const mouseY = dragStateHandler.savedMouseY;
    const dropPosition = dragStateHandler.dropPosition;

    moveDragLabel(dragLabel, mouseX, mouseY);

    if (dropPosition !== null) {
        let actionNum = dropPosition + 1;
        let bottom = false;
        if (dropPosition === dragStateHandler.elements.length) {
            actionNum--;
            bottom = true;
        }

        const triggerActionContainer = getTriggerActionContainer(actionNum);
        if (triggerActionContainer !== null) {
            const rect = triggerActionContainer.getBoundingClientRect();
            const gapY = bottom ? rect.bottom + 1 : rect.top - 1;
            moveGapHighlight(gapHighlight, rect.left, gapY, rect.width);
        }
    }
}

export function stopTriggerActionDrag() {
    removeDragColors()

    removeEventListeners();

    stopAutoScroll();

    dragLabel.remove();
    gapHighlight.remove();

    dragStateHandler.stopDrag();

    heldActionNum = null;
    draggedActions = [];
}

function addDragColors() {
    draggedActions.forEach((actionNum) => {
        const triggerActionContainer = getTriggerActionContainer(actionNum);
        triggerActionContainer?.classList.add("trigger-action--dragged");
    });
}

function removeDragColors() {
    const rparams = document.getElementById("rparams");
    if (rparams !== null) {
        const draggedElements = [...rparams.getElementsByClassName("trigger-action--dragged")];
        draggedElements.forEach((elem) => elem.classList.remove("trigger-action--dragged"));
    }
}

function throttled(fn) {
    let updateRequested = false;
    let rafID = null;

    function modified() {
        if (!updateRequested) {
            rafID = requestAnimationFrame(() => {
                fn.apply(this, arguments);
                updateRequested = false;
                rafID = null;
            });
            updateRequested = true;
        }
    }

    modified.cancel = function() {
        if (rafID !== null) {
            cancelAnimationFrame(rafID);
            updateRequested = false;
            rafID = null;
        }
    }

    return modified;
}

function dropDraggedActions() {
    const areIntegersSequential = (sortedInts) => {
        for (let i = 0; i < sortedInts.length - 1; i++) {
            const diff = sortedInts[i + 1] - sortedInts[i];
            if (diff !== 1) {
                return false;
            }
        }
        return true;
    }

    draggedActions.sort((a, b) => a - b);

    const insertPosition = dragStateHandler.dropPosition;

    // check if the drop does nothing
    if (areIntegersSequential(draggedActions) &&
        insertPosition >= draggedActions[0] - 1 &&
        insertPosition <= draggedActions.at(-1)
    ) {
        // exit early because drag-and-drop wouldn't change anything
        return;
    }
    
    const selectedTrigger = SelectedObjects[0];

    let triggerActions = getTriggerActions(selectedTrigger);

    const objectsOfSelectedActions = new Set([...selectedActions].map(actionNum => triggerActions[actionNum - 1]));

    const actionsToAdd = draggedActions.map(actionNum => triggerActions[actionNum - 1]);

    // add dragged actions to drag position
    triggerActions.splice(insertPosition, 0, ...actionsToAdd);

    // remove dragged actions from their old positions
    for (let i = draggedActions.length - 1; i >= 0; i--) {
        let draggedActionPosition = draggedActions[i] - 1;
        
        // account for actions that were added
        if (draggedActionPosition >= insertPosition) {
            draggedActionPosition += actionsToAdd.length;
        }

        triggerActions.splice(draggedActionPosition, 1);
    }

    // set parameters. only sets the parameters that were affected by the drag-and-drop
    const rangeOfChange = {
        min: Math.min(draggedActions[0] - 1, insertPosition),
        max: Math.max(draggedActions.at(-1) - 1, insertPosition - 1),
    };
    const changedSegment = triggerActions.slice(rangeOfChange.min, rangeOfChange.max + 1);
    setParametersFromActionArray(changedSegment, rangeOfChange.min + 1);

    UpdateGUIParams(); // calling directly instead of using need_GUIParams_update cuz it clears selectedActions

    // update selected actions so that all actions that were selected previously are still selected regardless of their new position
    clearSelectedActions();
    for (let i = 0; i < triggerActions.length; i++) {
        if (objectsOfSelectedActions.has(triggerActions[i])) {
            addSelectedAction(i + 1);
        }
    }
}