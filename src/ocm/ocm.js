// ocm = object connection map

import {  
    removeIncomingConnections, findAndMakeIncomingConnections, 
    removeOutgoingConnections, findAndMakeOutgoingConnections, 
    getOutgoingConnections
} from "./ocmconnectionutils.js";
import { aleiLog, logLevel } from "../log.js";

/**
 * debug mode checks the validity of the ocm after each update and reports any problems. causes lag
 */
const debugMode = false;

/**
 * maps entities to arrays of entities that it has an uid reference to.  
 * only contains entities with connections.  
 * doesn't consider entity.exists.  
 * an entity can have a connection to itself.
 * @type {Map<E, Set<E>>}
 */
export let outgoingConnectionsMap = new Map();
/**
 * maps entities to arrays of entities that have an uid reference to it.  
 * only contains entities with connections.  
 * doesn't consider entity.exists.  
 * an entity can have a connection to itself.
 * @type {Map<E, Set<E>>}
 */
export let incomingConnectionsMap = new Map();

// set connection maps by looping each element of es, happens after map is loaded
export function loadOCM() {
    outgoingConnectionsMap = new Map();
    incomingConnectionsMap = new Map();

    for (const entity of es) {
        const connectionPartners = getOutgoingConnections(entity);

        // set outgoing connections on this entity
        if (connectionPartners.size > 0) {
            outgoingConnectionsMap.set(entity, connectionPartners);
        }

        // add this entity to the incoming connections of all connection partners
        for (const partner of connectionPartners) {
            if (!incomingConnectionsMap.has(partner)) {
                incomingConnectionsMap.set(partner, new Set());
            }
            incomingConnectionsMap.get(partner).add(entity);
        }
    }
}

/*
ocm needs to update when:
- new entity is created (initialize connections)
- entity uid is changed (update outgoing on everything that matches, incoming on the entity)
- entity parameter is changed (update incoming on everything that matches, outgoing on the entity)
*/

// ocmHandleEntitiesCreation should be called when the creation of entities is finished (after all parameters are set).
export function ocmHandleEntitiesCreation(entities) {
    for (const entity of entities) {
        findAndMakeOutgoingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);
        findAndMakeIncomingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);
    }

    aleiLog(logLevel.VERBOSE, "ocmHandleEntitiesCreation called");
    if (debugMode) checkValidityForDebugging("ocmHandleEntitiesCreation");
}

// should be called when entity.pm.uid changes
export function ocmHandleEntityUIDChange(entity) {
    // first remove all existing incoming connections
    removeIncomingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);

    // then make new connections
    findAndMakeIncomingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);

    aleiLog(logLevel.VERBOSE, "ocmHandleEntityUIDChange called");
    if (debugMode) checkValidityForDebugging("ocmHandleEntityUIDChange");
}

// should be called when properties except uid are set in entity.pm
export function ocmHandleEntityParametersChange(entity) {
    // first remove all existing outgoing connections
    removeOutgoingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);

    // then make new connections
    findAndMakeOutgoingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap);

    aleiLog(logLevel.VERBOSE, "ocmHandleEntityParametersChange called");
    if (debugMode) checkValidityForDebugging("ocmHandleEntityParametersChange");
}

// clear ocm (when making a new map)
export function clearOCM() {
    outgoingConnectionsMap.clear();
    incomingConnectionsMap.clear();
}

function checkValidityForDebugging(source) {
    const validityData = validate();
    const errorMessage = [];
    if (validityData.incoming.valid == false) {
        errorMessage.push(`ocm incoming map error (source: ${source})`);
        errorMessage.push("\noriginal incoming map:", validityData.incoming.originalMap);
        errorMessage.push("\ncorrect incoming map:", validityData.incoming.correctMap);
        incomingConnectionsMap = validityData.incoming.correctMap;
    }
    if (validityData.outgoing.valid == false) {
        errorMessage.push(`\nocm outgoing map error (source: ${source})`);
        errorMessage.push("\noriginal outgoing map:", validityData.outgoing.originalMap);
        errorMessage.push("\ncorrect outgoing map:", validityData.outgoing.correctMap);
        outgoingConnectionsMap = validityData.outgoing.correctMap;
    }
    if (!validityData.incoming.valid || !validityData.outgoing.valid) {
        aleiLog(logLevel.WARN, ...errorMessage, "\nThe effects of this problem were fixed automatically.");
    }
    return validityData.incoming.valid && validityData.outgoing.valid;
}

function validate() {
    const originalOutgoing = outgoingConnectionsMap;
    const originalIncoming = incomingConnectionsMap;
    loadOCM(); // i'm assuming loadOCM doesn't have any bugs
    const correctOutgoing = outgoingConnectionsMap;
    const correctIncoming = incomingConnectionsMap;

    // reset maps to what they were originally so that this function won't have side effects
    outgoingConnectionsMap = originalOutgoing;
    incomingConnectionsMap = originalIncoming;

    return {
        outgoing: {
            valid: areMapsIdentical(correctOutgoing, originalOutgoing),
            originalMap: originalOutgoing,
            correctMap: correctOutgoing
        },
        incoming: {
            valid: areMapsIdentical(correctIncoming, originalIncoming),
            originalMap: originalIncoming,
            correctMap: correctIncoming
        }
    };
}

// ocm maps are identical if they contain the same keys and the values contain the same entities (order doesn't matter)
function areMapsIdentical(map1, map2) {
    if (map1.size !== map2.size) {
        return false; // number of keys isn't the same
    }

    for (const entity of map1.keys()) {
        if (!map2.has(entity)) {
            return false; // maps don't have the same keys
        }

        const set1 = map1.get(entity);
        const set2 = map2.get(entity);
        if (set1.size !== set2.size) {
            return false; // number of entities in value isn't the same
        }

        for (const enti2 of set1) {
            if (!set2.has(enti2)) {
                return false; // value doesn't contain the same entities
            }
        }
    }

    return true;
}

// adding functions to window so they can be used in undo/redo
unsafeWindow.ocmHandleEntityUIDChange = ocmHandleEntityUIDChange;
unsafeWindow.ocmHandleEntityParametersChange = ocmHandleEntityParametersChange;

// console functions for debugging
unsafeWindow.getIncomingConnections = () => { return incomingConnectionsMap; };
unsafeWindow.getOutgoingConnections = () => { return outgoingConnectionsMap; };
unsafeWindow.validateOCM = () => { if (checkValidityForDebugging("console") === true) aleiLog(logLevel.INFO, "Both object connection maps are correct") };