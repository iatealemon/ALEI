import { addEntitiesToUIDMap } from "./uidmap.js";
import { addEntitiesToParameterMap } from "./parametermap.js";
import { ocmHandleEntitiesCreation } from "../ocm/ocm.js";
import { aleiSettings } from "../storage/settings.js";

export function onEntitiesCreated(newEntities) {
    addEntitiesToUIDMap(newEntities);
    addEntitiesToParameterMap(newEntities);
    if (aleiSettings.ocmEnabled) ocmHandleEntitiesCreation(newEntities);
}