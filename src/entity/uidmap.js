import { aleiLog, logLevel } from "../log.js";

/**
 * debug mode checks the validity of the uid map after each update and reports any problems. causes lag
 */
const debugMode = false;

/**
 * maps uid values to sets of entities that have that uid value. doesn't consider entity.exists.
 * @type {Map<string, Set<E>>}
 */
export let uidMap = new Map();

export function loadUIDMap() {
    uidMap = new Map();
    es.forEach(addEntityToUIDMap);
}

/**
 * called when entities are created. only adds the entities that have an uid
 * @param {E[]} entities 
 */
export function addEntitiesToUIDMap(entities) {
    entities.forEach(addEntityToUIDMap);

    aleiLog(logLevel.VERBOSE, "addEntitiesToUIDMap called");
    if (debugMode) checkValidityForDebugging("addEntitiesToUIDMap");
}

function addEntityToUIDMap(entity) {
    if (entity.pm.uid != undefined) {
        addData(entity, entity.pm.uid.toString());
    }
}

/**
 * called when uid changes
 * @param {E} entity 
 * @param {string} oldUID 
 * @param {string} newUID 
 */
export function updateUIDMap(entity, oldUID, newUID) {
    removeData(entity, oldUID);
    addData(entity, newUID);

    aleiLog(logLevel.VERBOSE, "updateUIDMap called");
    if (debugMode) checkValidityForDebugging("updateUIDMap");
}

function removeData(entity, uid) {
    if (uidMap.has(uid)) {
        const set = uidMap.get(uid);
        set.delete(entity);
        if (set.size === 0) {
            uidMap.delete(uid);
        }
    }
}

function addData(entity, uid) {
    if (!uidMap.has(uid)) {
        uidMap.set(uid, new Set());
    }
    uidMap.get(uid).add(entity);
}

export function clearUIDMap() {
    uidMap.clear();
}

function checkValidityForDebugging(source) {
    const validityData = validateUIDMap();
    if (!validityData.valid) {
        console.log(`uid map error (source: ${source})`);
        console.log("original map:", validityData.originalMap);
        console.log("correct map:", validityData.correctMap);
        uidMap = validityData.correctMap;
    }
    return validityData.valid;
}

function validateUIDMap() {
    const originalUIDMap = uidMap;
    loadUIDMap();
    const correctUIDMap = uidMap;
    
    uidMap = originalUIDMap;

    return {
        valid: areMapsIdentical(originalUIDMap, correctUIDMap),
        originalMap: originalUIDMap,
        correctMap: correctUIDMap
    };
}

// maps are identical if they contain the same keys and the values contain the same objects
function areMapsIdentical(map1, map2) {
    if (map1.size !== map2.size) {
        return false; // number of uids isn't the same
    }
    
    for (const uid of map1.keys()) {
        if (!map2.has(uid)) {
            return false; // maps don't contain the same uids
        }
        
        const set1 = map1.get(uid);
        const set2 = map2.get(uid);
        if (set1.size !== set2.size) {
            return false; // number of entities isn't the same
        }
        
        for (const entity of set1) {
            if (!set2.has(entity)) {
                return false; // sets don't contain the same entities
            }
        }
    }
    
    return true;
}

// add to window so that it can be used in undo/redo
unsafeWindow.updateUIDMap = updateUIDMap;

unsafeWindow.getUIDMap = () => { return uidMap };
unsafeWindow.validateUIDMap = () => { if (checkValidityForDebugging("console")) console.log("UID map is correct") };