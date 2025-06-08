import { checkRequirements, checkErrors, checkAmbiguousRefs, checkNumericalRefs } from "./errorcheck.js";
import { displayErrorCheckGUI } from "./errorgui.js";

export function patchFindErrorsButton() {
    unsafeWindow.CheckForErrors = function() {
        const existingEntities = es.filter(entity => entity.exists);
        
        const requirementsStatus = checkRequirements(existingEntities);
        const errors = checkErrors(existingEntities);
        const ambiguousRefs = checkAmbiguousRefs();
        const numericalRefs = checkNumericalRefs(existingEntities);
        
        if (Object.values(requirementsStatus).includes(false) || errors.size > 0 || ambiguousRefs.size > 0 || numericalRefs.size > 0) {
            displayErrorCheckGUI(requirementsStatus, errors, ambiguousRefs, numericalRefs);
        }
        else {
            alert("No errors were found");
        }
    }
}

export function addErrorCheckingToSave() {
    unsafeWindow.SaveThisMap = (function(old) {
        return function(...args) {
            old.call(this, ...args);

            if (aleiSettings.errorCheckOnSave) {
                const existingEntities = es.filter(entity => entity.exists);
            
                const requirementsStatus = checkRequirements(existingEntities);
                const errors = checkErrors(existingEntities);
                const ambiguousRefs = checkAmbiguousRefs();
    
                let errorMessage = `Errors were found. Click "Find Errors" for more information.`;
                let counter = 0;

                if (Object.values(requirementsStatus).includes(false)) {
                    counter++;
                    errorMessage += `<br>${counter}. Some requirements for the map to be playable are not met.`;
                }
                if (errors.size > 0) {
                    counter++;
                    errorMessage += `<br>${counter}. Some objects have red errors.`;
                }
                if (ambiguousRefs.size > 0) {
                    counter++;
                    errorMessage += `<br>${counter}. Some object references are ambiguous due to objects having shared names.`;
                }

                if (counter > 0) NewNote(errorMessage, note_bad);
            }
        }
    })(unsafeWindow.SaveThisMap);
}