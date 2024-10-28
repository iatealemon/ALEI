import { registerParamSideButton } from "../paramsidebuttons/paramsidebuttons.js";
import { ColorTargetGroup, hexColorTriggerActions, colorMatrixTriggerActions } from "./colortarget.js";
import { makeNewColorWindow } from "./colorwindow.js";

export function registerOpenInColorEditorButton() {
    const id = "openInColorEditorButton";
    const className = "alei-open-in-color-editor-button";
    const text = "🖌️";
    const tooltip = "Open in color editor";
    const func = openInColorEditorButtonClicked;
    const locationData = {
        bg: {
            c: {
                type: "param"
            }
        },
        inf: {
            forteam: {
                type: "param"
            }
        },
        trigger: {
            triggerActionsItem: {
                type: "trigger actions"
            }
        }
    };
    const allowMultipleSelection = true;
    const visibilityCondition = shouldButtonBeShown;
    registerParamSideButton(id, className, text, tooltip, func, locationData, allowMultipleSelection, visibilityCondition);
}

function openInColorEditorButtonClicked(data) {
    const targetGroup = new ColorTargetGroup();
    let addedCount;
    let notAddedCount;
    if (data.item == "triggerActionsItem") {
        const ret = targetGroup.addTriggerActions(data.selectionData.objs, [data.actionNum]);
        addedCount = ret.successCount;
        notAddedCount = ret.failCount;
    }
    else {
        const ret = targetGroup.addObjects(data.selectionData.objs);
        addedCount = ret.successCount;
        notAddedCount = ret.failCount;
    }
    targetGroup.updateCategory();
    targetGroup.updateTitle();
    targetGroup.updateColor();
    
    makeNewColorWindow(targetGroup);
    if (notAddedCount > 0) {
        NewNote(`Note: ${notAddedCount} items were excluded for being invalid.`, note_passive);
    }
}

function shouldButtonBeShown(data) {
    switch (data.selectionData._class) {
        case "bg":
            return true;
        case "inf":
            for (const engineMark of data.selectionData.objs) {
                if (!(["watercolor", "acidcolor"].includes(engineMark.pm.mark))) {
                    return false;
                }
            }
            return true;
        case "trigger":
            for (const trigger of data.selectionData.objs) {
                const actionID = parseInt(trigger.pm[`actions_${data.actionNum}_type`]);
                if (!(hexColorTriggerActions.has(actionID) || 
                      colorMatrixTriggerActions.has(actionID))) {
                        return false;
                    }
            }
            return true;
    }
}