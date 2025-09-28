const executeTriggerAction = 99;
const switchTriggerAction = 363;

/**
 *  This function extends the SaveThisMap functionality by first compiling all instances of extended triggers into a linked list of normal triggers.
 *
 *  [FROM]                       |    [TO]
 *  trigger*1                    |    trigger*1                             trigger*3                             trigger*3
 *  extended:           true     |    extended:           true              *deleted*                             *deleted*
 *  totalNumOfActions:  25       |    totalNumOfActions:  25                *deleted*                             *deleted*
 *  additionalActions:  [..]     |    *deleted*                             *deleted*                             *deleted*
 *  additionalParamA:   [..]     |    *deleted*                             *deleted*                             *deleted*
 *  additionalParamB:   [..]     |    *deleted*                             *deleted*                             *deleted*
 *  actions1-10         [..]     |    actions1-9          [..]              actions1-9   [..]                     actions1-7    [..]
 *                               |    actions10           trigger*2         actions10    trigger*3                actions8-10   Do nothing.
 */
export function compileAllExtendedTriggers() {
    const mainTriggers = es.filter(e => (
        e.exists &&
        e._class === "trigger" &&
        e.pm.extended &&
        e.extendedAndParsed
    ));
    compileExtendedTriggers(mainTriggers);
}

unsafeWindow.compileExtendedTriggers = compileExtendedTriggers;
function compileExtendedTriggers(mainTriggers) {
    for (const mainTrigger of mainTriggers) {
        const actionList = getActionList(mainTrigger);
        const extensionTriggers = createExtensionTriggers(mainTrigger, actionList);
        linkTriggers(mainTrigger, extensionTriggers);
        setCompileProperties(mainTrigger);
    }
}

function getActionList(trigger) {
    const actionCount = Math.max(trigger.pm.totalNumOfActions ?? 100);
    const actionList = new Array(actionCount);
    let act_i = 0;
    for (let num = 1; num <= 100; num++) {
        actionList[act_i++] = {
            type: trigger.pm[`actions_${num}_type`],
            targetA: trigger.pm[`actions_${num}_targetA`],
            targetB: trigger.pm[`actions_${num}_targetB`],
        };
    }
    for (let i = 0; i < actionCount - 100; i++) {
        actionList[act_i++] = {
            type: trigger.pm.additionalActions[i],
            targetA: trigger.pm.additionalParamA[i],
            targetB: trigger.pm.additionalParamB[i],
        };
    }
    return actionList;
}

function createExtensionTriggers(mainTrigger, actionList) {
    const newTriggersCount = Math.ceil(actionList.length / 99) - 1;
    const newTriggers = new Array(newTriggersCount);
    let newTriggerX = mainTrigger.pm.x;
    let newTriggerY = mainTrigger.pm.y + 20;
    let act_i = 99; // skip first 99 trigger actions which are already in the main trigger
    for (let i = 0; i < newTriggersCount; i++) {
        const newTrigger = new E("trigger");
        newTrigger.pm.uid = `${mainTrigger.pm.uid}'s extended trigger no: ${i}.`;
        newTrigger.pm.x = newTriggerX;
        newTrigger.pm.y = newTriggerY;
        newTrigger.pm.maxcalls = -1;

        for (let num = 1; num <= 99; num++) {
            const act = actionList[act_i++];
            if (!act) break;
            newTrigger.pm[`actions_${num}_type`] = act.type;
            newTrigger.pm[`actions_${num}_targetA`] = act.targetA;
            newTrigger.pm[`actions_${num}_targetB`] = act.targetB;
        }

        newTriggers[i] = newTrigger;
        es.push(newTrigger);

        newTriggerX += 5;
    }

    return newTriggers;
}

function linkTriggers(mainTrigger, extensionTriggers) {
    if (extensionTriggers.length === 0) return;
    mainTrigger.pm.actions_100_type = executeTriggerAction; // not switch so that maxcalls will still have an effect
    mainTrigger.pm.actions_100_targetA = extensionTriggers[0].pm.uid;
    for (let i = 0; i < extensionTriggers.length - 1; i++) {
        extensionTriggers[i].pm.actions_100_type = switchTriggerAction;
        extensionTriggers[i].pm.actions_100_targetA = extensionTriggers[i + 1].pm.uid;
    }
}

function setCompileProperties(mainTrigger) {
    delete mainTrigger.pm.additionalActions;
    delete mainTrigger.pm.additionalParamA;
    delete mainTrigger.pm.additionalParamB;
    mainTrigger.extendedAndParsed = false;
}