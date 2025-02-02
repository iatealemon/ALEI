import { SelectedObjects } from "../entity/entity.js";

import { copyTriggerActions, pasteTriggerActions } from "./interactions/copypaste.js";
import { deleteTriggerActions } from "./interactions/delete.js";
import { triggerActionPressedDown, dragStateHandler } from "./interactions/dragndrop/dragndrop.js";
import { setHoveredState } from "./interactions/hover.js";
import { toggleSelectionState, selectedActions } from "./interactions/selection.js";

import { isTriggerActionLabelElement, getActionNumFromLabel } from "./elements.js";

import { aleiLog, logLevel } from "../log.js";

/**
 * called in the params gui update function when currentParamsGUIType === paramsGUITypes.normal
 */
export function makeTriggerActionsInteractable(rparams) {
    if (SelectedObjects.length !== 1 || SelectedObjects[0]._class !== "trigger") return;

    // toggle select
    rparams.addEventListener("click", (event) => {
        if (dragStateHandler.wasDragging) return;
        if (!isTriggerActionLabelElement(event.target)) return;
        
        const actionNum = getActionNumFromLabel(event.target);
        if (actionNum !== null) toggleSelectionState(actionNum);
    });

    // hover
    rparams.addEventListener("mouseover", (event) => {
        if (!isTriggerActionLabelElement(event.target)) return;
        
        const actionNum = getActionNumFromLabel(event.target);
        if (actionNum !== null) setHoveredState(actionNum, true);
    });

    // unhover
    rparams.addEventListener("mouseout", (event) => {
        if (!isTriggerActionLabelElement(event.target)) return;
        
        const actionNum = getActionNumFromLabel(event.target);
        if (actionNum !== null) setHoveredState(actionNum, false);
    });

    // start checking for drag
    rparams.addEventListener("mousedown", (event) => {
        if (!isTriggerActionLabelElement(event.target)) return;
        
        const actionNum = getActionNumFromLabel(event.target);
        if (actionNum !== null) triggerActionPressedDown(event, actionNum);
    });
}

export function patchForInteractableTriggerActions() {
    unsafeWindow.deleteObjectsOrActions = function() {
        if (selectedActions.size === 0) {
            // this block is the code that was replaced with the call to deleteObjectsOrActions
            DeleteSelection();
        }
        else {
            deleteTriggerActions();
        }
    }

    unsafeWindow.tryToCopyObjectsOrActions = function() {
        if (selectedActions.size === 0) {
            // this block is the code that was replaced with the call to tryToCopyObjectsOrActions
            if (typeof (Storage) !== 'undefined') {
                CopyToClipBoard('clipboard');
                NewNote('Objects copied to the clipboard.', note_passive);
            } else {
                NewNote('Oops! Your browser seem not to have sessionStorage (localStorage) support.', note_bad);
            }
        }
        else {
            copyTriggerActions();
        }
    }

    unsafeWindow.tryToPasteObjectsOrActions = function() {
        if (selectedActions.size === 0) {
            // this block is the code that was replaced with the call to tryToPasteObjectsOrActions
            if (typeof (Storage) !== 'undefined') {
                if (PasteFromClipBoard('clipboard'))
                    NewNote('Objects pasted from the clipboard.', note_passive);
                else
                    NewNote('Clipboard is empty. Nothing to paste.', note_passive);
            } else {
                NewNote('Oops! Your browser seem not to have sessionStorage (localStorage) support.', note_bad);
            }
        }
        else {
            pasteTriggerActions();
        }
    }

    let oldCode, newCode;

    oldCode = unsafeWindow.k_down.toString();
    newCode = oldCode.replace(
        /DeleteSelection\s*\(\s*\)\s*;/,
        "deleteObjectsOrActions();"
    );
    if (newCode === oldCode) {
        aleiLog(logLevel.WARN, `k_down direct code replacement failed (interactable trigger actions #1)`);
    }

    oldCode = newCode;
    newCode = oldCode.replace(
        /if\s*\(\s*typeof\s*\(?\s*Storage\s*\)?\s*!==\s*'?\w+'?\s*\)\s*\{\s*CopyToClipBoard.*?else.*?\}/s,
        "tryToCopyObjectsOrActions();"
    );
    if (newCode === oldCode) {
        aleiLog(logLevel.WARN, `k_down direct code replacement failed (interactable trigger actions #2)`);
    }

    oldCode = newCode;
    newCode = oldCode.replace(
        /if\s*\(\s*typeof\s*\(?\s*Storage\s*\)?\s*!==\s*'?\w+'?\s*\)\s*\{\s*if\s*\(\s*PasteFromClipBoard.*?else.*?else.*?\}/s,
        "tryToPasteObjectsOrActions();"
    );
    if (newCode === oldCode) {
        aleiLog(logLevel.WARN, `k_down direct code replacement failed (interactable trigger actions #3)`);
    }

    if (newCode !== unsafeWindow.k_down.toString()) {
        const old_k_down = unsafeWindow.k_down;
        const new_k_down = eval(`(${newCode})`)
        unsafeWindow.removeEventListener("keydown", old_k_down, true);
        unsafeWindow.addEventListener("keydown", new_k_down, true);
        unsafeWindow.k_down = new_k_down;
    }

    aleiLog(logLevel.DEBUG, "Patched to make trigger actions interactable.");
}