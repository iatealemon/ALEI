/*
color target can be:
- background "c" parameter
- engine mark "forteam" parameter when "mark" parameter == "watercolor" or "acidcolor"
- one of the trigger actions listed below
*/

export const hexColorTriggerActions = new Set([
    71,  // change color of movable
    90,  // change character blood color
    193, // change sky color (color is on param A)
    232, // set decoration color
    378, // add gun color
    379, // change light color
    389, // set line style of current graphic
    409  // change water color
]);

// disabled cuz color matrix editing isn't added yet
export const colorMatrixTriggerActions = new Set(/*[
    403, // set gun color matrix
    408  // set decor color matrix
]*/);

let nextGroupUid = 0;

export class ColorTargetGroup {
    title;
    category;
    uid;
    color;
    hasError;
    collectiveErrorMessage;
    nextTargetUid;
    targets;

    constructor() {
        this.title = "Empty";
        this.category = null;
        this.uid = nextGroupUid++;
        this.color = null;
        this.hasError = false;
        this.collectiveErrorMessage = "";
        this.nextTargetUid = 0;
        this.targets = [];
    }

    // this adds all valid objects from objs to the target group
    // triggers are excluded because they're supposed to be added using addTriggerActions
    addObjects(objs) {
        let successCount = 0;
        let failCount = 0;
        for (const obj of objs) {
            if (["bg", "inf"].includes(obj._class)) {
                const target = new ColorTarget(obj, this.nextTargetUid);
                if (target.valid) {
                    successCount++;
                    this.targets.push(target);
                    this.nextTargetUid++;
                }
                else {
                    failCount++;
                }
            }
        }
        return {
            successCount: successCount,
            failCount: failCount
        };
    }

    // this adds all valid trigger actions of actionNums from the triggers in objs
    addTriggerActions(objs, actionNums) {
        let successCount = 0;
        let failCount = 0;
        for (const obj of objs) {
            if (obj._class === "trigger") {
                for (const actionNum of actionNums) {
                    const actionID = obj.pm[`actions_${actionNum}_type`];
                    const actionParam = getActionParam(actionID, actionNum);
                    const target = new ColorTarget(obj, this.nextTargetUid, actionNum, actionParam);
                    if (target.valid) {
                        successCount++;
                        this.targets.push(target);
                        this.nextTargetUid++;
                    }
                    else {
                        failCount++;
                    }
                }
            }
        }
        return {
            successCount: successCount,
            failCount: failCount
        };
    }
    
    // category should be updated if necessary before calling this
    updateTitle() {
        this.title = this.makeTitle();
    }

    updateCategory() {
        let newCategory = null;
        for (const target of this.targets) {
            if (newCategory === null) {
                newCategory = target.entity._class;
            }
            else if (target.entity._class !== newCategory) {
                newCategory = "mixed";
                break;
            }
        }
        this.category = newCategory;
    }

    updateColor() {
        let color = null;
        for (const target of this.targets) {
            const targetColor = target.getColorValue();
            if (color === null) {
                color = targetColor;
            }
            else if (color !== targetColor && targetColor !== null) {
                color = null;
                break;
            }
        }
        this.color = color;
    }

    updateErrors() {
        let invalidTargets = [];
        for (const target of this.targets) {
            target.updateValidity();
            if (!target.valid) {
                invalidTargets.push(target);
            }
        }

        if (invalidTargets.length == 0) {
            this.hasError = false;
            this.collectiveErrorMessage = "";
        }
        else {
            const plural = invalidTargets.length > 1;
            this.hasError = true;
            this.collectiveErrorMessage = `This group has ${invalidTargets.length} error${plural ? "s" : ""}`;
            for (let i = 0; i < invalidTargets.length; i++) {
                if (i == 3) { // show only first 3 errors
                    this.collectiveErrorMessage += "\n...";
                    break;
                }
                const target = invalidTargets[i];
                this.collectiveErrorMessage += `\n${target.name}: ${target.errorMessage}`;
            }
        }
    }

    makeTitle() {
        const count = this.targets.length;
        if (count == 0) {
            return "None";
        }
        switch (this.category) {
            case "bg":
                return `Backgrounds (${count})`;
            case "inf":
                return `Engine marks (${count})`;
            case "trigger":
                return `Trigger actions (${count})`;
            case "mixed":
                return `Mixed (${count})`;
            default:
                return "Invalid";
        }
    }
}

class ColorTarget {
    entity;
    actionNum;
    actionParam;
    uid;
    name;
    valid;
    errorMessage;

    constructor(entity, uid, actionNum=null, actionParam=null) {
        this.entity = entity;
        this.uid = uid;
        this.actionNum = actionNum;
        this.actionParam = actionParam;
        this.name = null;
        this.valid = null;
        this.errorMessage = null;

        this.updateName();
        this.updateValidity();
    }

    setColorValue(value) {
        if (this.errorMessage !== null) return;

        switch (this.entity._class) {
            case "bg":
                this.entity.pm.c = value;
                break;
            case "trigger":
                this.entity.pm[this.actionParam] = value;
                break;
            case "inf":
                this.entity.pm.forteam = value;
                break;
        }
    }

    getColorValue() {
        let color = null;
        if (this.valid) {
            switch (this.entity._class) {
                case "bg":
                    color = this.entity.pm.c;
                    break;
                case "trigger":
                    color = this.entity.pm[this.actionParam];
                    break;
                case "inf":
                    color = this.entity.pm.forteam;
                    break;
            }
        }
        if (color === "" || !(/^#[0-9A-Fa-f]{6}$/.test(color))) {
            return "#808080";
        }
        else {
            return color;
        }
    }

    updateName() {
        switch (this.entity._class) {
            case "bg":
                this.name = "Background";
                break;
            case "trigger":
                this.name = `${this.entity.pm.uid} [${this.actionNum}]`;
                break;
            case "inf":
                this.name = "Engine mark";
                break;
        }
    }

    updateValidity() {
        let valid = null;
        let errorMessage = null;
    
        if (!this.entity.exists) {
            valid = false;
            errorMessage = "Object no longer exists";
        }
        else {
            switch (this.entity._class) {
                case "bg":
                    valid = true;
                    break;
                case "trigger":
                    const actionID = parseInt(this.entity.pm[`actions_${this.actionNum}_type`]);
                    valid = (hexColorTriggerActions.has(actionID) || colorMatrixTriggerActions.has(actionID))
                             && this.actionParam == getActionParam(actionID, this.actionNum);
                    if (!valid) errorMessage = "Trigger action is invalid";
                    break;
                case "inf":
                    valid = ["watercolor", "acidcolor"].includes(this.entity.pm.mark)
                    if (!valid) errorMessage = "Engine mark modificator is invalid";
                    break;
                default:
                    valid = false;
                    errorMessage = "Object type is invalid (how did this happen?)"
                    break;
            }
        }
    
        this.valid = valid;
        this.errorMessage = errorMessage;
    }
}

function getActionParam(actionID, actionNum) {
    return actionUsesTargetA(actionID) ? `actions_${actionNum}_targetA` : `actions_${actionNum}_targetB`;
}

function actionUsesTargetA(actionID) {
    return actionID == 193;
}