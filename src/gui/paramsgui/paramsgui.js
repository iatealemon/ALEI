import { SelectedObjects } from "../../entity/entity.js";
import { RemoveObjectProperties, SortObjectsByPriority, sortRequired, 
    AssignObjectProperties, propertyAppliedObjects, REGION_EXECUTE_PARAM_ID } from "../../entity/parameter.js";
import { aleiLog, logLevel } from "../../log.js";
import { disconnectParamSideButtons } from "./paramsidebuttons/paramsidebuttons.js";
import { makeGUISelInfoInnerHTML } from "./parts/selinfo.js";
import { addNormalParamDisplay, StreetMagic } from "./parts/normalparams.js";
import { addTriggerTextEdit } from "./parts/triggertextedit.js";
import { GenParamVal } from "./paramsguiutils.js";
import { clearSelectedActions } from "../../triggeractions/interactions/selection.js";
import { stopTriggerActionDrag } from "../../triggeractions/interactions/dragndrop/dragndrop.js";

const paramsGUITypes = {
    none: 0,
    normal: 1,
    textedit: 2,
};

export function patchParamsGUI() {
    optimizeFindMachingParameterID();
    unsafeWindow.UpdateGUIParams = UpdateGUIParams;
    unsafeWindow.StreetMagic = StreetMagic;
    unsafeWindow.GenParamVal = GenParamVal;
    aleiLog(logLevel.DEBUG, "Patched parameters GUI");
}

function optimizeFindMachingParameterID() {
    /** @type {Object<string, Object<string, number>>} */
    let paramTypeMap = {};

    for (const _class of known_class) {
        paramTypeMap[_class] = {};
        for (let i = 0; i < param_type.length; i++) {
            const allowedType = param_type[i][4];
            if (allowedType === "*" || allowedType === _class) {
                const paramName = param_type[i][0];
                paramTypeMap[_class][paramName] = i;
            }
        }
    }

    unsafeWindow.FindMachingParameterID = (fm_parameter, fm_class) => {
        return paramTypeMap[fm_class]?.[fm_parameter] ?? -1;
    };
}

function UpdateGUIParams() {
    //SelectedObjects.forEach(o => ApplyObjectProperties(o));

    for (let element of propertyAppliedObjects) {
        if (element.selected) continue;
        RemoveObjectProperties(element);
        propertyAppliedObjects.splice(propertyAppliedObjects.indexOf(element), 1);
    }
    SelectedObjects.forEach(o => AssignObjectProperties(o));

    // This code handles transition between timer and trigger values depending on region's "executes" parameter
    if (SelectedObjects.length == 1 && SelectedObjects[0]._class == "region") {
        if ([true, "true"].includes(SelectedObjects[0].pm.uses_timer)) {
            param_type[REGION_EXECUTE_PARAM_ID][1] = "timer+none";
        } else {
            param_type[REGION_EXECUTE_PARAM_ID][1] = "trigger+none";
        }
    }

    unfocusedit();
    ff.style.display = "none";

    disconnectParamSideButtons();
    clearSelectedActions();
    stopTriggerActionDrag();

    // save current scroll
    const lastRparamsScroll = document.getElementById("rparams")?.scrollTop ?? 0;
    const lastOpcodeFieldScroll = document.getElementById("opcode_field")?.scrollTop ?? 0;

    gui_params.innerHTML = `
        <div id="gui_sel_info" class="gui_sel_info">${makeGUISelInfoInnerHTML(SelectedObjects)}</div>
        <br>
        <div class="q"></div>
        <br>
    `;

    const currentParamsGUI = decideParamsGUIType(SelectedObjects);
    if (currentParamsGUI === paramsGUITypes.normal) {
        const rparams = document.createElement("div");
        rparams.id = "rparams";
        gui_params.appendChild(rparams);

        addNormalParamDisplay(rparams, SelectedObjects);

        rparams.scrollTop = lastRparamsScroll;
    }
    else if (currentParamsGUI === paramsGUITypes.textedit) {
        const rparams = document.createElement("div");
        rparams.id = "rparams";
        gui_params.appendChild(rparams);

        addTriggerTextEdit(rparams, SelectedObjects[0]);

        rparams.scrollTop = lastRparamsScroll;
        document.getElementById("opcode_field").scrollTop = lastOpcodeFieldScroll;
    }

    if (sortRequired) SortObjectsByPriority();
}

/**
 * returns paramsGUITypes.none, paramsGUITypes.normal, or paramsGUITypes.textedit
 * @param {E[]} selection 
 * @returns {paramsGUITypes[keyof typeof paramsGUITypes]}
 */
function decideParamsGUIType(selection) {
    if (selection.length === 0) {
        return paramsGUITypes.none;
    }
    else if (edit_triggers_as_text && selection.length === 1 && selection[0]._class === "trigger") {
        return paramsGUITypes.textedit;
    }
    else {
        return paramsGUITypes.normal;
    }
}