/**
 *  This function is invoked whenever someone clicks on an option in the dropdown menu of parameter values.
 *  For example, clicking on "Force Movable 'A' move to Region 'B'"
 *
 *  Prompts for further input if required and updates the GUI.
 *
 *  @param {string} val1    The real actual value.
 *  @param {string} val2    Name / Label of the value clicked.
 *  @param {string} defval  Previous real value.
 */
function setletedit(val1, val2, defval) {
    quick_pick = false;
    quick_pick_ignore_one_click = false;

    // Clicked on a value that prompts for a number. Like number of trigger calls.
    if (val1.indexOf('[val]') != -1) {
        defval = Math.abs(Number(defval));
        var txt = prompt('Enter value:', defval);
        var gotval;

        if (txt == null || txt == '') {
            gotval = Math.abs(defval);
        } else {
            gotval = Math.abs(txt);
        }
        val1 = eval(val1.replace('[val]', gotval));
        val2 = val2.replace('#', gotval);
    }

    // Clicked on a value that prompts for a hex colour code.
    else if (val1.indexOf('[color]') != -1) {
        defval = Math.abs(Number(defval));
        var gotval = prompt('Enter value in format #XXXXXX:', defval);
        if (gotval.charAt(0) != '#') {
            gotval = '#' + gotval;
        }
        if (gotval.length != 7)
            alert('Value ' + gotval + ' is not correct. Valid value must be in format #XXXXXX. Read about "hex color codes" for more information.');
        val1 = val1.replace('[color]', gotval);
        val2 = val2.replace('#', gotval);
    }

    // Updates the GUI with new value.
    ff.value = '<pvalue real="' + val1 + '">' + val2 + '</pvalue>';

    lettarget.innerHTML = ff.value;
    ff.style.display = 'none';
    ff_drop.style.display = 'none';
    letediting = false;

    UpdatePhysicalParam((lettarget.id.replace('pm_', '')), val1);

    var parameter_updated = lettarget.id.replace('pm_', '');

    if (parameter_updated == 'mark' || (parameter_updated.indexOf('actions_') != -1 && parameter_updated.indexOf('_type') != -1))
        StreetMagic();
}