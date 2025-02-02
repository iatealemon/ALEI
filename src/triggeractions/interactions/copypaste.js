import { SelectedObjects } from "../../entity/entity.js";

import { selectedActions, getOrderedSelectedActions, clearSelectedActions } from "./selection.js";
import { stopTriggerActionDrag } from "./dragndrop/dragndrop.js";
import { getTriggerActions, hasEmptyActions, setParametersFromActionArray } from "../actionarray.js";

import { aleiLog, logLevel } from "../../log.js";

const doNothingAction = -1;

/** @type {{type: *, targetA: *, targetB: *}[]} */
let actionClipboard = [];

/**
 * called when ctrl+c is pressed.  
 * copying trigger actions is only possible when trigger actions are selected to differentiate between copying objects and copying trigger actions.  
 */
export function copyTriggerActions() {
    if (SelectedObjects.length !== 1 || SelectedObjects[0]._class !== "trigger") return; // only makes sense to copy actions when 1 trigger is selected
    if (selectedActions.size === 0) return;

    const selectedTrigger = SelectedObjects[0];

    const maxActionNum = 10 + (selectedTrigger.pm.additionalActions?.length ?? 0);
    const orderedSelection = getOrderedSelectedActions();
    let actions = [];
    for (const actionNum of orderedSelection) {
        if (actionNum < 1 || actionNum > maxActionNum) {
            aleiLog(logLevel.WARN, "Attempted to copy an action that doesn't exist on this trigger. selectedActions is somehow invalid.\naction:", actionNum);
            continue;
        }
        let action = { type: doNothingAction, targetA: 0, targetB: 0 };
        if (actionNum <= 10) {
            // normal trigger action
            action.type    = selectedTrigger.pm[`actions_${actionNum}_type`];
            action.targetA = selectedTrigger.pm[`actions_${actionNum}_targetA`];
            action.targetB = selectedTrigger.pm[`actions_${actionNum}_targetB`];
        }
        else {
            // additional trigger action
            const index = actionNum - 11;
            action.type    = selectedTrigger.pm.additionalActions[index];
            action.targetA = selectedTrigger.pm.additionalParamA[index];
            action.targetB = selectedTrigger.pm.additionalParamB[index];
        }
        actions.push(action);
    }

    actionClipboard = actions;
    
    NewNote("Trigger actions copied to the clipboard.", note_passive);
    clearSelectedActions();
}

/**
 * called when ctrl+v is pressed.  
 * pasting trigger actions is only possible when trigger actions are selected to differentiate between pasting objects and pasting trigger actions.  
 * do nothing trigger actions will only be removed from the end of the trigger; it is assumed that the rest are intentional.  
 * trigger will be extended automatically if extended triggers are enabled.
 */
export function pasteTriggerActions() {
    if (SelectedObjects.length !== 1 || SelectedObjects[0]._class !== "trigger") return; // only makes sense to paste actions when 1 trigger is selected
    if (selectedActions.size === 0) return;
    if (actionClipboard.length === 0) {
        NewNote("No trigger actions to paste.", note_passive);
        return;
    }

    const selectedTrigger = SelectedObjects[0];
    let triggerActions = getTriggerActions(selectedTrigger);
    const oldActionCount = triggerActions.length;

    // add trigger actions from clipboard to the list of actions
    const orderedSelection = getOrderedSelectedActions();
    if (orderedSelection.length === actionClipboard.length) {
        // paste each action before the corresponding position
        for (let i = orderedSelection.length - 1; i >= 0; i--) {
            const selectedActionIndex = orderedSelection[i] - 1;
            triggerActions.splice(selectedActionIndex, 0, actionClipboard[i]);
        }
    }
    else {
        // paste before first selected action
        const firstSelectedActionIndex = orderedSelection[0] - 1;
        triggerActions.splice(firstSelectedActionIndex, 0, ...actionClipboard);
    }

    // remove do nothing actions from the back to try to match oldActionCount
    while (triggerActions.length > oldActionCount && triggerActions.at(-1).type == doNothingAction) {
        triggerActions.pop();
    }

    // check if oldActionCount wasn't reached and the trigger needs to be extended
    if (triggerActions.length > oldActionCount) {
        if (unsafeWindow.ExtendedTriggersLoaded) {
            // extend trigger
            const diff = triggerActions.length - oldActionCount;
            unsafeWindow.addTriggerActionCount(diff, false);
        }
        else {
            // give error because extended triggers aren't active and there isn't enough space to paste
            if (hasEmptyActions(triggerActions)) {
                NewNote("Not enough space in the trigger to paste trigger actions. (only considering empty space at the end of the trigger)", note_passive);
            }
            else {
                NewNote("Not enough space in the trigger to paste trigger actions.", note_passive);
            }
            return;
        }
    }

    // set parameters. this only sets the actions that were changed
    const actionsToSet = triggerActions.slice(orderedSelection[0] - 1);
    const firstActionNum = orderedSelection[0];
    setParametersFromActionArray(actionsToSet, firstActionNum);

    NewNote("Trigger actions pasted from the clipboard.", note_passive);
    clearSelectedActions();
    need_GUIParams_update = true;
    stopTriggerActionDrag();
}