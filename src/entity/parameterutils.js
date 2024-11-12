/**
 * returns array of each parameter value that is contained in the parameter value. necessary 
 * to support multiple parameters format (#region\*1, #region\*2). always returns 1 or 3 values.
 * 
 * examples:  
 * getParameterValueParts("#trigger\*1") -> ["#trigger\*1"]  
 * getParameterValueParts("#region\*1, #region\*2") -> ["#region\*1, #region\*2", "#region\*1", "#region\*2"]  
 * getParameterValueParts("#region\*1, #region\*2, #region\*3") -> ["#region\*1, #region\*2, #region\*3"]
 * @param {string} paramValue 
 * @returns {string[]}
 */
export function getParameterValueParts(paramValue) {
    let ret = [paramValue];
    if (typeof paramValue == "string") {
        // check each part separated by comma
        const parts = paramValue.split(",");
        if (parts.length == 2) {
            // trim space from second part if it exists
            if (parts[1].charAt(0) == " ") {
                parts[1] = parts[1].substring(1);
            }

            // add parts if they're valid
            if (parts[0].length > 0 && parts[1].length > 0) {
                ret.push(...parts);
            }
        }
    }
    return ret;
}

/**
 * replaces oldUID in paramValue with newUID. supports multiple parameters format (#region\*1, #region\*2)
 * @param {string|number|boolean} paramValue 
 * @param {string} oldUID 
 * @param {string} newUID 
 * @returns {string|number|boolean}
 */
export function replaceParamValueUID(paramValue, oldUID, newUID) {
    if (typeof paramValue !== "string") return paramValue;
    const parts = getParameterValueParts(paramValue);
    if (parts.length === 1) {
        return paramValue === oldUID ? newUID : paramValue;
    }
    else {
        return parts.slice(1).map(part => part === oldUID ? newUID : part).join(", ");
    }
}

export function _encodeXMLChars(value) {
    return value.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}