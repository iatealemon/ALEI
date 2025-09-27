import { aleiLog, logLevel } from "../log.js";

const doNothingAction = -1;
const executeTriggerAction = 99;
const switchTriggerAction = 363;

/** This function is invoked whenever the map loads.
 *
 *  It looks for potential triggers configured in a linked list manner and converts it to an extended trigger.
 */
export function parseAllExtendedTriggers() {
    const existingTriggers = es.filter(e => e.exists && e._class === "trigger");
    const mainTriggers = existingTriggers.filter(t => t.pm.extended && !t.extendedAndParsed);
    parseExtendedTriggers(mainTriggers, existingTriggers);
}

unsafeWindow.parseExtendedTriggers = parseExtendedTriggers;
function parseExtendedTriggers(mainTriggers, triggersToSearch) {
    for (const mainTrigger of mainTriggers) {
        mainTrigger.extendedAndParsed = false;

        /** 
         * for backwards compatibility with extended triggers defined with the 10 action limit.  
         * if actions 11-100 are all empty, the value is set to 10
         */
        const thisTriggersActionLimit = hasMax10Actions(mainTrigger) ? 10 : 100;

        try {
            const extensionTriggers = findExtensionTriggers(mainTrigger, thisTriggersActionLimit, triggersToSearch);
            aleiLog(logLevel.VERBOSE, "Parsing extended trigger consisting of", [mainTrigger, ...extensionTriggers]);
            if (thisTriggersActionLimit === 10 && extensionTriggers.some(trigger => !hasMax10Actions(trigger))) {
                throw new Error(`Extended trigger was determined to be 10-action-limited, but parsing this way would've caused loss of data in actions 11-100 of at least one of the extension triggers`);
            }
            const actionList = getActionList(mainTrigger, extensionTriggers, thisTriggersActionLimit);
            aleiLog(logLevel.VERBOSE, "Action list:", actionList);
            if (mainTrigger.pm.totalNumOfActions !== undefined) { // backwards compatibility
                tryToResizeActionList(actionList, mainTrigger.pm.totalNumOfActions);
            }
            applyActionList(mainTrigger, actionList);
            removeExtensionTriggers(extensionTriggers);
            aleiLog(logLevel.VERBOSE, "Parsed extended trigger", mainTrigger);
        }
        catch (e) {
            console.error(e);
            aleiLog(logLevel.SWARN, `Failed to parse extended trigger ${mainTrigger.pm.uid}.`);
            NewNote(`ALEI: Failed to parse extended trigger ${mainTrigger.pm.uid}.<br>${e.name}: ${e.message}`, note_bad);
        }
    }
}

function hasMax10Actions(trigger) {
    for (let num = 100; num >= 11; num--) {
        if (trigger.pm[`actions_${num}_type`] != doNothingAction) {
            return false
        }
    }
    return true;
}

function findExtensionTriggers(mainTrigger, thisTriggersActionLimit, triggersToSearch) {
    const actionNumToCheck = thisTriggersActionLimit;
    let currentTrigger = mainTrigger;
    const extensionTriggers = [];
    const visited = new Set();
    while (true) {
        const checkedActionType = currentTrigger.pm[`actions_${actionNumToCheck}_type`]
        const linkActionExists = 
            currentTrigger === mainTrigger
            ? checkedActionType == switchTriggerAction || checkedActionType == executeTriggerAction
            : checkedActionType == switchTriggerAction;
        if (!linkActionExists) break;

        if (visited.has(currentTrigger)) {
            throw new Error(`Reached an infinite loop when parsing extended triggers (at trigger ${currentTrigger.pm.uid})`);
        }
        visited.add(currentTrigger);

        const uidToFind = currentTrigger.pm[`actions_${actionNumToCheck}_targetA`];
        const nextTrigger = triggersToSearch.find(t => t.pm.uid === uidToFind) ?? null;
        if (nextTrigger === null) {
            throw new Error(`Couldn't find extension trigger with uid ${uidToFind} (link from trigger ${currentTrigger.pm.uid})`);
        }
        else {
            extensionTriggers.push(nextTrigger);
            currentTrigger = nextTrigger;
        }
    }

    return extensionTriggers;
}

function getActionList(mainTrigger, extensionTriggers, thisTriggersActionLimit) {
    const actionList = [];
    for (const trigger of [mainTrigger, ...extensionTriggers]) {
        for (let num = 1; num < thisTriggersActionLimit; num++) { // the linking trigger action isn't added to the list
            actionList.push({
                type: trigger.pm[`actions_${num}_type`],
                targetA: trigger.pm[`actions_${num}_targetA`],
                targetB: trigger.pm[`actions_${num}_targetB`],
            });
        }
    }
    return actionList;
}

function tryToResizeActionList(actionList, targetLength) {
    // try to shrink
    while (actionList.length > targetLength && actionList.at(-1).type === doNothingAction) {
        actionList.pop();
    }

    // try to grow
    while (actionList.length < targetLength) {
        actionList.push({
            type: doNothingAction,
            targetA: 0,
            targetB: 0,
        });
    }
}

function applyActionList(mainTrigger, actionList) {
    let act_i = 0;
    for (let num = 1; num <= 100; num++) {
        const act = actionList[act_i++];
        mainTrigger.pm[`actions_${num}_type`] = act?.type ?? doNothingAction;
        mainTrigger.pm[`actions_${num}_targetA`] = act?.targetA ?? 0;
        mainTrigger.pm[`actions_${num}_targetB`] = act?.targetB ?? 0;
    }
    if (actionList.length > 100) {
        const additionalActionsCount = actionList.length - 100;
        mainTrigger.pm.additionalActions = new Array(additionalActionsCount);
        mainTrigger.pm.additionalParamA = new Array(additionalActionsCount);
        mainTrigger.pm.additionalParamB = new Array(additionalActionsCount);
        for (let i = 0; i < additionalActionsCount; i++) {
            const { type, targetA, targetB } = actionList[act_i++];
            mainTrigger.pm.additionalActions[i] = type;
            mainTrigger.pm.additionalParamA[i] = targetA;
            mainTrigger.pm.additionalParamB[i] = targetB;
        }
        mainTrigger.pm.totalNumOfActions = actionList.length;
        mainTrigger.pm.extended = true;
        mainTrigger.extendedAndParsed = true;
    }
    else {
        aleiLog(logLevel.VERBOSE, "Extended trigger has less than 100 actions, converting to regular trigger");
        delete mainTrigger.pm.additionalActions;
        delete mainTrigger.pm.additionalParamA;
        delete mainTrigger.pm.additionalParamB;
        delete mainTrigger.pm.totalNumOfActions;
        delete mainTrigger.pm.extended;
        delete mainTrigger.extendedAndParsed;
    }
}

function removeExtensionTriggers(extensionTriggers) {
    for (const trigger of extensionTriggers) {
        const index = es.indexOf(trigger);
        if (index !== -1) {
            es.splice(index, 1);
        }
    }
}