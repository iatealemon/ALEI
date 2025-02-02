import { SelectedObjects } from "../../entity/entity.js";

import { selectedActions, getOrderedSelectedActions, clearSelectedActions } from "./selection.js";
import { stopTriggerActionDrag } from "./dragndrop/dragndrop.js";

import { getTriggerActions, setParametersFromActionArray } from "../actionarray.js";

export function deleteTriggerActions() {
    if (SelectedObjects.length !== 1 || SelectedObjects[0]._class !== "trigger") return;
    if (selectedActions.size === 0) return;
    
    const selectedTrigger = SelectedObjects[0];
    let triggerActions = getTriggerActions(selectedTrigger);

    // remove trigger actions
    const orderedSelection = getOrderedSelectedActions();
    for (let i = orderedSelection.length - 1; i >= 0; i--) {
        const selectedActionIndex = orderedSelection[i] - 1;
        triggerActions.splice(selectedActionIndex, 1);
        triggerActions.push({ type: -1, targetA: 0, targetB: 0 }); // add empty action to the back
    }

    // set parameters. this only sets the actions that were changed
    const actionsToSet = triggerActions.slice(orderedSelection[0] - 1);
    const firstActionNum = orderedSelection[0];
    setParametersFromActionArray(actionsToSet, firstActionNum);
    
    NewNote("Deleted trigger actions.", note_passive);
    clearSelectedActions();
    need_GUIParams_update = true;
    stopTriggerActionDrag();
}