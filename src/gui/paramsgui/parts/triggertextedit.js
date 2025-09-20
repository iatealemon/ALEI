import { aleiSettings } from "../../../storage/settings.js";
import { _encodeXMLChars } from "../../../entity/parameterutils.js";
import { aleiExtendedTriggerActionLimit } from "../../../html5mode.js";

/**
 * @param {E} trigger 
 * @returns {string}
 */
export function addTriggerTextEdit(rparams, trigger) {
    let codeLines = "";
    const addCodeLine = (line) => { codeLines += line + "\n"; };
    const getOpName = (actType) => { return trigger_opcode_aliases[actType] ?? `op${actType}`; };
    addCodeLine(`uid: ${trigger.pm.uid}`);
    addCodeLine(`enabled: ${trigger.pm.enabled}`);
    addCodeLine(`maxcalls: ${trigger.pm.maxcalls}`);
    addCodeLine(`execute: ${trigger.pm.execute}`);
    addCodeLine("");
    for (let i = 1; i <= aleiExtendedTriggerActionLimit; i++) {
        const actType = trigger.pm[`actions_${i}_type`];
        if (actType == -1) continue;
        const targetA = _encodeXMLChars(trigger.pm[`actions_${i}_targetA`]);
        const targetB = _encodeXMLChars(trigger.pm[`actions_${i}_targetB`]);
        addCodeLine(`${getOpName(actType)}( "${targetA}", "${targetB}" );`);
    }
    if (unsafeWindow.ExtendedTriggersLoaded && trigger.pm.extended) {
        for (let i = 0; i < trigger.pm.additionalActions.length; i++) {
            const actType = trigger.pm.additionalActions[i];
            if (actType == -1) continue;
            const targetA = _encodeXMLChars(trigger.pm.additionalParamA[i]);
            const targetB = _encodeXMLChars(trigger.pm.additionalParamB[i]);
            addCodeLine(`${getOpName(actType)}( "${targetA}", "${targetB}" );`);
        }
    }
    rparams.insertAdjacentHTML("beforeend", `
        <div style="width:220px;white-space:normal;">This feature should not give you much more freedom, yet you might find it useful to copy/paste/cut trigger actions here.</div>
        <br>
        <textarea id="opcode_field" class="opcode_field" style="display:block;width:100%;height:400px" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea
        ><a class="tool_btn tool_wid" style="width:100%;height:50px;display:block;line-height:50px;" onclick="if ( CompileTrigger() ) UpdateGUIParams();">Apply</a>
        <br
        ><a class="tool_btn tool_wid" style="width:100%;display:block;" onclick="edit_triggers_as_text=false;UpdateGUIParams()">Edit triggers as param list</a>
    `);
    document.getElementById("opcode_field").value = codeLines;
}