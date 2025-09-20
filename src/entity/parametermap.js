import { getParameterValueParts } from "./parameterutils.js";
import { aleiSettings } from "../storage/settings.js";
import { aleiLog, logLevel } from "../log.js";
import { aleiExtendedTriggerActionLimit } from "../html5mode.js";

/**
 * debug mode checks the validity of the parameter map after each update and reports any problems. causes lag
 */
const debugMode = false;

/**
 * maps parameter values to entities that have that parameter value. also stores info of which parameters of the entity have the parameter value.  
 * doesn't consider entity.exists.  
 * doesn't store uid parameter values.  
 * only stores parameter values of type string cuz the rest would be a waste of memory.  
 * parameter names of extended triggers should be stored as strings in the form /^actions_(\d+)_(targetA|targetB|type)$/.  
 * parameter map won't be valid for parameters that were set using the color picker since it doesn't call the update function. it's probably fine.
 * @type {Map<string, Map<E, Set<string>>>}
 */
export let parameterMap = new Map();

export function loadParameterMap() {
    parameterMap = new Map();
    es.forEach(addEntityToParameterMap);
}

/**
 * called when entities are created
 * @param {E[]} entities 
 */
export function addEntitiesToParameterMap(entities) {
    entities.forEach(addEntityToParameterMap);

    aleiLog(logLevel.VERBOSE, "addEntitiesToParameterMap called");
    if (debugMode) checkValidityForDebugging("addEntitiesToParameterMap");
}

function addEntityToParameterMap(entity) {
    for (const paramName in entity.pm) {
        if (paramName != "uid" && typeof entity.pm[paramName] == "string") {
            addData(entity, paramName, entity.pm[paramName]);
        }
    }
    if (aleiSettings.extendedTriggers && entity.pm.extended) {
        entity.pm.additionalParamA?.forEach((paramValue, paramIndex) => {
            if (typeof paramValue != "string") return;
            const paramName = `actions_${paramIndex + ( aleiExtendedTriggerActionLimit + 1 )}_targetA`;
            addData(entity, paramName, paramValue);
        });
        entity.pm.additionalParamB?.forEach((paramValue, paramIndex) => {
            if (typeof paramValue != "string") return;
            const paramName = `actions_${paramIndex + ( aleiExtendedTriggerActionLimit + 1 )}_targetB`;
            addData(entity, paramName, paramValue);
        });
    }
}

/**
 * called when parameters are removed (extended triggers)
 * @param {E} entity 
 * @param {string[]} paramNames 
 * @param {any[]} paramValues 
 */
export function parameterMapHandleParametersRemoval(entity, paramNames, paramValues) {
    for (let i = 0; i < paramNames.length; i++) {
        const paramName = paramNames[i];
        const paramValue = paramValues[i];
        if (typeof paramValue == "string") removeData(entity, paramName, paramValue);
    }

    aleiLog(logLevel.VERBOSE, "parameterMapHandleParametersRemoval called");
    if (debugMode) checkValidityForDebugging("parameterMapHandleParametersRemoval");
}

/**
 * called when parameter changes
 * @param {E} entity 
 * @param {string} paramName 
 * @param {string|number|boolean} oldValue 
 * @param {string|number|boolean} newValue 
 */
export function updateParameterMap(entity, paramName, oldValue, newValue) {
    if (paramName == "uid") return;

    // remove old data
    if (typeof oldValue == "string") removeData(entity, paramName, oldValue);

    // add new data
    if (typeof newValue == "string") addData(entity, paramName, newValue);

    aleiLog(logLevel.VERBOSE, "updateParameterMap called");
    if (debugMode) checkValidityForDebugging("updateParameterMap");
}

function removeData(entity, paramName, paramValue) {
    for (const valueToRemove of getParameterValueParts(paramValue)) {
        const innerMap = parameterMap.get(valueToRemove);
        if (innerMap) {
            const entityParams = innerMap.get(entity);
            if (entityParams) {
                entityParams.delete(paramName);
                if (entityParams.size === 0) {
                    innerMap.delete(entity);
                    if (innerMap.size === 0) {
                        parameterMap.delete(valueToRemove);
                    }
                }
            }
        }
    }
}

function addData(entity, paramName, paramValue) {
    for (const valueToAdd of getParameterValueParts(paramValue)) {
        if (!parameterMap.has(valueToAdd)) {
            parameterMap.set(valueToAdd, new Map());
        }
        const innerMap = parameterMap.get(valueToAdd);

        if (!innerMap.has(entity)) {
            innerMap.set(entity, new Set());
        }
        innerMap.get(entity).add(paramName);
    }
}

export function clearParameterMap() {
    parameterMap.clear();
}

function checkValidityForDebugging(source) {
    const validityData = validateParameterMap();
    if (!validityData.valid) {
        aleiLog(logLevel.WARN, 
            `parameter map error (source: ${source})`,
            "\noriginal map:", validityData.originalMap,
            "\ncorrect map:", validityData.correctMap,
            "\nThe effects of this error were fixed automatically."
        );
        parameterMap = validityData.correctMap;
    }
    return validityData.valid;
}

function validateParameterMap() {
    const originalParameterMap = parameterMap;
    loadParameterMap();
    const correctParameterMap = parameterMap;
    
    parameterMap = originalParameterMap;

    return {
        valid: areMapsIdentical(originalParameterMap, correctParameterMap),
        originalMap: originalParameterMap,
        correctMap: correctParameterMap
    };
}

function areMapsIdentical(map1, map2) {
    if (map1.size !== map2.size) {
        return false; // number of parameter values isn't the same
    }
    
    for (const paramValue of map1.keys()) {
        if (!map2.has(paramValue)) {
            return false; // maps don't contain the same parameter values
        }
        
        const innerMap1 = map1.get(paramValue);
        const innerMap2 = map2.get(paramValue);
        if (innerMap1.size !== innerMap2.size) {
            return false; // number of entities in the inner maps isn't the same
        }

        for (const entity of innerMap1.keys()) {
            if (!innerMap2.has(entity)) {
                return false; // inner maps don't contain the same entities
            }

            const set1 = innerMap1.get(entity);
            const set2 = innerMap2.get(entity);
            if (set1.size !== set2.size) {
                return false; // number of parameter names in the sets isn't the same
            }

            for (const paramName of set1) {
                if (!set2.has(paramName)) {
                    return false; // sets don't contain the same parameter names
                }
            }
        }
    }
    
    return true;
}

// add to window so that it can be used in undo/redo
unsafeWindow.updateParameterMap = updateParameterMap;

(function setConsoleStuff() {
    unsafeWindow.getParameterMap = () => { return parameterMap };
    unsafeWindow.validateParameterMap = () => { if (checkValidityForDebugging("console")) aleiLog(logLevel.INFO, "Parameter map is correct") };
})();