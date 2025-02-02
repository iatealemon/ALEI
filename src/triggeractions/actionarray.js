const doNothingAction = -1;

/**
 * @param {E} trigger 
 * @returns {{type: *, targetA: *, targetB: *}[]}
 */
export function getTriggerActions(trigger) {
    let triggerActions = [];

    for (let i = 1; i <= 10; i++) {
        triggerActions.push({
            type: trigger.pm[`actions_${i}_type`],
            targetA: trigger.pm[`actions_${i}_targetA`],
            targetB: trigger.pm[`actions_${i}_targetB`],
        });
    }

    if (trigger.pm.additionalActions !== undefined) {
        for (let i = 0; i < trigger.pm.additionalActions.length; i++) {
            triggerActions.push({
                type: trigger.pm.additionalActions[i],
                targetA: trigger.pm.additionalParamA[i],
                targetB: trigger.pm.additionalParamB[i],
            });
        }
    }

    return triggerActions;
}

/**
 * @param {{type: *, targetA: *, targetB: *}[]} triggerActions 
 * @returns {boolean}
 */
export function hasEmptyActions(triggerActions) {
    return triggerActions.some(act => act.type == doNothingAction);
}

/**
 * sets the trigger action parameters of the current selection according to the triggerActions array of actions.  
 * firstActionNum should be defined if triggerActions is a segment of the full trigger actions array
 * @param {{type: *, targetA: *, targetB: *}[]} triggerActions 
 * @param {number} firstActionNum 
 */
export function setParametersFromActionArray(triggerActions, firstActionNum=1) {
    let paramsToSet = { names: [], values: [] };
    for (let i = 0; i < triggerActions.length; i++) {
        const actionNum = i + firstActionNum;
        const act = triggerActions[i];
        paramsToSet.names.push(`actions_${actionNum}_type`);
        paramsToSet.values.push(act.type);
        paramsToSet.names.push(`actions_${actionNum}_targetA`);
        paramsToSet.values.push(act.targetA);
        paramsToSet.names.push(`actions_${actionNum}_targetB`);
        paramsToSet.values.push(act.targetB);
    }
    UpdatePhysicalParams(paramsToSet.names, paramsToSet.values, false, false);
}