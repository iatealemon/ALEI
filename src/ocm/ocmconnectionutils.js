import { aleiLog, logLevel } from "../log.js";
import { aleiSettings } from "../storage/settings.js";
import { uidMap } from "../entity/uidmap.js";
import { parameterMap } from "../entity/parametermap.js";
import { getParameterValueParts } from "../entity/parameterutils.js";

export function removeIncomingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap) {
    const connectionPartnersToRemove = incomingConnectionsMap.get(entity);
    if (connectionPartnersToRemove !== undefined) {
        // remove connections from this entity
        incomingConnectionsMap.delete(entity);

        // remove the same connections from connection partners
        connectionPartnersToRemove.forEach(partner => {
            const partnersConnections = outgoingConnectionsMap.get(partner);
            if (partnersConnections !== undefined) {
                partnersConnections.delete(entity);
                if (partnersConnections.size === 0) {
                    outgoingConnectionsMap.delete(partner);
                }
            }
            else {
                aleiLog(logLevel.DEBUG, "removeIncomingConnections warning: ocm connections are not symmetrical");
            }
        });
    }
}

export function findAndMakeIncomingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap) {
    const newConnectionPartners = getIncomingConnections(entity);
    if (newConnectionPartners.size > 0) {
        incomingConnectionsMap.set(entity, newConnectionPartners);
    }
    newConnectionPartners.forEach(partner => {
        if (!outgoingConnectionsMap.has(partner)) {
            outgoingConnectionsMap.set(partner, new Set());
        }
        outgoingConnectionsMap.get(partner).add(entity);
    });
}

export function removeOutgoingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap) {
    const connectionPartnersToRemove = outgoingConnectionsMap.get(entity);
    if (connectionPartnersToRemove !== undefined) {
        // remove connections from this entity
        outgoingConnectionsMap.delete(entity);

        // remove the same connections from connection partners
        connectionPartnersToRemove.forEach(partner => {
            const partnersConnections = incomingConnectionsMap.get(partner);
            if (partnersConnections !== undefined) {
                partnersConnections.delete(entity);
                if (partnersConnections.size === 0) {
                    incomingConnectionsMap.delete(partner);
                }
            }
            else {
                aleiLog(logLevel.DEBUG, "removeOutgoingConnections warning: ocm connections are not symmetrical");
            }
        });
    }
}

export function findAndMakeOutgoingConnections(entity, incomingConnectionsMap, outgoingConnectionsMap) {
    const newConnectionPartners = getOutgoingConnections(entity);
    if (newConnectionPartners.size > 0) {
        outgoingConnectionsMap.set(entity, newConnectionPartners);
    }
    newConnectionPartners.forEach(partner => {
        if (!incomingConnectionsMap.has(partner)) {
            incomingConnectionsMap.set(partner, new Set());
        }
        incomingConnectionsMap.get(partner).add(entity);
    });
}

export function getOutgoingConnections(entity) {
    let normalParamValues = [];
    for (const paramName in entity.pm) {
        if (paramName != "uid" && typeof entity.pm[paramName] != "object") {
            normalParamValues.push(entity.pm[paramName]);
        }
    }

    const allParamValues = aleiSettings.extendedTriggers && entity.pm.extended
        ? [...normalParamValues, ...(entity.pm.additionalParamA ?? []), ...(entity.pm.additionalParamB ?? [])]
        : normalParamValues;
    
    const connectionPartners = new Set();
    for (const paramValue of allParamValues) {
        for (const part of getParameterValueParts(paramValue)) {
            uidMap.get(part)?.forEach(partner => connectionPartners.add(partner));
        }
    }
    return connectionPartners;
}

export function getIncomingConnections(entity) {
    const uid = entity.pm.uid;
    return (uid === undefined || !parameterMap.has(uid))
        ? new Set()
        : new Set(parameterMap.get(uid).keys());
}