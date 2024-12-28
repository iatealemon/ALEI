import { aleiSettings } from "../../storage/settings.js";

// for GenParamVal
const plainlyDisplayedParameterTypes = new Set(["string", "value+round10", "value", "value>0", "int", "value>0+round10", "value>=0", "value>0+round1", "value>=0+round1"]);

/**
 * creates the content of the parameter input field based on the parameter type and value
 * @param {string} base - the type of the parameter
 * @param {*} val - the value of the parameter
 * @returns {*|string}
 */
export function GenParamVal(base, val) {
    if (FORCE_TEXT_OPTIONS || plainlyDisplayedParameterTypes.has(base)) {
        return val;
    }

    let shown;
    if (base == "nochange") {
        shown = "- not used -";
    }
    else {
        shown = special_value(base, val);
    }
    
    if (typeof val == "string") val = val.replaceAll('"', "&quot;");
    return `<pvalue real="${val}">${shown}</pvalue>`;
}

/**
 * 
 * @param {E[]} selection 
 * @returns {{
 *      normal: Map<number, {value: *, multiple: boolean, same: boolean}>,
 *      additional: {
 *          type: {value: *, same: boolean}, 
 *          targetA: {value: *, same: boolean}, 
 *          targetB: {value: *, same: boolean}, 
 *          multiple: boolean
 *      }[]
 * }}
 */
export function getParamsToDisplay(selection) {
    return {
        normal: getNormalParamsToDisplay(selection),
        additional: getAdditionalActionsToDisplay(selection),
    };
}

/**
* @param {E[]} selection 
* @returns {Map<number, {value: *, multiple: boolean, same: boolean}>}
*/
function getNormalParamsToDisplay(selection) {
    /** @type {Map<number, {value: *, multiple: boolean, same: boolean}>} */
    let normalParams = new Map();

    // set of parameter indexes to skip checking when it's already been determined that there are multiple of them that aren't the same
    const dontCheck = new Set();

    for (const entity of selection) {
        for (const parameter in entity.pm) {
            const indexInParamType = FindMachingParameterID(parameter, entity._class);
            if (indexInParamType === -1 || dontCheck.has(indexInParamType)) continue;
            if (!normalParams.has(indexInParamType)) {
                normalParams.set(indexInParamType, {
                    value: entity.pm[parameter],
                    multiple: false,
                    same: true,
                });
            }
            else {
                const paramData = normalParams.get(indexInParamType);
                paramData.multiple = true;
                if (paramData.value !== entity.pm[parameter]) {
                    paramData.same = false;
                    dontCheck.add(indexInParamType);
                }
            }
        }
    }

    return normalParams;
}

/**
* @param {E[]} selection 
* @returns {{type: {value: *, same: boolean}, targetA: {value: *, same: boolean}, targetB: {value: *, same: boolean}, multiple: boolean}[]}
*/
function getAdditionalActionsToDisplay(selection) {
    /** @type {{type: {value: *, same: boolean}, targetA: {value: *, same: boolean}, targetB: {value: *, same: boolean}, multiple: boolean}[]} */
    let additionalActions = [];

    if (aleiSettings.extendedTriggers) {
        selection
            .filter(entity => entity.pm.extended)
            .forEach(entity => {
                for (let i = 0; i < entity.pm.additionalActions.length; i++) {
                    if (i >= additionalActions.length) {
                        additionalActions.push({
                            type: {
                                value: entity.pm.additionalActions[i],
                                same: true,
                            },
                            targetA: {
                                value: entity.pm.additionalParamA[i],
                                same: true,
                            },
                            targetB: {
                                value: entity.pm.additionalParamB[i],
                                same: true,
                            },
                            multiple: false,
                        });
                    }
                    else {
                        const actionData = additionalActions[i];
                        actionData.multiple = true;
                        if (actionData.type.same && actionData.type.value !== entity.pm.additionalActions[i]) {
                            actionData.type.same = false;
                        }
                        if (actionData.targetA.same && actionData.targetA.value !== entity.pm.additionalParamA[i]) {
                            actionData.targetA.same = false;
                        }
                        if (actionData.targetB.same && actionData.targetB.value !== entity.pm.additionalParamB[i]) {
                            actionData.targetB.same = false;
                        }
                    }
                }
            });
    }

    return additionalActions;
}