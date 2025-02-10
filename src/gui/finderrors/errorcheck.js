export const requirementsData = {
    playerExists: {
        description: "Map has at least 1 player",
        check: (entities) => entities.some(entity => entity._class === "player" || entity._class === "enemy"),
    },
    wallExists: {
        description: "Map has at least 1 wall",
        check: (entities) => entities.some(entity => entity._class === "box"),
    },
};

/**
 * @param {E[]} entities 
 * @returns {Object<string, boolean>}
 */
export function checkRequirements(entities) {
    const result = {};
    for (const name in requirementsData) {
        result[name] = requirementsData[name].check(entities);
    }
    return result;
}

// plainly displayed parameter types are the parameter types that GenParamVal doesn't use special_value for (doesn't include "nochange")
const plainlyDisplayedParameterTypes = new Set(["string", "value+round10", "value", "value>0", "int", "value>0+round10", "value>=0", "value>0+round1", "value>=0+round1"]);
/**
 * @param {E[]} entities 
 * @returns {Map<E, Set<string>>}
 */
export function checkErrors(entities) {
    /** @type {Map<E, Set<string>>} */
    const errors = new Map();

    entities.forEach(entity => {
        for (const { paramName, paramValue, paramType } of iterateParams(entity)) {
            if (plainlyDisplayedParameterTypes.has(paramType)) continue; // skip plainly displayed params (can't have errors)
            if (paramType === "nochange") continue; // skip unused (can't have errors)
            if (paramType === null) continue; // skip undefined type
            
            if (special_value(paramType, paramValue) === ERROR_VALUE) {
                if (!errors.has(entity)) {
                    errors.set(entity, new Set());
                }
                errors.get(entity).add(paramName);
            }
        }
    });
    
    return errors;
}

const entityParamTypes = new Set(["vehicle+none+any", "trigger", "trigger+none", "song+none", "vehicle", "timer", "pushf", "door", "door+none", "barrel", "decor", "lamp", "gun", "region", "water", "character"]);
/**
 * @param {E[]} entities 
 * @returns {Map<E, Set<string>>}
 */
export function checkNumericalRefs(entities) {
    /** @type {Map<E, Set<string>>} */
    const numericalRefs = new Map();

    entities.forEach(entity => {
        for (const { paramName, paramValue, paramType } of iterateParams(entity)) {
            if (!entityParamTypes.has(paramType)) continue;
            
            const cast = parseInt(paramValue);
            if (Number.isFinite(cast) && cast >= 0 && cast.toString() === paramValue.toString()) {
                if (!numericalRefs.has(entity)) {
                    numericalRefs.set(entity, new Set());
                }
                numericalRefs.get(entity).add(paramName);
            }
        }
    });

    return numericalRefs;
}

function* iterateParams(entity) {
    // yield normal params
    for (const paramName in entity.pm) {
        const paramValue = entity.pm[paramName];
        const paramType = getParamType(entity, paramName);
        yield { paramName, paramValue, paramType };
    }
    
    // yield additional trigger actions
    for (let i = 0; i < (entity.pm.additionalActions?.length ?? 0); i++) {
        const actionID = entity.pm.additionalActions[i];
        for (const AorB of ["A", "B"]) {
            const paramName = `actions_${i+11}_target${AorB}`;
            const paramValue = entity.pm[`additionalParam${AorB}`][i];
            const paramType = mark_pairs[`trigger_type_${AorB}${actionID}`] ?? null;
            yield { paramName, paramValue, paramType };
        }
    }
}

const triggerActionParamRegex = /^actions_(\d+)_(type|targetA|targetB)$/;
function getParamType(entity, paramName) {
    const actionParamMatch = paramName.match(triggerActionParamRegex);
    if (actionParamMatch !== null && actionParamMatch[2] !== "type") {
        // get type of action targetA/B based on which action it is
        const actionNum = actionParamMatch[1];
        const actionID = entity.pm[`actions_${actionNum}_type`];
        if (actionParamMatch[2] === "targetA") {
            return mark_pairs["trigger_type_A" + actionID] ?? null;
        }
        else {
            return mark_pairs["trigger_type_B" + actionID] ?? null;
        }
    }
    else {
        const paramIndex = FindMachingParameterID(paramName, entity._class);
        if (paramIndex === -1) return null; // parameter is unregistered
        return param_type[paramIndex][1];
    }
}