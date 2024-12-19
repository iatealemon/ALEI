import { addEntitiesToUIDMap } from "./uidmap.js";
import { addEntitiesToParameterMap } from "./parametermap.js";
import { ocmHandleEntitiesCreation } from "../ocm/ocm.js";
import { aleiSettings } from "../storage/settings.js";
import { aleiLog, logLevel } from "../log.js";

export function onEntitiesCreated(newEntities) {
    addEntitiesToUIDMap(newEntities);
    addEntitiesToParameterMap(newEntities);
    if (aleiSettings.ocmEnabled) ocmHandleEntitiesCreation(newEntities);
}

export let SelectedObjects = [];
unsafeWindow.getSelection = () => { return SelectedObjects; };

export function clearSelectedObjects() {
    SelectedObjects = [];
}

export function patchEntityClass() {
    let og_E = unsafeWindow.E;
    unsafeWindow.E = function(_class) {
        let result = new og_E(_class);

        // Adding property.
        if(_class == "water") result.pm.attach = -1;
        else if(_class == "decor") result.pm.text = "Hello World!";
        else if(_class == "trigger") {
            let entries = Object.entries(result.pm);
            entries.splice(5, 0, ["execute", false]);
            result.pm = Object.fromEntries(entries);
        }
        else if(_class == "region") result.pm.uses_timer = false;

        result.fixPos = function() {}; // For proper snapping.

        result.Remove = () => { // Better be safe...
            NewNote(`ALEI: This absolutely should not happen, please report to ALEI developers, error: E.Remove got called when it shouldn't be`, `#FF0000`);
            debugger;
        };

        let proxy = new Proxy(result, {
            set: function(target, key, value, receiver) {
                if (key == "selected") {
                    const oldValue = target.selected;
                    if ((value && !oldValue)) {
                        SelectedObjects.push(receiver);
                    } else if (!value && oldValue) {
                        SelectedObjects.splice(SelectedObjects.indexOf(receiver), 1);
                    }
                }
                return Reflect.set(target, key, value, receiver);
            }
        });
        return proxy;
    }
    aleiLog(logLevel.DEBUG, "Patched entity.");
}