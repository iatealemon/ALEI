import { getALEIMapDataFromALEIMapDataObject, loadALEIMapDataIntoUse, initializeALEIMapData } from "./aleimapdata/aleimapdata.js";
import * as aleimapdatapatches from "./aleimapdata/aleimapdatapatches.js";

import { onEntitiesCreated, patchEntityClass, SelectedObjects, clearSelectedObjects } from "./entity/entity.js";
import { patchUpdatePhysicalParam, updateParameters, assignObjectIDs, assignObjectPriority } from "./entity/parameter.js";
import { loadParameterMap, parameterMapHandleParametersRemoval, clearParameterMap } from "./entity/parametermap.js";
import { replaceParamValueUID } from "./entity/parameterutils.js";
import { loadUIDMap, clearUIDMap } from "./entity/uidmap.js";

import "./gui/colorpicker/colorwindow.js";
import { registerOpenInColorEditorButton } from "./gui/colorpicker/opencoloreditorbutton.js";
import { fixWebpackStyleSheets } from "./gui/css/loadcss.js";
import { replaceThemeSet, patchSaveBrowserSettings, initTheme } from "./gui/css/themes.js";
import { patchFindErrorsButton } from "./gui/finderrors/finderrors.js";
import { registerCommentAdderButton, registerCommentRemoverButton } from "./gui/paramsgui/comments/commentbuttons.js";
import { patchParamsGUI } from "./gui/paramsgui/paramsgui.js";
import { Renderer_initialize } from "./gui/renderer/renderer.js";
import { patchTriggerActionList, patchMaskTriggerActions } from "./gui/actionlist.js";
import "./gui/draggablewindow.js";
import { createALEISettingsMenu, showSettings } from "./gui/settingsmenu.js";
import { patchUpdateTools } from "./gui/toolbar.js";
import { patchTopPanel, addTopButton } from "./gui/topgui.js";

import { loadOCM, clearOCM, ocmHandleEntityParametersChange } from "./ocm/ocm.js";

import { aleiSettings } from "./storage/settings.js";
import { readStorage, writeStorage } from "./storage/storageutils.js";

import { patchForInteractableTriggerActions } from "./triggeractions/interactability.js";

import { parse as alescriptParse } from "./alescript.js";
import { activateHTML5Mode, html5ModeActive } from "./html5mode.js";
import { aleiLog, logLevel, ANSI_RESET, ANSI_YELLOW } from "./log.js";
import { checkForUpdates } from "./updates.js";

"use strict";

document.fonts.load( "16px EuropeExt Regular" );
document.fonts.load( "16px DejaVu Sans Mono" );

let window = unsafeWindow;
let isNative;
try {
    GM_info
    isNative = true;
    window["nativeALEIRunning"] = true;
} catch (e) {
    isNative = false
};

if(!isNative && (window["nativeALEIRunning"] == true)) {
    Hello_IgnoreThisError_ItIsIntentional // hope this is not defined
}

// Shorthand things
function $id(id) {
    return document.getElementById(id);
}
function $query(selector) {
    return document.querySelector(selector);
}

let ROOT_ELEMENT = document.documentElement;
let stylesheets = document.styleSheets;
let VAL_TABLE = {}; // Will be filled later.
window.ExtendedTriggersLoaded = false;

const TEXT_OVERHEAD         = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAYCAYAAAAxkDmIAAAAAXNSR0IArs4c6QAABHNJREFUaEPtmVvoZWMYxn+PMznEBSGlxAVuJKUcQyTHUCahEZNG43wYx8HIMIjJjPk3MimD0EyMQ0oRrpxKkblwKBdDcoFBktNrPbt3a82atfde/zV/snfru137W+v93ud5n/d5vy26NdEZ0ESfrjscHcATToIO4A7gCc/AhB+vtoIj4gLgEeA9SScMy0FEHAc8AWyQdNB08xURnwC7ABcCezf97qjvRMROwFvAvsA8SU9X90TEAcCLwP7Ao5Lm1r23+J33ngNMSbpy1LfbPC/nQdIbo95RydvSfg6reycWYCcoIh4ArgBWSzqvBuCbgNuAbYHPgNOL331a/l1EHA48A2wHXCTp1VHJb/O8A7hF1iLiZOBx4CfglBrw3i7AP7h49j5wFHCXpHsqAJsEC4rnr0s6tUUYjbaMDcARcQZwJ2C53qpyuj+BLzKRT2aVDZToiDgQuA84Btix8q5I4F4C5koyiJusiHgZOB5YWAYvIk4DHgM+LyT6KWAx8G61JRUtyCQ4BJgPvNk0HuDMbDd/pUJYAfpraB4ssxFxTXG+a4E9i3xWlXZDcZ4tgB+ztbWW6I+KD6wYQcFdAbP8O+BiwP1qB+AWSSsr1eDndwO/AbPzIMMAdn88EVhl0kha339fSuf9gCV0haR5AwC+LMH7sPje0aX9U5ZcYEnG5H69V1mGI8KyvqyI9cskmYnQKB6TJQHeOlVkvkmY3sDgXQ18ayJIWlfpqbvn3l+A6yW5RfRWkt45NEG/2VyAbVSarnXAswV4NwMvSJo1IOEO1uxeJGnhIJOVpHkO+KNOXvOw/SpcL+nQAd/bxGyVzJWrapakdyLiXuAqg9E3W2muzi4MzEPAGqBxPEkcG9WPJR1RjS2V5VjgRknLKnk4C5gDLJV0Xc1em8NXCuJuv7kAT8tFZxIsZduMYIUreLGkBUMAXjTKnTd18AmeK2aNzVZE3FDEd0cSsWe+SmbqV5stYLc0V35sslqVhk4L5XgKU2bCDJxEImI2YEVZK2ltJQ+OyZNML0cDiFtWvtYS3RbgVYWcXtKk9P8jgPtO+HerAfBgSq5lc3lJ/tyve1UFuPLtsK1GJsXIcXA6ANdUZRmw/y3ATST69uwfKyVN/dsSXQLP3sCtwYCeD3xtkMvmLCL6/dr9eOd02L0ZOiIOaynRI4skFaQM8LnpDx5uKNG+q7DCLK9OCjM6BwPuFx5LvOpM1knuKyl/cyQ9P+yiIyJssjzqrE6zUTZZdtg2QB5vBpqsEsB9w2RXa0e+RJIr9Z9VuhzxxceWwAcVY9Y4npLJagPwfunWf25ostyL7Sdeq04TMwqwb7LS3l8O7JNJ2iiHwPd5I3RrDXM3uslKx2iDc2QytPquHwCPSa6y2jGpAqBHHhPiK5uTuhujvBzxbZXNXXW0MqkaxVMak6YNcE4X9giXFrnaY8bHpCa9s/vNeGSg+zdpPHBqHWUHcOvUjcfGDuDxwKl1lB3ArVM3Hhs7gMcDp9ZRdgC3Tt14bOwAHg+cWkf5N7oPsDdbjPHbAAAAAElFTkSuQmCC";
const TEXT_SCORE            = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHwAAAAYCAYAAAA4e5nyAAAAAXNSR0IArs4c6QAAA0hJREFUaEPtmbuvTUEUxn/TiAbREUElEXqJQiIoNKIRhYQGlUY0HoVCpxGNaFC4EYmKRhQehUShFaKg9AeIimac2Zk5WXfOmsfeZ3Ozc+d29+6ZWbO+bz2+NdfQftYVAmZdeducpRG+zoKgEd4IB2vtWeAe8MwYc0FiYq19DRwALhljVkp4ibM2ibUPlXMfAOfFml+1Nkp30L5ba28BV4H3xphj8RrxfSW+6xB7YY/H76g44wdwzhjztnSutfYI8Bj4aYzZH/ESOPuo+RPWqhk+JuHRpQLIWRD7BlUJqAThWYCstS4A3ZrbxpibQ2yU9lhrPwNbGuE9q0gJ2AThyWxx6xvhHjUt+5Sy/UfLjNoyWZPhPjv2CTK/xGWuFAgyw4AzvqW8cSUx4afLyKxN6SNwUKzvzo0qXjbDFVw/ALvXtKRrvdCDdSgmfSzCPVE7Q48Xvc3hWdUPfRY7PbLX7QFuzPq5661d4MTlttam8NFpkOeh/1trn860z0upe3IlXevXIsgXglsEx1I9XAotGZydoAKc4FgQESlxMQbhqTNqz44yzPXp096Xa8BGYDNwBXC/48lXtYdmU/ztW6niFAhf0BC5s8ciPKvSPXg5Nd9lT1CgtaTkSrrvrR1JUbZUqVRFRF4GHgEngHfASeAJcAr46sv7PDBKNmt99BUmWdI9BjF+OZUevnV3TrWzpVT6DJg9frTZkDCwauSoBaNAuDoWiqqSdVgZZe4AL4DjwHWf2d+Bw2EsTd1Hs1nrYwXhC8FQGMsC4a9yY+SyhLt7qxmeUMZLj2UjZ3ioCp+AbbMWddH38q2zrN8F3HcjWR+bIxI+1xeiQmYni5JI7VpUYUYtlfTQw6uyKjffp3pr/Lgzcg8PAO4QYi2Ub3elu57wIT28+GCjle2AgzYW9tEH/6SkOzJSL1beme1SuORKktJb3SuYClqtYq6JeKF8u9c/4c9vqRNqbfbM8OTjzlqp9Kqn1cTzqToXC0BC31+YT8XIFJ4gF+b6MeZwYWc+QuZGvBqbfQgXfTzM9quek//bHF6TGW3NNBFo/y2bJm+Db90IHwzdNDc2wqfJ2+BbN8IHQzfNjY3wafI2+NaN8MHQTXNjI3yavA2+9V/XCzNGz/W2wgAAAABJRU5ErkJggg==";
const TEXT_CHAT             = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAAAYCAYAAAAbIMgnAAAAAXNSR0IArs4c6QAAAwZJREFUaEPtma+OFEEQxn9tQKFwoDHwBKAIkPACCAwYcCgUYBAYcgpBCIYz8BKQcARCwhuAxIHDgALTXE26J7W11bM9dzObm0uvup0/W9Xf1/XVV32B9lkkAmGRWbekacQtdBNslbgY4xPgAXAC+BZCuBBjfA9cTfjthhDuLhTLPu0Y41fgPPAP2AkhPPbWpJ77A9wLIbypXbtLXIzxCvAaOGuDm3ujAs5NnAJC1t9vghjjK+BOAuUHcDuE8OEwaxkC+KDEAZKbi7uNd9yI0wTthRCuyYJNVfebLcZ4C3gBnEqgdYTW7vrSc424kQh6FZ2Iy9IlX3v5Ms/3RI8Mu/b4QYkTqax9d9KKMzs4L6jrZQnA6h5X+K1e5go9Q0t892yS+1xV+bWOJCOhWlp1JeZ3VmIbgF8CN1KsXeCi1+OMlOslaBWo6o+TEad2ryS0A3xUep1BvFxjTkwldIAquRvsq7bhA+dSzL/A7wRuNkZrINXGHiDBJc4zIhuuDRqbGuKGlKMD0TRVXWG658iCflYSlwEt9aM+hk3OVlG6L8ZENs9n4Gb6+xHwNBGpDUtV7CFJs/dSDtlN697rxVq75hFQQ9wK854TU7tabL5OTEvjHvBlE3HAJ88wmLhFybR9Ky1axg0dX6rvGXA/GZNcga5Z8WIDz0uW3yHukjfy1FbhtogrVeiUxBXl0oD8fb+qTqrekzeFXHsHXE8zZZbjGuKyyjycibg81w62hFkrzpGxjebksBVnXKQsXkjq+q4MwmqX/9qvmtPGZdYQl/v1XBW3VeL04FgrY8WTk4KEaFCLPc6Z2+SS7pX6pEbuldziYH8d2ePOqAMA7V6r+tlsUpnmj9Lwmy362xHmRFfmKFfpjB1yqWSYVu457xZjjyTOc9hyKpXHFM/kSTrFI8BJpDKfsZn+YjdKtatMAG6cpUrN1JkBtWGyv7sGTs0MOYa4JNE2rpCVx5NpiBvy/+3e0UBgq/8dOBpLPh5ZNOIWymMjrhG3UAQWmnaruEbcQhFYaNqt4hZK3H+hgmxGYcqn0gAAAABJRU5ErkJggg==";

aleiLog(logLevel.INFO, "Starting up...");

// Original functions, globally saved here if needed
// JS_ prefix for JavaScript ones, ALE_ for ALE ones
let JS_setTimeout = window.setTimeout;
let JS_eval = window.eval;
let ALE_Render;

let aleiSessionID = null; // ID of this session
let aleiSessionList = []; // Set of known session IDs

function updateSounds() {
    // Adds sounds that exist in game but not in ALE
    let SVTS = VAL_TABLE["sound"];
    SVTS['am_base'] = 'Indoor Ambience';
    SVTS['am_wind'] = 'Outdoor Ambience';
    SVTS['android2_die'] = 'DT-148 - Death';
    SVTS['android2_hurt'] = 'DT-148 - Hurt';
    SVTS['android2_welcome2'] = 'DT-148 - Alerted';
    SVTS['arrin_death1'] = 'Arrin - Death';
    SVTS['arrin_dying'] = 'Arrin - Dying';
    SVTS['arrin_hurt1'] = 'Arrin - Hurt 1';
    SVTS['arrin_hurt2'] = 'Arrin - Hurt 2';
    SVTS['arrin_welcome1'] = 'Arrin - Alerted 1';
    SVTS['arrin_welcome2'] = 'Arrin - Alerted 2';
    SVTS['arrin_welcome3'] = 'Arrin - Alerted 3';
    SVTS['bounce_bullet'] = 'Falkonian PSI Cutter - Shot Bounce';
    SVTS['dart4'] = 'Medic Pistol';
    SVTS['exp_event_stop'] = 'EXP - Stop';
    SVTS['exp_level'] = 'EXP - Level Up';
    SVTS['exp_tick'] = 'EXP - Gain';
    SVTS['gameplay_song'] = 'Katharsys - Erges';
    SVTS['gravitator2'] = 'Floor gravitator noice';
    SVTS['helm_proxy_alert_over_hereB'] = 'Proxy - Over here!';
    SVTS['helm_proxy_alert_take_coverB'] = 'Proxy - Take cover!';
    SVTS['helm_proxy_alert_up_thereA'] = 'Proxy - Up there!';
    SVTS['helm_proxy_death3'] = 'Proxy - Death 1';
    SVTS['helm_proxy_death4'] = 'Proxy - Death 2';
    SVTS['helm_proxy_death5'] = 'Proxy - Death 3';
    SVTS['helm_proxy_death6'] = 'Proxy - Death 4';
    SVTS['helm_proxy_dyingC'] = 'Proxy - Help! 1';
    SVTS['helm_proxy_dyingF'] = 'Proxy - Help! 2';
    SVTS['helm_proxy_enemy_down_fantasticA'] = 'Proxy - Fantastic.';
    SVTS['helm_proxy_enemy_down_got_oneD'] = 'Proxy - Got one.';
    SVTS['helm_proxy_enemy_down_niceA'] = 'Proxy - Nice. 1';
    SVTS['helm_proxy_enemy_down_niceC'] = 'Proxy - Nice. 2';
    SVTS['helm_proxy_hurt11'] = 'Proxy - Hurt 1';
    SVTS['helm_proxy_hurt12'] = 'Proxy - Hurt 2';
    SVTS['helm_proxy_hurt13'] = 'Proxy - Hurt 3';
    SVTS['helm_proxy_hurt14'] = 'Proxy - Hurt 4';
    SVTS['helm_proxy_hurt15'] = 'Proxy - Hurt 5';
    SVTS['helm_proxy_hurt17'] = 'Proxy - Hurt 6';
    SVTS['helm_proxy_hurt4'] = 'Proxy - Hurt 7';
    SVTS['helm_proxy_hurt5'] = 'Proxy - Hurt 8';
    SVTS['helm_proxy_hurt8'] = 'Proxy - Hurt 9';
    SVTS['helm_proxy_hurt9'] = 'Proxy - Hurt 10';
    SVTS['hexagon_death1'] = 'Hexagon - Death 1';
    SVTS['hexagon_death2'] = 'Hexagon - Death 2';
    SVTS['hexagon_pain1'] = 'Hexagon - Hurt 1';
    SVTS['hexagon_pain2'] = 'Hexagon - Hurt 2';
    SVTS['hexagon_pain3'] = 'Hexagon - Hurt 3';
    SVTS['hexagon_pain4'] = 'Hexagon - Hurt 4';
    SVTS['hexagon_welcome1'] = 'Hexagon - Alerted 1';
    SVTS['hexagon_welcome2'] = 'Hexagon - Alerted 2';
    SVTS['hexagon_welcome3'] = 'Hexagon - Alerted 3';
    SVTS['main_song'] = 'NPhonix - Antigravity';
    SVTS['orakin_death1'] = 'Orakin - Death 1';
    SVTS['orakin_death2'] = 'Orakin - Death 2';
    SVTS['orakin_hurt'] = 'Orakin - Hurt';
    SVTS['orakin_welcome'] = 'Orakin - Alerted';
    SVTS['proxy_alert_over_hereB'] = 'No Helm Proxy - Over here!';
    SVTS['proxy_alert_take_coverB'] = 'No Helm Proxy - Take cover!';
    SVTS['proxy_alert_up_thereA'] = 'No Helm Proxy - Up there!';
    SVTS['proxy_death3'] = 'No Helm Proxy - Death 1';
    SVTS['proxy_death4'] = 'No Helm Proxy - Death 2';
    SVTS['proxy_death5'] = 'No Helm Proxy - Death 3';
    SVTS['proxy_death6'] = 'No Helm Proxy - Death 4';
    SVTS['proxy_dyingC'] = 'No Helm Proxy - Help! 1';
    SVTS['proxy_dyingF'] = 'No Helm Proxy - Help! 2 ';
    SVTS['proxy_enemy_down_fantasticA'] = 'No Helm Proxy - Fantastic.';
    SVTS['proxy_enemy_down_got_oneD'] = 'No Helm Proxy - Got one.';
    SVTS['proxy_enemy_down_niceA'] = 'No Helm Proxy - Nice. 1';
    SVTS['proxy_enemy_down_niceC'] = 'No Helm Proxy - Nice. 2';
    SVTS['proxy_hurt11'] = 'No Helm Proxy - Hurt 1';
    SVTS['proxy_hurt12'] = 'No Helm Proxy - Hurt 2';
    SVTS['proxy_hurt13'] = 'No Helm Proxy - Hurt 3';
    SVTS['proxy_hurt14'] = 'No Helm Proxy - Hurt 4';
    SVTS['proxy_hurt15'] = 'No Helm Proxy - Hurt 5';
    SVTS['proxy_hurt17'] = 'No Helm Proxy - Hurt 6';
    SVTS['proxy_hurt4'] = 'No Helm Proxy - Hurt 7';
    SVTS['proxy_hurt5'] = 'No Helm Proxy - Hurt 8';
    SVTS['proxy_hurt8'] = 'No Helm Proxy - Hurt 9';
    SVTS['proxy_hurt9'] = 'No Helm Proxy - Hurt 10';
    SVTS['silk_alert_contactA'] = 'Silk - Contact!';
    SVTS['silk_alert_i_see_oneA'] = 'Silk - I see one.';
    SVTS['silk_alert_there_is_oneA'] = 'Silk - There is one...!';
    SVTS['silk_death1B'] = 'Silk - Death 1';
    SVTS['silk_death2B'] = 'Silk - Death 2';
    SVTS['silk_dyingB'] = 'Silk - Not good...';
    SVTS['silk_enemy_down_brilliantC'] = 'Silk - Brilliant.';
    SVTS['silk_enemy_down_eliminatedB'] = 'Silk - Eliminated.';
    SVTS['silk_enemy_down_hell_yeahB'] = 'Silk - Hell yeah!';
    SVTS['silk_enemy_down_ive_got_oneB'] = 'Silk - I got one!';
    SVTS['silk_enemy_down_minus_oneB'] = 'Silk - -1.';
    SVTS['silk_enemy_down_no_kicking_for_youB'] = 'Silk - No kicking for you.';
    SVTS['silk_hurt1B'] = 'Silk - Hurt 1';
    SVTS['silk_hurt2B'] = 'Silk - Hurt 2';
    SVTS['silk_hurt5'] = 'Silk - Hurt 3';
    SVTS['silk_hurt6'] = 'Silk - Hurt 4';
    SVTS['silk_hurt9B'] = 'Silk - Hurt 5';
    SVTS['wea_crossfire2'] = 'Crossfire CR-145 Vortex';
    SVTS['wea_ditzy_cs_ik'] = 'Assault Rifle CS-IK';
    SVTS['wea_glhf'] = 'Grenade Launcher CS-GLHF';
    SVTS['wea_incompetence_archetype_27xx_fire'] = 'Archetype 27XX';
    SVTS['wea_lazyrain_gravy_rl'] = 'Falkonian Anti-Grav Rocket Launcher';
    SVTS['wea_m202'] = 'Rocket Launcher CS-Barrage';
    SVTS['wea_moonhawk_railgun'] = 'Crossfire CR-34 Marauder';
    SVTS['wea_ph01'] = 'Crossfire CR-54 Viper';
    SVTS['wea_plasma_shotgun'] = 'Plasma Shotgun';
    SVTS['wea_rail_alt2'] = 'Falkonian PSI Cutter';
    SVTS['wea_thetoppestkek_shotgun_nxs25'] = 'Shotgun NXS-25';
    SVTS['xin_celebrate'] = 'Xin - Celebrating';
    SVTS['xin_death'] = 'Xin - Death';
    SVTS['xin_enemy_spotted'] = 'Xin - Alerted';
    SVTS['xin_hit'] = 'Xin - Hurt';
    let voices = {
        Grosk: [
            "Grosk",
            ["death", "Death", 2],
            ["dying", "Dying", 2],
            ["edown", "Celebrating", 3],
            ["welcome", "Alerted", 5],
            ["hurt", "Hurt", 3]
        ],
        drohnentroop: [
            "Drohnen Trooper",
            ["welcome", "Alerted", 3],
            ["hurt", "Hurt", 3],
            ["edown", "Celebrating", 3],
            ["dying", "Dying", 1],
            ["death", "Death", 3]
        ],
        drohnenfem: [
            "Drohnen Female",
            ["welcome", "Alerted", 3],
            ["hurt", "Hurt", 3],
            ["edown", "Celebrating", 3],
            ["dying", "Dying", 1],
            ["death", "Death", 3]
        ],
        elurra: [
            "Elurra",
            ["welcome", "Alerted", 3],
            ["hurt", "Hurt", 2],
            ["edown", "Celebrating", 2],
            ["dying", "Dying", 1],
            ["death", "Death", 1]
        ],
        ferro: [
            "Lt. Ferro",
            ["welcome", "Alerted", 3],
            ["hurt", "Hurt", 2],
            ["edown", "Celebrating", 3],
            ["death", "Death", 2]
        ],
        serkova: [
            "Serkova",
            ["welcome", "Alerted", 3],
            ["hurt", "Hurt", 1],
            ["edown", "Celebrating", 2],
            ["death", "Death", 1]
        ],
        phantom: [
            "Phantom",
            ["edown", "Celebrating", 1],
            ["welcome", "Alerted", 2],
            ["death", "Death", 1]
        ]
    };
    for (let entry of Object.entries(voices)) {
        let character = entry[0];
        let charVoices = entry[1];
        let charName = charVoices[0];

        for (let i = 1; i < charVoices.length; i++) {
            let voice = charVoices[i];
            for (let j = 1; j <= voice[2]; j++) {
                SVTS[`${character}_${voice[0]}${j}`] = `${charName} - ${voice[1]} ${j}`
            }
        }
    }
}

function updateVoicePresets() {
    // Adds voice presets that exist in game but not in ALE
    let VP = VAL_TABLE['voice_preset'];
    VP['proxy_helmetless'] = 'Proxy (helmetless)';
    VP['silk'] = 'Silk';
    VP['orakin'] = 'Orakin';
    VP['arrin'] = 'Arrin';
    VP['civilian_male'] = 'Civilian Male';
    VP['vulture'] = 'Vulture';
    VP['crossfire_sentinel'] = 'Crossfire Sentinel';
    VP['xin'] = 'Xin';
    VP["grosk"] = "Grosk";

    VP["elurra"] = "Elurra";
    VP["drohnenfem"] = "Drohnen Female";
    VP["serkova"] = "Serkova";
    VP["ferro"] = "Lt. Ferro";
    VP["drohnentroop"] = "Drohnen Trooper";
    VP["phantom"] = "Phantom";
}

function updateStyles() {
    // Changes some stylesheets to open up to things like resizable right panel.
    for(let i1 = 0; i1 < stylesheets.length; i1++) {
        let styleSheet = stylesheets[i1];
        for (let i2 = 0; i2 < styleSheet.rules.length; i2++) {
            let rule = styleSheet.rules[i2];
            switch(rule.selectorText) {
                case ".p_i":
                    rule.style.setProperty("display", "flex");
                    break;
                case ".rightui":
                    rule.style.setProperty("width", aleiSettings.rightPanelSize);
                    break;
                case ".pa1":
                    rule.style.setProperty("flex-grow", 0);
                    rule.style.setProperty("flex-shrink", 0);
                    break;
                case ".pa2":
                    rule.style.setProperty("width", "100%");
                    break;
                case ".opcode_field":
                    rule.style.setProperty("font-size", aleiSettings.triggerEditTextSize);
                    break;
                case "#rparams":
                    rule.style.setProperty("height", "var(--ALEI_RPARAMS_HEIGHT)");
                    break;
                default:
                    break;
            }
        }
    }
    $id("stars").style.setProperty("background-image", `url(${aleiSettings.starsImage})`)
    let _th = THEME;
    ThemeSet(THEME_BLUE);
    ThemeSet(_th);
}

function updateRegionActivations() {

    /** @type { Array } */
    let region_activations = VAL_TABLE['region_activation'];

    region_activations[17] = "Actor";
    region_activations[18] = "Actor not ally to player";
};

function updateSkins() {
    // Adds skins that exist in game but not in ALE.
    let charlists = [
        [10, "Head Gib"],
        [18, "Star Defender (play map ID 'eric gurt-star_defenders' to unlock it)"],
        [20, "Arm Gib"],
        [30, "Leg Gib"],
        [50, "Heavy Hero (Only Head and Arms)"],
        [60, "Proxy (Only Head and Arms)"],
        [62, "Proxy (No Limbs)"],

        [38, "GoldenKnife Noir Lime"],
        [39, "RootZ Noir Lime"],

        [151, "Purple Xin"],
        [152, "Golden Xin"],
        [153, "Blue Xin"],
        [154, "Red Xin"],
        [155, "Amber Xin"],

        [156, "Nirvana Noir Lime"],

        [157, "Purple Gallynew"],
        [158, "Golden Gallynew"],
        [159, "Blue Gallynew"],
        [160, "Red Gallynew"],
        [161, "Amber Gallynew"],

        [162, "Pinkine"],
        [163, "Raider (by Serpent)"],
        [164, "Blue Heavy Hero"],
        [165, "Red Heavy Hero"],
        [166, "Orakin"],
        [167, "Husk"],
        [168, "Hex"],
        [169, "Arrin"],
        [170, "Heavy Usurpation Soldier"],

        [171, "Cyber Grub by S1lk"],
        [172, "Grosk"],
        [173, "Futuristic Knight"],
        [174, "Uncivil Proxy"],

        [175, "Serkova Insertion Unit"],
        [176, "Xenos Scout"],

        [177, "Armored Trooper"],

        [178, "New Generation Marine"],
        [179, "Elurra (by Lin)"],
        [180, "Dark Proxy (by littlekk)"],
        [181, "Huntsman (Night)"],
        [182, "Huntsman (Swamp)"],
        [183, "Lt. Ferro (by Serpent)"],
        [184, "Xenos Titan"],
        [185, "Elurra (Masked) (by Lin)"],
        [186, "Drohnen Heavy (by Ark633)"],
        [187, "Cromastakan"],
        [188, "Sgt. Davais"],
        [189, "Maroon (by Francis localhost)"],
        [190, "Drohnen Skirmisher (by Ark633)"],
        [191, "Serkova Recon Unit"],
        [192, "Drohnen Drifter (by Ark633)"],
        [193, "Xenos Marine"],
        [194, "Dark Android SLC-56 (by littlekk)"],
        [195, "Wraith (by Ark633)"],
        [196, "Serkova Armored Unit"],
        [197, "Phantom (play map ID 'therealon3-phantom' to unlock it)"],
        [198, "Blue Civil Security Heavy"],
        [199, "Red Civil Security Heavy"],
        [200, "Xenos Welder"],
        [201, "Xenos Special Unit"],
        [202, "Serkova Assault Unit"],
        [203, "Serkova Gunner Unit"],
        [204, "Serkova Grenader Unit"],
        [205, "Serkova Team Leader"],
        [206, "Serkova Resource Unit"],
        [207, "Serkova Technician Unit"],
        [208, "Serkova Grub"],
        [209, "Serkova Reinforced Grub"],
        [210, "Serkova Devastator Grub"],
        [211, "XBT-117 Android"],
        [212, "Teneguilae"],
        [213, "Walker (by Serpent)"],
        [214, "Space Grub (by Broforce1)"],
        [215, "Blue Phantom (play map ID 'therealon3-phantom' to unlock it)"],
        [216, "Red Phantom (play map ID 'therealon3-phantom' to unlock it)"],
        [217, "Misfit"]
    ]
    for(let li = 0; li < charlists.length; li++) {
        let charID = charlists[li][0];
        let paddedCharID = charID.toString().padStart(4, "0")
        let charName = charlists[li][1];
        let src = "https://www.plazmaburst2.com/level_editor/chars_full/char" + paddedCharID + ".png"
        VAL_TABLE['char'][charID] = _turnLinkIntoSkinSpan(src, charName);
        img_chars_full[charID] = new Image();
        img_chars_full[charID].src = 'chars_full/char' + paddedCharID + '.png';
    }

    if (!aleiSettings.html5Mode) {
        let ids = Object.keys(VAL_TABLE["char"]);
        ids = ids.map(str => parseInt(str));
        let fromID = Math.max(...ids) + 1;
        fetchSkinsFrom(fromID);
    }
}

function _turnLinkIntoSkinSpan(src, charName) {
    return '<span style=\'background:url(' + src + '); width: 16px; height: 16px; display: inline-block; background-position: center; background-position-x: 30%; background-position-y: 26%; background-size: 67px;vertical-align: -4px;\'></span> ' + charName;
}

async function fetchSkinsFrom(startingID) {
    if(!isNative) return;
    const requestsAtOnce = 5;
    let requestsRunning = true;
    let skinsAdded = [];

    async function requestSkin(id) {
        let paddedCharID = id.toString().padStart(4, "0");
        let src = "https://www.plazmaburst2.com/level_editor/chars_full/char" + paddedCharID + ".png"
        let response = await GM.xmlHttpRequest({ url: src }).catch(e => console.error(e));
        if(response.status == 404) {
            requestsRunning = false;
            return;
        }
        VAL_TABLE["char"][id] = _turnLinkIntoSkinSpan(src, `Unknown Skin #${id}`);
        skinsAdded.push(id);
    }
    async function requestBatch(id) {
        let promises = [];
        for (let i = 0; i < requestsAtOnce; i++) {
            promises.push(requestSkin(id + i));
        }
        await Promise.all(promises);
    }
    let fromID = startingID;
    while(requestsRunning) {
        await requestBatch(fromID);
        fromID += requestsAtOnce;
    }
    if(skinsAdded.length > 0) {
        NewNote(`ALEI: There are ${skinsAdded.length} unregistered skins, please inform ALEI developer(s) about this. Check logs for more information`, `#00FFFF`);
        aleiLog(logLevel.INFO, `Unregistered skins: ${skinsAdded}`);
    }
}

function optimize() {
    // VSync.
    window.setTimeout = (f, ms) => {
        if (f == ani) {window.requestAnimationFrame(ani)}
        else return JS_setTimeout(f, ms);
    }
    let _browseImages = window.BrowseImages;
    let ogImageLists = {};
    // Image caching.
    window.BrowseImages = function(for_class = 'bg_model', current_value = '', callback = null) {
        // If cache doesn't have the class we are looking for, we will just set default value.
        if (ogImageLists[for_class] == undefined) {
            ogImageLists[for_class] = "[ALEI] Loading...";
            aleiLog(logLevel.INFO, `Will cache response of ${for_class}`);
        }

        // Overwrite setTimeout temporarily, as BrowseImages calls setTimeout for ServerRequest which sets the innerHTML of image_list
        let ost = window.setTimeout;
        window.setTimeout = (f, ms) => {
            window.setTimeout = ost; // Assign original setTimeout
            window.ServerRequest = (req, op, callback = null) => {
                window.ServerRequest = ALEI_ServerRequest; // Assign original ServerRequest
                // We made ServerRequest an async function, so we can just register on it
                ServerRequest(req, op, callback).then(() => {

                    // this solution is stupid, but it gets the job done for text decors. - Molis
                    let image_selection = image_list.children[3];
                    let change_decor_counter = 0;

                   for ( const image_option of image_selection.children ) {
                        let image = image_option.children[0];

                        if ( image.style.backgroundImage === 'url("decors/text.png")' || image.style.backgroundImage === 'url("decors/text2.png")' || image.style.backgroundImage === 'url("decors/text3.png")' ) {
                            let old_decor_counter = change_decor_counter;

                            change_decor_counter++;
                            switch( old_decor_counter ) {
                                case 0:
                                    image.style.backgroundImage = `url("${TEXT_OVERHEAD}")`;
                                    break;

                                case 1:
                                    image.style.backgroundImage = `url("${TEXT_SCORE}")`;
                                    break;

                                case 2:
                                    image.style.backgroundImage = `url("${TEXT_CHAT}")`;
                                    break;
                            }
                        }

                        if ( change_decor_counter === 3 ) break;
                    }
                    ogImageLists[for_class] = image_list.innerHTML;
                });
            };
            f();
        }
        _browseImages(for_class, current_value, callback);
        image_list.innerHTML = ogImageLists[for_class]; // Show what is in cache. (If cache didn't have the class, it will just show the previously set default value)
    }
}

function updateVehicles() {
    // Adding vehicles that exist in game but not in ALE. Currently only veh_hh, which is grabbable ledge.
    let _SVTV = VAL_TABLE["vehicle_model"];
    let vehicles = [
        ["veh_hh", "Grabbable Ledge", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACLSURBVEhLYxhxgBFE2M3/r/vvH0MQWISGgImJYd2hRMbLIDbYYpu5/+t/MzEEf2diuALi0wJw/mPQYf3HsPZIMmMjiA+3+BMLg/olIYblID4tgN47hki+Pww3YRYzgUUHAIxaTDcwajHdwKjFdAOjFtMNjFpMNzBqMd3AqMV0AwPbrh6InsQAAQYGAA8CLDKAAcpOAAAAAElFTkSuQmCC"]
    ]
    for(let i = 0; i < vehicles.length; i++) {
        let vehicle = vehicles[i];
        let model = vehicle[0];
        let name = vehicle[1];
        let image = vehicle[2];
        _SVTV[model] = `<img src='${image}' border=0 height=12 style=vertical-align:middle title='${name}' > ${name}`
        img_vehicles[model] = new Image();
        img_vehicles[model].src = image;
    }
}

function updateGuns() {
    // Adds guns that exist in game but not in ALE. Currently only one isn't visible in ALE, and that is joke weapon: NARL
    let guns = [
        ["gun_rl0", "BETA Rocket Launcher", "data:image/png;base64,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"]
    ];
    for(let i = 0; i < guns.length; i++) {
        let gun = guns[i];
        let gun_model = gun[0];
        let gun_name = gun[1];
        let gun_image = gun[2];
        VAL_TABLE["gun_model"][gun_model] = `<img src='${gun_image}' border=0 width=80 height=20 style=vertical-align:baseline title='${gun_name}'>`
        img_guns[gun_model] = new Image();
        img_guns[gun_model].src = gun_image;
    }
}

const decors_to_change = [
        // EuropeExt
        ["text",  TEXT_OVERHEAD],
        // DejaVu Sans Mono
        ["text2", TEXT_SCORE],
        // Tahoma Bold
        ["text3", TEXT_CHAT]
];

function updateDecors() {
    // Adds decors that exist in game, but not in ALE. Currently only hakase easter egg is known.
    window.img_decors = CACHED_DECORS; // For some reason img_decors gets resetted
    
    let decors = [
        ["hakase", "Hakase", "data:image/png;base64,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"]
    ];

    for(let i = 0; i < decors.length; i++) {
        let decor = decors[i];
        let decor_model = decor[0];
        let decor_name = decor[1];
        let decor_image = decor[2];
        VAL_TABLE["decor_model"][decor_model] = decor_name; // Add to known decors.
        img_decors[decor_model] = new Image();
        img_decors[decor_model].src = decor_image;
        img_decors[decor_model].native = true;
        img_decors[decor_model].loaded = true;
        CACHED_DECORS[decor_model] = img_decors[decor_model];
        CUSTOM_IMAGES_APPROVED[decor_model] = true; // Since it's obviously vanilla, and other vanilla decors are approved, it's only natural if we approve added decors too
    }

    for (const decor of decors_to_change) {
        let decor_model                       = decor[0];
        let decor_change_image                = decor[1];

        // console.log( img_decors[decor_model] );

        // if these decor models get duplicated for no reason i will literally...
        img_decors[decor_model]           = new Image(); // In case if anyone opens new ALE tab, do this just for convenience

        img_decors[decor_model].src           = decor_change_image;
        img_decors[decor_model].native        = true;
        CACHED_DECORS[decor_model]            = img_decors[decor_model];
        CUSTOM_IMAGES_APPROVED[decor_model]   = true; // Since it's obviously vanilla, and other vanilla decors are approved, it's only natural if we approve added decors too
    }

    window.ALEI_decors = decors;
}

function updateOffsets() {
    // Because hakase decor and grabbable ledge image is made with hand manually and doesn't come from website, and that there is no
    // inbuilt offset, we have to offset those to make sure they show up in ALE correctly.
    let toosc = window.ThinkOfOffsetClass;
    window.ThinkOfOffsetClass = function(tc, esi) {
        if (tc == "vehicle" && offsets[esi.pm.model] != undefined) {
            return "alei_" + esi.pm.model;
        } else if (tc == "decor" && offsets[esi.pm.model] != undefined) {
            return "alei_" + esi.pm.model;
        } else if (tc == "gun" && (esi.pm.model == "gun_rl0")) {
            return "alei_gun_rl0";
        } else return toosc(tc, esi);
    }
    let offsets = {
        veh_hh: {x: -15, y: -15, w: 30, h: 30},
        hakase: {x: -18, y: -57, w: 40, h: 60},
        text: {x: -56, y: -10, w: 120, h: 24},
        text2: {x: -60, y: -10, w: 124, h: 24},
        text3: {x: -50, y: -10, w: 110, h: 24},
        gun_rl0: {x: -24, y: -6, w: 61, h: 13}
    }
    for (let key in offsets) {
        let off = offsets[key];
        lo_x["alei_" + key] = off.x;
        lo_y["alei_" + key] = off.y;
        lo_w["alei_" + key] = off.w;
        lo_h["alei_" + key] = off.h;
    }
}

function updateTriggers() {
    // This is where we will rename some triggers.
    // For now it's only 378, but we got more triggers like renaming 328
    addTrigger(175, "Gun &#8250; Change gun 'A' projectile model to 'B'", "gun", "ALEI_projectileModels");
    addTrigger(378, "Gun &#8250; Add hex color 'B' to gun 'A'", "gun", "string");
    addTrigger(332, "Var &#8250; Set variable 'A' to value 1 if Gun 'B' is in owner's active slot, set to value 0 in else case", "string", "gun");
    addTrigger(305, "Gun &#8250; Set Gun 'A' holstered attachment to 'B' (0 = on leg, 1 = on back, 2 = on head)", 'gun', 'string');

    // fix the bug where "Water" category has undefined color
    tr_type_tags["Water"] = "#7dd1d1";
    addTrigger(392, "Water &#8250; Move Water 'A' to Region 'B'", 'water', 'region');
    addTrigger(395, "Water &#8250; Set water 'A' damage to string-value/variable 'B'", 'water', 'string');
    addTrigger(409, "Water &#8250; Change water 'A' color to string-value/variable 'B'", 'water', 'string');

    // register "Experimental" trigger action category color
    tr_type_tags["Experimental"] = "#b579e1";

    // add hidden trigger actions
    // some others may work. i haven't checked 415-419 yet
    addTrigger(422, "Experimental &#8250; Show message 'A' in chat said by Character 'B' (added by ALEI)", "string", "character");
    addTrigger(423, "Experimental &#8250; Draw custom image of decoration 'A' to current graphic at top-left of region 'B' (added by ALEI)", "decor", "region");
    addTrigger(424, "Experimental &#8250; Move region 'A' to lower body of Character slot-value variable 'B' (added by ALEI)", "region", "string");
}

function updateObjects() {
    // Shorthand for object-related functions as to not clutter console.
    updateGuns();
    updateVehicles();
    updateDecors();
    updateTriggers();
}

function addClipboardSync() {
    let clipboard_channel = new BroadcastChannel("ale_clipboard");

    ///////////////
    // Receiving //
    ///////////////
    clipboard_channel.onmessage = (msg) => {
        let data = msg.data;
        let kind = data.kind;
        if (kind == "send") {
            let recipient = data.recipient;
            let clip_name  = data.clip_name;
            let clip_data  = data.clip_data;

            if (recipient == undefined || recipient == aleiSessionID) {
                aleiLog(logLevel.DEBUG, '/ale_clipboard/ got data for ' + clip_name);
                sessionStorage[clip_name] = clip_data;
            }
        }
        if (kind == "get") {
            if (aleiSessionID > Math.min(...aleiSessionList)) return;

            let session_id = data.session_id;
            aleiLog(logLevel.DEBUG, '/ale_clipboard/ syncing to ' + session_id);
            for (let i = 0; i <= 10; i++) {
                let clip_name = "clipboard" + (i == 0 ? "" : ("_slot" + (i-1)));
                let clip_data = sessionStorage[clip_name];
                if (clip_data == undefined) continue;
                clipboard_channel.postMessage({kind: "send", recipient: session_id, clip_name, clip_data});
            }
        }
    }

    // Initial Sync
    aleiLog(logLevel.DEBUG, '/ale_clipboard/ requesting');
    clipboard_channel.postMessage({kind: "get", session_id: aleiSessionID});

    /////////////
    // Sending //
    /////////////
    let ALE_CopyToClipBoard = window.CopyToClipBoard;
    window.CopyToClipBoard = (clip_name) => {
        ALE_CopyToClipBoard(clip_name);
        let clip_data = sessionStorage[clip_name];
        clipboard_channel.postMessage({kind: "send", clip_name, clip_data});
    }
}

async function addSessionSync() {
    // This function registers some events, as to talk with other tabs
    // For now, this is useful for clipboard sync, but we probably can have more.
    const PROBE_TIMEOUT_MS = 200;
    let session_channel = new BroadcastChannel("ale_session");

    // Receive data
    session_channel.onmessage = (msg) => {
        let data = msg.data;
        let kind = data.kind;
        // New ALEI instance started up.
        if (kind == "start") {
            if (aleiSessionID == null) return;
            session_channel.postMessage({kind: "greet", id: aleiSessionID});
            aleiLog(logLevel.DEBUG, "/ale_session/ recieved start");
        }
        // An ALEI instance responded to new ALEI instance, registering the ALEI instance
        if (kind == "greet") {
            let session_id = data.id;
            if (!aleiSessionList.includes(session_id))
                aleiSessionList.push(session_id);
            aleiLog(logLevel.DEBUG, "/ale_session/ received greet by " + session_id);
        }
        // An ALEI instance is closing
        if (kind == "close") {
            let session_id = data.id;
            aleiSessionList.splice(aleiSessionList.indexOf(session_id), 1);
            aleiLog(logLevel.DEBUG, "/ale_session/ received close by " + session_id);
        }
    }

    // Probe for other sessions
    session_channel.postMessage({kind: "start"});
    aleiLog(logLevel.DEBUG, "/ale_session/ probing");
    await new Promise(resolve => {
        JS_setTimeout(resolve, PROBE_TIMEOUT_MS);
    });

    // Assign own session ID
    if (aleiSessionList.length == 0)
        aleiSessionID = 0;
    else
        aleiSessionID = Math.max(...aleiSessionList) + 1;

    aleiLog(logLevel.DEBUG, "/ale_session/ session ID " + aleiSessionID);

    // Tell other sessions that this one is done
    window.addEventListener('beforeunload', (event) => {
        session_channel.postMessage({kind: "close", id: aleiSessionID});
    });

    addClipboardSync();
}

function addPropertyPanelResize() {
    // Gives right panel ability to be resized.

    let splitter_is_down = false;
    const splitter = document.createElement("div");
    const root = document.documentElement;

    splitter.style.position = "absolute";
    splitter.style.width = "5px";
    splitter.style.top = "50px";
    splitter.style.height = "100%";
    splitter.style.cursor = "w-resize";
    // splitter.style["background-color"] = "black";
    $id('floattag').appendChild(splitter);

    function splitter_resize(e) {
        let new_width = Math.min(root.clientWidth - 100, Math.max(100, root.clientWidth - e.clientX));
        right_panel.style.width = new_width + 'px';
        splitter.style.right = new_width + 'px';
        ROOT_ELEMENT.style.setProperty("--param_panel_size", splitter.style.right);
        updateBoxSplitterSize();
    }

    splitter.addEventListener('mousedown', (e) => {
        splitter_is_down = true;
    });

    root.addEventListener('mouseup', (e) => {
        splitter_is_down = false;
        writeStorage('ALEI_RightPanelWidth', right_panel.clientWidth + 'px');
    });

    root.addEventListener('mousemove', (e) => {
        if (splitter_is_down) splitter_resize(e);
    });

    splitter.style.right = aleiSettings.rightPanelSize;
    ROOT_ELEMENT.style.setProperty("--param_panel_size", splitter.style.right);
    window.splitter = splitter;
}

function addTriggerIDs() {
    if (!aleiSettings.showTriggerIDs) return;

    let SVTTP = VAL_TABLE['trigger_type'];
    for (let i in SVTTP) {
        SVTTP[i] = i + " " + SVTTP[i];
    }
}

function patchShowHideButton() {
    let og = window.ShowHideObjectBox;
    window.ShowHideObjectBox = function() {
        og();
        let rparams = $id("rparams");
        let heightOffset = {true: 270, false: 155}[ObjectBox_visible];
        if (rparams != null) {
            heightOffset = Math.round(rparams.getBoundingClientRect().top + 13);
        }
        // We then set variable and call original function.
        document.documentElement.style.setProperty("--ALEI_RPARAMS_HEIGHT", `calc(100vh - ${heightOffset}px)`);
        //og();
    }
    ShowHideObjectBox();
    ShowHideObjectBox(); // Hacky way to fix bug
}

function tryToNumber(x) {
    if (!isNaN(Number(x))) {
        return Number(x);
    } else {
        return x;
    }
}

function insertXMLUserInput() {
    let file = confirm("File (OK) or text (Cancel) ?");

    if (file) {
        let fileInput = document.createElement("input");

        fileInput.type = "file";

        fileInput.onchange = function() {
            if (fileInput.files[0]) {
                if (fileInput.files[0].name.split(".")[1] == "xml") {
                    let reader = new FileReader();

                    reader.onload = function() {
                        insertXML(reader.result);

                        fileInput.remove();
                    }

                    reader.readAsText(fileInput.files[0]);
                } else {
                    alert("Invalid file extension.");
                }
            }
        }

        fileInput.click();
    } else {
        let xml = prompt("Enter XML:", "");

        if (xml !== null) {
            insertXML(xml);
        }
    }
}

function insertXML(xml) {
    xml = "<map>" + xml.replaceAll("&", "[__Amp]") + "</map>";

    let parser = new DOMParser();
    let map = parser.parseFromString(xml, "application/xml");
    let objects = map.querySelectorAll("*");

    let originalEsLength = es.length;

    for (let i = 1; i < objects.length; i++) {
        let object = objects[i];
        if (object.tagName == "map") continue;

        let eo = new E(object.tagName);
        eo.pm = {};

        for (let j = 0; j < object.attributes.length; j++) {
            let name = object.attributes[j].name;
            let value = object.attributes[j].value;

            eo.pm[name] = tryToNumber(value.replaceAll("[__Amp]", "&"));
        }

        es.push(eo);
    }

    onEntitiesCreated(es.slice(originalEsLength));

    need_redraw = true;
    need_GUIParams_update = true;
}

function exportXML() {
    let newstr = "";
    let download = document.createElement("a");

    let exportSelection = es.some(entity => entity.selected);
    if (exportSelection) {
        if(!confirm("Only selection will be exported.")) return;
        for (let i = 0; i < es.length; i++) {
            if (es[i].selected) {
                newstr += compi_obj(i);
            }
        }

        if (mapid) {
            download.download = mapid + " (selection).xml";
        } else {
            download.download = "newmap (selection).xml";
        }
    } else {
        for (let i = 0; i < es.length; i++) {
            if (es[i].exists) {
                newstr += compi_obj(i);
            }
        }

        if (mapid) {
            download.download = mapid + ".xml";
        } else {
            download.download = "newmap.xml";
        }
    }

    download.href = "data:text," + escape(newstr);

    if (newstr != "") {
        download.href = "data:text," + escape(newstr);

        download.click();
    } else {
        alert("Map is empty.");
    }

    download.remove();
}
///////////////////////////////

let imageContextMap = {};
let last_element;
let last_login;
window.aleiContextRenameImage = function(id) {
    var v = prompt('New name:', imageContextMap[id]);
    CloseImageContext();
    if ( v !== null ) {
        ServerRequest(`a=get_images&for_class=${last_for_class}&set_title_for=${id}&value=${v}`, "rename_image");
    }
}
window.aleiContextDeleteImage = function(id) {
    let v = confirm(`Are you sure you want to delete ${imageContextMap[id]} ?`);
    CloseImageContext();
    if ( v ) {
        last_element.style.opacity = '0.5';
        ServerRequest(`a=get_images&for_class=${last_for_class}&delete=${id}`, 'delete_image' );
    }
}

function ImageContext(id, e, old_name, element, moderator_menu, awaiting_approval=false, login='?', approver='?', is_fav_menu = false) {
    imageContextMap[id] = old_name;
    last_element = element;
    last_login = login;
    e.preventDefault();

    var image_context = document.getElementById('image_context');

    var str = '';

    if (moderator_menu) {
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&approve_for=${id}', 'approve_image' ); }, 1 );">Approve <img src="../images/ap.png" width="11" height="11"></div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&reset_status_for=${id}', 'reset_approval_image' ); }, 1 );">Reset approval status</div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { open_approved_decor_model = true; SaveFiltering(); search_phrase = '*by_login*'+last_login; UpdateImageList(); }, 1 );">Search for other approved images from &quot;${login}&quot;</div>`;
        str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Last status change by ${approver}</div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&disapprove_for_all='+last_login, 'disapprove_image' ); }, 1 );">Disapprove all unreviewed from &quot;${login}&quot; <img src="../images/noap.png" width="11" height="11"><img src="../images/noap.png" width="11" height="11"><img src="../images/noap.png" width="11" height="11"></div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&disapprove_for=${id}', 'disapprove_image' ); }, 1 );">Disapprove <img src="../images/noap.png" width="11" height="11"></div>`;

    } else {
        //console.log( login, curlogin );

        if (login == curlogin && approver != '!') {
            str += `<div onclick="aleiContextRenameImage(${id})">Rename</div>`; // We overwrite rename action to our own.

            if (awaiting_approval) {
                str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Request Approval (already done)</div>`;
                str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&deawait_approval_for=${id}', 'await_approval_status' ); }, 1 ); ">Exclude from approval review queue</div>`;
            } else {
                if (old_name == 'Untitled') {
                    str += `<div onclick="alert('Proper name required for custom image - you will not be available to change name once image is approved.');" style="color:rgba(0,0,0,0.3)">Request Approval (proper name required)</div>`;
                } else {
                    str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&await_approval_for=${id}', 'await_approval_status' ); }, 1 ); ">Request Approval <img src="../images/ap.png" width="11" height="11"></div>`;
                }
                str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Exclude from approval review queue (not in queue)</div>`;
            }

            str += `<div onclick="aleiContextDeleteImage(${id})">Delete <img src="../images/noap.png" width="11" height="11"></div>`;
        } else {
            str += `<div onclick="CloseImageContext(); setTimeout( function() { open_approved_decor_model = true; SaveFiltering(); search_phrase = '*by_login*'+last_login; UpdateImageList(); }, 1 );">Search for other approved images from &quot;${login}&quot;</div>`;
        }

        str += `<span style="display:block;">&nbsp;</span>`;
        if (is_fav_menu) {
            str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&favorite_del=${id}', 'favorite_status' ); }, 1 ); ">Remove from favorites</div>`;
        } else {
            str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&favorite_add=${id}', 'favorite_status' ); }, 1 ); ">Add to favorites</div>`;
        }

    }

    image_context.innerHTML = str;

    image_context.style.left = e.clientX;
    image_context.style.top = e.clientY;
    image_context.style.display = 'block';

    image_context_cancel_pad.style.display = 'block';

    return false;
}

function findObjects(name) {
    let exact = confirm("Exact name?");
    let notFound = true;

    function pred(d) {
        if (exact) {return d == name;}
        else {return d.includes(name)}
    }

    for (let i = 0; i < es.length; i++) {
        es[i].selected = false;

        if (es[i].pm.uid) {
            if (pred(es[i].pm.uid) && MatchLayer(es[i])) {
                es[i].selected = true;
                notFound = false;
            }
        }
    }

    need_GUIParams_update = true;
    need_redraw = true;

    return notFound;
}

function rotateObjects() {
    let selected = SelectedObjects;
    let distX = [];
    let distY = [];
    let minX;
    let minY;

    for (let i = 0; i < selected.length; i++) {
        if (selected[i].pm.w && selected[i].pm.h) {
            let save = selected[i].pm.w;

            selected[i].pm.w = selected[i].pm.h;
            selected[i].pm.h = save;
        }

        distX.push(selected[i].pm.x);
        distY.push(selected[i].pm.y);
    }

    minX = Math.min(...distX);
    minY = Math.min(...distY);

    for (let i = 0; i < selected.length; i++) {
        distX[i] -= minX;
        distY[i] -= minY;

        selected[i].pm.x = minX + distY[i];
        selected[i].pm.y = minY + distX[i];
    }
}

function patchRandomizeName() {
    const originalRandomizeName = window.RandomizeName;
    window.RandomizeName = function(oldName) {
        if (!aleiSettings.orderedNaming) {
            return originalRandomizeName(oldName);
        }
        else {
            let takenUids = new Set(es.filter(e => e.exists).map(o => o.pm.uid));
            let actualName = oldName;

            // Early quit if name is already unique
            if(!takenUids.has(actualName)) return actualName;
            
            // Getting name before *
            if(oldName.indexOf("*") !== -1) actualName = oldName.slice(0, oldName.indexOf("*"));

            // Testing every number through bruteforce.
            let current = 1;
            while(takenUids.has(`${actualName}*${current}`)) current++;

            return `${actualName}*${current}`;
        }
    }
}

function patchAllowedCharacters() {
    allowed_string_chars += "<>";
}

function getObjectBox(obj) {
    let x = 0;
    let y = 0;
    let w = obj.pm.w;
    let h = obj.pm.h;

    if (!obj._isresizable) {
        x = bo_x[obj._class];
        y = bo_y[obj._class];
        w = bo_w[obj._class];
        h = bo_h[obj._class];
    }

    if (["player", "enemy"].includes(obj._class)) {
        x = -15;
        y = -81;
        w = 30;
        h = 80;
    }

    if (obj._class == "vehicle") {
        x = bo_x["vehicle_" + obj.pm.model];
        y = bo_y["vehicle_" + obj.pm.model];
        w = bo_w["vehicle_" + obj.pm.model];
        h = bo_h["vehicle_" + obj.pm.model];

        if (obj.pm.model == "veh_hh") {
            x = lo_x["alei_veh_hh"];
            y = lo_y["alei_veh_hh"];
            w = lo_w["alei_veh_hh"];
            h = lo_h["alei_veh_hh"];
        }
    }

    return {
        x: x,
        y: y,
        w: w,
        h: h
    }
}

function getSelectionImage() {
    let selection = SelectedObjects;
    let minX = +Infinity;
    let minY = +Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < selection.length; i++) {
        let box = getObjectBox(selection[i]);
        let x = selection[i].pm.x + box.x;
        let y = selection[i].pm.y + box.y;
        let w = box.w;
        let h = box.h;

        if (x < minX) {
            minX = x;
        }

        if (x + w > maxX) {
            maxX = x + w;
        }

        if (y < minY) {
            minY = y;
        }

        if (y + h > maxY) {
            maxY = y + h;
        }
    }

    window.es = [];
    for (let e of selection) {
        es.push(e);
    }



    THEME = 4;
    GRID_ALPHA = 0;
    SHOW_CONNECTIONS = false;
    zoom = 1;
    zoom_validate();

    let sw = dis_to_x - dis_from_x;
    let sh = dis_to_y - dis_from_y;

    dis_from_x = minX - 10;
    dis_from_y = minY - 10;
    dis_to_x = minX + sw - 10;
    dis_to_y = minY + sh - 10;

    ConsoleTraceMessages = [];

    Render();

    let w = maxX - minX + 20;
    let h = maxY - minY + 20;

    aleiLog(logLevel.VERBOSE, "Before GID");
    let data = ctx.getImageData(0, 0, w, h);
    aleiLog(logLevel.VERBOSE, "After GID");

    let canvas = document.createElement("canvas");
    let ctx2 = canvas.getContext("2d");

    let canvas2 = document.createElement("canvas");
    let ctx3 = canvas2.getContext("2d");

    canvas.width = w;
    canvas.height = h;

    ctx2.beginPath();
    ctx2.putImageData(data, 0, 0);
    ctx2.closePath();

    let prevW = w;
    let prevH = h;

    if (w > 100 || h > 100) {
        let divide = w / h;

        if (divide >= 1) {
            w = 100;
            h = w / divide;
        } else {
            h = 100;
            w = h * divide;
        }
    }

    canvas2.width = w;
    canvas2.height = h;

    ctx3.beginPath();
    ctx3.scale(w / prevW, h / prevH);
    ctx3.drawImage(canvas, 0, 0);
    ctx3.closePath();

    let result = canvas2.toDataURL();

    canvas.remove();
    canvas = undefined;

    return result;
}

function createClipboardDiv() {
    let clipboardDiv = document.createElement("div");
    let mrdimlights = document.getElementById("mrdimlights");

    clipboardDiv.id = "clipboardDiv";
    clipboardDiv.className = "mrpopup";
    clipboardDiv.style = "width: calc(100% - 280px); height: 100%; margin: 0px; padding: 0px; top: 50%; transform: translate(0px, -50%); display: none;";

    clipboardDiv.addEventListener("contextmenu", e => {
        e.preventDefault();
    });

    mrdimlights.addEventListener("click", e => {
        clipboardDiv.style.display = "none";
    });

    document.body.append(clipboardDiv);
}

function clipboardItemAction(i) {
    let items = JSON.parse(localStorage.clipboardItems);
    let action = confirm("Rename (OK) or delete (Cancel) ?");

    if (action) {
        let name = prompt("Enter name:", items[i].name);

        if (name) {
            items[i].name = name;

            localStorage.clipboardItems = JSON.stringify(items);

            updateClipboardDiv();
        }
    } else {
        if (confirm("Are you sure you want to delete?")) {
            items.splice(i, 1);

            localStorage.clipboardItems = JSON.stringify(items);

            updateClipboardDiv();
        }
    }
}

function registerClipboardItemAction() {
    window.clipboardItemAction = clipboardItemAction;
    aleiLog(logLevel.DEBUG, "Registered Clipboard Item Action");
}

function updateClipboardDiv() {
    if (!localStorage.clipboardItems) {
        localStorage.clipboardItems = "[]";
    }

    let items = JSON.parse(localStorage.clipboardItems);
    let clipboardDiv = document.getElementById("clipboardDiv");
    let mrdimlights = document.getElementById("mrdimlights");

    clipboardDiv.style.display = "block";
    mrdimlights.style.display = "block";

    let html = `
        <div id="mrtitle">
            <span>Object clipboard</span>
            <closebox onclick="document.getElementById('clipboardDiv').style.display = 'none'; document.getElementById('mrdimlights').style.display = 'none';">x</closebox>
        </div>

        <div id="mrbox" class="objbox" style="height: calc(100% - 32px); box-sizing: border-box;">
    `;

    let originalES = window.es;
    let cs = {} // CS: Current Settings, because we will change settings for rendering images
    cs.theme = THEME;
    cs.grid_opacity = GRID_ALPHA;
    cs.showConnections = SHOW_CONNECTIONS;
    //
    cs.dtx = dis_to_x;
    cs.dty = dis_to_y;
    //
    cs.dfx = dis_from_x;
    cs.dfy = dis_from_y;
    //
    cs.ctm = ConsoleTraceMessages;
    cs.zoom = zoom;

    window.es = [];
    for (let i = 0; i < items.length; i++) {
        __pasteObjectClipboard(items[i]);
        html += `
            <div class="img_option" style="width: auto;" oncontextmenu="clipboardItemAction(` + i + `)" onclick="pasteFromPermanentClipboard(` + i + `);">
                <img src="` + getSelectionImage() + `" style="max-width: 100px; max-height: 100px;">
                <div>` + items[i].name + `</div>
            </div>
        `;
    }

    clipboardDiv.innerHTML = html + "</div>";
    window.es = originalES;
    THEME = cs.theme;
    GRID_ALPHA = cs.grid_opacity;
    SHOW_CONNECTIONS = cs.showConnections;
    dis_to_x = cs.dtx;
    dis_to_y = cs.dty;
    dis_from_x = cs.dfx;
    dis_from_y = cs.dfy;
    ConsoleTraceMessages = cs.ctm;
    zoom = cs.zoom;
    need_redraw = true;
    zoom_validate();
}

function __pasteObjectClipboard(item) {
    sessionStorage.permanent_clipboard = item.data;
    PasteFromClipBoard("permanent_clipboard");
}

function pasteFromPermanentClipboard(i) {
    let items = JSON.parse(localStorage.clipboardItems);

    sessionStorage.permanent_clipboard = items[i].data;

    PasteFromClipBoard("permanent_clipboard");

    let clipboardDiv = document.getElementById("clipboardDiv");
    let mrdimlights = document.getElementById("mrdimlights");

    clipboardDiv.style.display = "none";
    mrdimlights.style.display = "none";

    NewNote("Objects pasted from permanent clipboard.", note_passive);
}

function copyToPermanentClipboard() {
    try {
        let selection = SelectedObjects;

        if (selection.length != 0) {
            CopyToClipBoard("permanent_clipboard");

            let items = JSON.parse(localStorage.clipboardItems);

            items.push({
                name: "Selection",
                data: sessionStorage.permanent_clipboard
            });

            localStorage.clipboardItems = JSON.stringify(items);

            NewNote("Objects copied to permanent clipboard.", note_passive);
        } else {
            updateClipboardDiv();
        }
    } catch (err) {
        console.error(err);
        NewNote("Can't copy objects to permanent clipboard.<br>LocalStorage error?", note_bad);
    }
}

function addPasteFromPermanentClipboard() {
    window.pasteFromPermanentClipboard = pasteFromPermanentClipboard;
}

function changeTopRightText() {
    let containerElem = document.getElementById("version_rights");
    let elem = containerElem.childNodes[0];

    containerElem.style.width = "170px";
    elem.style.width = "160px";

    let version = "";
    if(isNative) version = " v" + GM_info.script.version;

    elem.innerHTML = elem.innerHTML.replaceAll("<br>", " ") + "<br>ALE Improvements" + version;
}

/**
 * This function is invoked whenever users pressed the "Extend trigger action list." or the "Shrink trigger action list" buttons.
 * This function is responsible for creating and maintaining extended triggers.
 *
 * @param {Number} value    The amount of trigger actions to add or subtract from the currently selected trigger,
 * @param {boolean} scrollToBottom - whether to scroll to the bottom after trigger actions are added
 */
function addTriggerActionCount(value, scrollToBottom=true){

    const selection = SelectedObjects;

    if (selection.length != 1 || value === 0) {
        return;
    }

    const selectedTrigger = selection[0];

    // Subtracting trigger actions from normal triggers is a no-op.
    if(!selectedTrigger.pm["extended"] && value < 0){
        return;
    }

    // It is a normal trigger, let's convert it to an extended trigger.
    if(!selectedTrigger.pm["extended"]){
        selectedTrigger.pm["additionalActions"] = new Array();
        selectedTrigger.pm["additionalParamA"] = new Array();
        selectedTrigger.pm["additionalParamB"] = new Array();
        selectedTrigger.pm["totalNumOfActions"] = 10;
        selectedTrigger.pm["extended"] = true;

        NewNote("Converted this to an extended trigger.", note_passive);
        NewNote("Behind the scenes, this creates 1 trigger for every additional 9 trigger actions. Be mindful about your number of triggers.", note_neutral);
    }

    selectedTrigger.pm["totalNumOfActions"] += value;

    // handle removal of parameters for parameter map
    if (value < 0) {
        let removedParamNames = [];
        let removedParamValues = [];
        const upperBound = selectedTrigger.pm.additionalActions.length
        const startIndex = Math.max(0, upperBound + value);
        for (let i = startIndex; i < upperBound; i++) {
            const actionNum = i + 11;
            removedParamNames.push(`actions_${actionNum}_type`);
            removedParamValues.push(selectedTrigger.pm.additionalActions[i]);

            removedParamNames.push(`actions_${actionNum}_targetA`);
            removedParamValues.push(selectedTrigger.pm.additionalParamA[i]);

            removedParamNames.push(`actions_${actionNum}_targetB`);
            removedParamValues.push(selectedTrigger.pm.additionalParamB[i]);
        }
        parameterMapHandleParametersRemoval(selectedTrigger, removedParamNames, removedParamValues);
    }

    // It has less than 10 trigger actions, let's convert this extended trigger back to a normal trigger.
    if(selectedTrigger.pm["totalNumOfActions"] <= 10 || isNaN(selectedTrigger.pm["totalNumOfActions"])){
        delete selectedTrigger.pm["additionalActions"];
        delete selectedTrigger.pm["additionalParamA"];
        delete selectedTrigger.pm["additionalParamB"];
        delete selectedTrigger.pm["totalNumOfActions"];
        delete selectedTrigger.pm["extended"];
    }
    // Resize arrays according to the new change in totalNumOfTriggers.
    else{
        if(value > 0){
            selectedTrigger.pm["additionalActions"].push(...Array(value).fill(-1));
            selectedTrigger.pm["additionalParamA"].push(...Array(value).fill(0));
            selectedTrigger.pm["additionalParamB"].push(...Array(value).fill(0));
        }
        else{
            selectedTrigger.pm["additionalActions"].length += value;
            selectedTrigger.pm["additionalParamA"].length += value;
            selectedTrigger.pm["additionalParamB"].length += value;
        }
    }

    // handle removal of parameters for ocm
    if (value < 0) ocmHandleEntityParametersChange(selectedTrigger);

    UpdateGUIParams();

    if (scrollToBottom) {
        // Scroll to the bottom of the trigger list.
        let divElement = document.getElementById('rparams');
        divElement.scrollTop = divElement.scrollHeight;
    }
}

function getImageSize() {
    let selection = SelectedObjects;
    let id;

    if (selection[0]._class == "bg") {
        id = selection[0].pm.m;
    }

    if (selection[0]._class == "decor") {
        id = selection[0].pm.model;
    }

    if (typeof id == "string") {
        let img = document.createElement("img");

        img.onload = function() {
            let w = img.width;
            let h = img.height;

            img.remove();

            alert("W: " + w + "\nH: " + h);
        }

        img.onerror = function() {
            img.remove();

            alert("Image not found.");
        }

        img.src = "https://www.plazmaburst2.com/mimage_cache.php?image_id=" + id.slice(1);
    } else {
        alert("Image not found.");
    }
}

function getImageData() {
    return new Promise((res, err) => {
        let selection = SelectedObjects;
        let id;

        if (selection[0]._class == "bg") {
            id = selection[0].pm.m;
        }

        if (selection[0]._class == "decor") {
            id = selection[0].pm.model;
        }

        if (typeof id == "string") {
            let img = document.createElement("img");

            img.onload = function() {
                let w = img.width;
                let h = img.height;

                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.beginPath();
                ctx.drawImage(img, 0, 0);
                ctx.closePath();

                res([ctx.getImageData(0, 0, w, h).data, w]);
            }

            img.onerror = function() {
                img.remove();

                alert("Image not found.");

                res(1);
            }

            img.src = "https://www.plazmaburst2.com/mimage_cache.php?image_id=" + id.slice(1);
        } else {
            alert("Image not found.");

            res(1);
        }
    });
}

function getImagePosition(data, w) {
    let arrX = [];
    let arrY = [];

    let minX;
    let minY;
    let maxX;
    let maxY;

    let centerX = 0;
    let centerY = 0;

    if (data != 1) {
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] >= 3) {
                let x = (i / 4) % w;
                let y = Math.floor(i / 4 / w);

                arrX.push(x);
                arrY.push(y);
            }
        }

        minX = Math.min(...arrX);
        minY = Math.min(...arrY);
        maxX = Math.max(...arrX);
        maxY = Math.max(...arrY);

        centerX = (minX + maxX) / 2;
        centerY = (minY + maxY) / 2;
    }

    return {
        x: centerX,
        y: centerY
    }
}

function setDecorOffset(x, y) {
    let selection = SelectedObjects;

    selection[0].pm.u = x;
    selection[0].pm.v = y;
}

function centerImageX() {
    let selection = SelectedObjects;

    if (selection.length == 1) {
        if (selection[0]._class == "decor") {
            getImageData().then(res => {
                if (res != 1) {
                    let center = getImagePosition(res[0], res[1]);
                    let x = center.x;

                    setDecorOffset(-x, selection[0].pm.v);
                }
            });
        }
    }

    need_redraw = true;
    need_GUIParams_update = true;
}

function centerImageY() {
    let selection = SelectedObjects;

    if (selection.length == 1) {
        if (selection[0]._class == "decor") {
            getImageData().then(res => {
                if (res != 1) {
                    let center = getImagePosition(res[0], res[1]);
                    let y = center.y;

                    setDecorOffset(selection[0].pm.u, -y);
                }
            });
        }
    }

    need_redraw = true;
    need_GUIParams_update = true;
}

function addFunctionToWindow() {
    window.getImageSize = getImageSize;
    window.centerImageX = centerImageX;
    window.centerImageY = centerImageY;
    window.addTriggerActionCount = addTriggerActionCount;
}

let targetElement;

document.addEventListener("mousedown", e => {
    targetElement = e.target;
});

document.addEventListener("keydown", e => {
    if(e.ctrlKey && e.code == "KeyA" && canvas_focus) {
        window.es.map(e => {
            if((e.exists) && (e._isphysical) && (MatchLayer(e))) {
                e.selected = true;
            }
            window.need_redraw = true;
            window.need_GUIParams_update = true;
        });
    }
    if (e.ctrlKey && e.code == "KeyS" && canvas_focus) {
        e.preventDefault();
        document.getElementsByClassName("field_btn")[0].click();
    }

    if (e.ctrlKey && e.code == "KeyF" && canvas_focus) {
        e.preventDefault();

        let name = prompt("Find objects:", "");

        if (name !== null && name !== "") {
            let notFound = findObjects(name);

            if (notFound) {
                alert("Nothing found.");
            }
        }
    }

    if (e.code == "KeyR" && targetElement != "[object HTMLInputElement]" && targetElement.id != "opcode_field") {
        rotateObjects();
    }

    if ((e.code == "Minus" || e.code == "NumpadSubtract") && e.ctrlKey && canvas_focus) {
        e.preventDefault();

        zoom *= 2;
        zoom_validate();
        need_redraw = true;
    }

    if ((e.code == "Equal" || e.code == "NumpadAdd") && e.ctrlKey && canvas_focus) {
        e.preventDefault();

        zoom *= 0.5;
        zoom_validate();
        need_redraw = true;
    }

    if (e.ctrlKey && e.altKey) {
        e.preventDefault();

        zoom = 1;
        zoom_validate();
        need_redraw = true;
    }

    if (e.code == "KeyH" && e.ctrlKey) {
        e.preventDefault();

        if (targetElement.id === "opcode_field") {
            let value = targetElement.value;

            let str1 = prompt("Enter string to replace from:", "");
            if (!str1) return;

            let str2 = prompt("Enter string to replace to:", str1);
            if (!str2) return;

            targetElement.value = value.replaceAll(str1, str2);
        }
    }

    if (e.code == "Enter" && targetElement != "[object HTMLInputElement]" && targetElement.id != "opcode_field" && canvas_focus) {
        let selected = SelectedObjects;

        if (selected.length != 0) {
            let param = prompt("Enter parameter name:", "");

            if (param) {
                let expression = prompt("Enter expression:", "");

                if (expression) {
                    param = param.toLowerCase().replace("width", "w").replace("height", "h");

                    for (let i = 0; i < selected.length; i++) {
                        let x = selected[i].pm.x;
                        let y = selected[i].pm.y;
                        let w = selected[i].pm.w;
                        let h = selected[i].pm.h;

                        if (x === undefined) {
                            x = 0;
                        }

                        if (y === undefined) {
                            y = 0;
                        }

                        if (w === undefined) {
                            w = 0;
                        }

                        if (h === undefined) {
                            h = 0;
                        }

                        if (selected[i].pm[param] !== undefined) {
                            let parsed = alescriptParse(expression, [x, y, w, h, i]);

                            if (typeof parsed == "number") {
                                for (let j = 0; j < selected.length; j++) {
                                    selected[j].selected = false;
                                }

                                selected[i].selected = true;

                                UpdatePhysicalParam(param, parsed);
                            }

                            for (let j = 0; j < selected.length; j++) {
                                selected[j].selected = true;
                            }
                        }
                    }

                    need_GUIParams_update = true;
                }
            }
        }
    }

    if (e.altKey) {
        e.preventDefault();
    }

    if (e.altKey && targetElement == "[object HTMLInputElement]") {
        let selected = SelectedObjects;

        if (selected.length == 1) {
            let x = selected[0].pm.x;
            let y = selected[0].pm.y;
            let w = selected[0].pm.w;
            let h = selected[0].pm.h;

            if (x === undefined) {
                x = 0;
            }

            if (y === undefined) {
                y = 0;
            }

            if (w === undefined) {
                w = 0;
            }

            if (h === undefined) {
                h = 0;
            }

            // i is undefined and i'm pretty sure it's not supposed to be like that. so this definitely doesn't work how it should.
            // i'll just leave it cuz idk how it's supposed to be and it doesn't throw an error because of some implicit globals from vanilla ale
            let parsed = alescriptParse(targetElement.value, [x, y, w, h, i]);

            if (typeof parsed == "number") {
                targetElement.value = parsed;
            }
        }
    }

    if (e.ctrlKey && e.code == "KeyP") {
        e.preventDefault();

        copyToPermanentClipboard();
    }
});

function doTooltip() {
    let tooltip = document.createElement("p");
    tooltip.id = "alei-tooltip";

    document.body.append(tooltip);

    document.addEventListener("mousemove", e => {
        if (e.target.title) {
            e.target.dataset.title = e.target.title;
            e.target.title = "";
        }

        if (e.target.parentElement.title) {
            e.target.parentElement.dataset.title = e.target.parentElement.title;
            e.target.parentElement.title = "";
        }
        let leftOffset = 150

        if (e.target.dataset.title) {
            let to = e.target.dataset.title.length
            tooltip.style.left = to + leftOffset + e.clientX + 20 + "px";
            tooltip.innerHTML = e.target.dataset.title;

            if (tooltip.getBoundingClientRect().height != 31) {
                tooltip.style.left = to + leftOffset + e.clientX - 20 - tooltip.getBoundingClientRect().width + "px";
            }
        } else if (e.target.parentElement.dataset.title) {
            let to = e.target.parentElement.dataset.title.length
            tooltip.style.left = to + leftOffset + e.clientX + 20 + "px";
            tooltip.style.top = e.clientY + "px";
            tooltip.innerHTML = e.target.parentElement.dataset.title;

            if (tooltip.getBoundingClientRect().height != 31) {
                tooltip.style.left = to + leftOffset + e.clientX - 20 - tooltip.getBoundingClientRect().width + "px";
            }
        } else {
            tooltip.style.left = -100 + leftOffset + "px";
            tooltip.style.top = "-100px";
        }
    });
    aleiLog(logLevel.DEBUG, "Added tooltip.")
}

function patchDecorUpload() {
    // Allows for multiple uploads.
    let imageLoader = $id("imageLoader");
    // First we make it allow multiple files and remove original event listener.
    imageLoader.setAttribute("multiple", true);
    imageLoader.removeEventListener("change", handleImage);
    // Then we register our own.
    imageLoader.addEventListener("change", function(e) {
        let files = e.target.files;
        NewNote(`ALEI: Will upload ${files.length} bg/decor(s).`, "#2595FF");
        for (let file of files) {
            let arg = {target: {files: [file]}};
            handleImage(arg); // Call original function
        }
    }, false)
}

///////////////////////////////

function updateBoxSplitterSize() {
    let obj = $id("gui_objbox");
    let rect = obj.getBoundingClientRect();
    let style = splitter2.style;
    style.setProperty("width", rect.width);
    style.setProperty("left", rect.x);
    style.setProperty("top", rect.bottom);
}

function addObjBoxResize() {
    let obj = $id("gui_objbox");
    let splitter = document.createElement("div");
    window.splitter2 = splitter;
    let style = splitter.style;
    $id("floattag").appendChild(splitter);

    style.setProperty("position", "absolute");
    style.setProperty("height", "5px");
    style.setProperty("cursor", "s-resize");

    updateBoxSplitterSize();

    let splitterClicking = false;
    splitter.onmousedown = ((e) => {splitterClicking = true});
    ROOT_ELEMENT.addEventListener("mouseup", (e) => {splitterClicking = false});
    ROOT_ELEMENT.addEventListener("mousemove", (e) => {
        if (!splitterClicking) return;

        let new_height = e.clientY - 90;
        obj.style.height = new_height;
        updateBoxSplitterSize();
        ShowHideObjectBox();
        ShowHideObjectBox();
    });
    aleiLog(logLevel.DEBUG, "Added splitter for object box.");
}

function patch_m_down() {
    // entity.selected fix for when object creation is undone (1/2)
    let oldCode = m_down.toString();
    let newCode = oldCode.replace("in newbie.pm) { ldn", `
        in newbie.pm) {
        lnd('es[' + newid + '].selected=false;');
        ldn
    `);
    if (oldCode === newCode) {
        aleiLog(logLevel.WARN, "m_down direct code replacement failed (selected fix)");
    }
    let og_mdown = eval("(" + newCode + ")");

    window.m_down = function(e) {
        let previousEsLength = es.length;
        og_mdown(e);

        if (es.length > previousEsLength) { // New element is made.

            onEntitiesCreated(es.slice(previousEsLength));

            let element = es[es.length - 1];
            if (!("x" in element.pm)) return;
            // We now have to do job of fixPos, we cannot set fixPos to have it argument-based directly because of scoping
            // So we have to do it ourselves.
            let pm = element.pm;
            let round = function(num) {
                return Math.round(num / GRID_SNAPPING) * GRID_SNAPPING
            }
            pm.x = round(pm.x);
            pm.y = round(pm.y);
            if (element._isresizable) {
                pm.w = round(pm.w);
                pm.h = round(pm.h);
            }

            // Now we just update.
            window.need_GUIParams_update = true;
            UpdateGUIObjectsList();
        }
    }
}

function PasteFromClipBoard(ClipName) {
    var clipboard = new Object();
    if (sessionStorage[ClipName] == undefined) {
        return false;
    }
    clipboard = unserialize(sessionStorage[ClipName]);
    lcz();
    for (let i = 0; i < es.length; i++)
        if (es[i].exists) {
            if (es[i].selected) {
                ldn('es[' + i + '].selected=false;');
                lnd('es[' + i + '].selected=true;');
                es[i].selected = false;
            }
        }
    var min_x = 0;
    var max_x = 0;
    var min_y = 0;
    var max_y = 0;
    let i = 0;
    var from_obj = es.length;
    while (typeof(clipboard[i]) !== 'undefined') {
        var newparam = es.length;

        // entity.selected fix for when object creation is undone (2/2)
        ldn('es[' + newparam + '].selected=true;');
        lnd('es[' + newparam + '].selected=false;');

        ldn('es[' + newparam + '].exists=true;');
        lnd('es[' + newparam + '].exists=false;');
        es[newparam] = new E(clipboard[i]._class);
        for (let param in clipboard[i]) {
            es[newparam][param] = clipboard[i][param];
        }
        if (typeof(es[newparam].pm.x) !== 'undefined')
            if (typeof(es[newparam].pm.y) !== 'undefined') {
                if (i == 0) {
                    min_x = es[newparam].pm.x;
                    min_y = es[newparam].pm.y;
                    max_x = es[newparam].pm.x;
                    max_y = es[newparam].pm.y;
                    if (typeof(es[newparam].pm.w) !== 'undefined')
                        if (typeof(es[newparam].pm.h) !== 'undefined') {
                            min_x += es[newparam].pm.w / 2;
                            max_x += es[newparam].pm.w / 2;
                            min_y += es[newparam].pm.h / 2;
                            max_y += es[newparam].pm.h / 2;
                        }
                } else {
                    min_x = Math.min(min_x, es[newparam].pm.x);
                    min_y = Math.min(min_y, es[newparam].pm.y);
                    max_x = Math.max(max_x, es[newparam].pm.x);
                    max_y = Math.max(max_y, es[newparam].pm.y);
                    if (typeof(es[newparam].pm.w) !== 'undefined')
                        if (typeof(es[newparam].pm.h) !== 'undefined') {
                            max_x = Math.max(max_x, es[newparam].pm.x + es[newparam].pm.w);
                            max_y = Math.max(max_y, es[newparam].pm.y + es[newparam].pm.h);
                        }
                }
            }
        i++;
    }
    ldn('m_drag_selected=true;');
    ldn('paint_draw_mode=true;');
    ldn('quick_pick_ignore_one_click=true;');
    lnd('m_drag_selected=false;');
    lnd('paint_draw_mode=false;');
    lnd('quick_pick_ignore_one_click=false;');
    ldis = true;
    paint_draw_mode = true;
    quick_pick_ignore_one_click = true;
    lmdrwa = lmwa;
    lmdrwb = lmwb;
    // Original code by Prosu
    let m_pos_x = lmwa;
    let m_pos_y = lmwb;

    m_drag_x = mouse_x;
    m_drag_y = mouse_y;
    let m_down_x = m_pos_x;
    let m_down_y = m_pos_y;
    var x1 = Math.round((m_pos_x) / GRID_SNAPPING) * GRID_SNAPPING;
    var y1 = Math.round((m_pos_y) / GRID_SNAPPING) * GRID_SNAPPING;
    var lo_x = Math.round((x1 - (min_x + max_x) / 2) / GRID_SNAPPING) * GRID_SNAPPING;
    var lo_y = Math.round((y1 - (min_y + max_y) / 2) / GRID_SNAPPING) * GRID_SNAPPING;

    for (let i2 = from_obj; i2 < es.length; i2++) {
        if (typeof(es[i2].pm.uid) !== 'undefined') {
            var old_uid = es[i2].pm.uid;
            es[i2].exists = false;
            es[i2].pm.uid = RandomizeName(es[i2].pm.uid);
            es[i2].exists = true;


            for (let i3 = from_obj; i3 < es.length; i3++) {
                const newUID = es[i2].pm.uid;
                // update uid references to the new uid
                for (const param in es[i3].pm) {
                    if (param != "uid" && typeof es[i3].pm[param] != "object") {
                        es[i3].pm[param] = replaceParamValueUID(es[i3].pm[param], old_uid, newUID);
                    }
                }

                // replace uid references in additional trigger actions
                if (es[i3].pm.extended && window.ExtendedTriggersLoaded) {
                    for (let i4 = 0; i4 < es[i3].pm.additionalActions.length; i4++) {
                        es[i3].pm.additionalParamA[i4] = replaceParamValueUID(es[i3].pm.additionalParamA[i4], old_uid, newUID);
                        es[i3].pm.additionalParamB[i4] = replaceParamValueUID(es[i3].pm.additionalParamB[i4], old_uid, newUID);
                    }
                }
            }
        }
        if (typeof(es[i2].pm.x) !== 'undefined')
            if (typeof(es[i2].pm.y) !== 'undefined') {
                lnd('es[' + i2 + '].pm.x=' + es[i2].pm.x + ';');
                lnd('es[' + i2 + '].pm.y=' + es[i2].pm.y + ';');
                es[i2].pm.x += lo_x;
                es[i2].pm.y += lo_y;
                es[i2].fixPos();
                ldn('es[' + i2 + '].pm.x=' + es[i2].pm.x + ';');
                ldn('es[' + i2 + '].pm.y=' + es[i2].pm.y + ';');
            }
    }

    // update ocm and stuff after old uids have been replaced with new unique uids and uid references have been updated
    onEntitiesCreated(es.slice(from_obj));

    // Again by Prosu
    x1 = Math.round((m_pos_x - m_down_x) / GRID_SNAPPING) * GRID_SNAPPING;
    y1 = Math.round((m_pos_y - m_down_y) / GRID_SNAPPING) * GRID_SNAPPING;
    for (let i = 0; i < es.length; i++) {
        if (es[i]._isphysical && es[i].exists && es[i].selected && (MatchLayer(es[i]) || paint_draw_mode)) {
            es[i].pm.x += x1;
            es[i].pm.y += y1;
        }
    }
    m_down_x += x1;
    m_down_y += y1;
    lfz(false);
    assignObjectIDs();
    assignObjectPriority();
    window.need_redraw = true;
    window.need_GUIParams_update = true;
    return true;
}

function decodeUnicode(string) {
    if(typeof string != 'string') return string;

    const regex = /\\u([a-zA-Z0-9]{4})/g;
    return string.replaceAll(regex, (match, group) => String.fromCharCode(parseInt(group, 16)));;
}

function ServerRequest_handleMapData(mapCode) {    
    // Branch of patchServerRequest
    // Made to deal with map source related things.
    aleiLog(logLevel.DEBUG, "Parsing map source now.");

    const objectKeyValueRegex = /(\w+)=((-?\d+(\.\d+)?)|("[ -~]*")|true|false)/;
    const objectCreationRegex = /q=es\[\d+\]=new E\("(\w+)"\)/;

    let expressions = mapCode.split(";\n");

    let currentElement = null;

    window.es = new Array(); // clear.
    let index = 2; // We skip var q; and es = new Array();
    for (;index < expressions.length; index++) {
        let expression = expressions[index];

        // Skip if it's just only tab or newlines
        if(expression.replaceAll("\n", "").replaceAll("\t", "").length == 0) {continue};

        // Map ID related stuff.
        if (expression.indexOf("mapid = '") != -1) {
            window.mapid = expression.split(" = ")[1].slice(1, -1);
            mapid_field.value = mapid;
            continue;
        }
        else if (expression == "\t\tmapid_field.value = mapid") {continue;}
        else if (expression.indexOf("maprights.innerHTML='") != -1) {
            let rights = expression.split(";")[0].split(".innerHTML=")[1].slice(1, -1);
            maprights.value = rights;
            NewNote(`Map '${mapid}' has been successfully loaded.`, note_good);
            continue
        }
        // Actual mapdata.
        if(expression.indexOf(";q=q.pm;") != -1) { // Creation which is q=es[...]=new E(...);q=q.pm;q.(...)=(...);
            let creation = objectCreationRegex.exec(expression);
            currentElement = new E(creation[1]);
            es[es.length] = currentElement;

            let splt = expression.split(";");
            if (splt.length > 3) {
                // There is supposed to be only 3 ;'s
                // initializing;setting;firstProperty
                // Assuming that server only gives first property and does not send more than 1 in creation line
                aleiLog(logLevel.WARN, `Expected 3 items, got ${splt.length} - ${splt}`);
                continue;
            }
            expression = splt[2];
        };
        // Key value
        // In format of q.(___)=(___);
        let matchKeyValue = objectKeyValueRegex.exec(expression);

        if (matchKeyValue === null) {
            aleiLog(logLevel.WARN, `Unable to figure out what kind of code is "${expression}", you MIGHT have issues.`);
            continue;
        }
        let key = matchKeyValue[1];
        let value = matchKeyValue[2].replaceAll("\\/", "/");
        if (value[0] != '"') { // Not a string.
            if (value == "true") value = true;
            else if(value == "false") value = false;
            else if(value.indexOf(".") != -1) value = parseFloat(value);
            else value = parseInt(value);
        } else {
            // Is a string. We just strip quotation marks and fix apostrophes.
            value = value.slice(1, -1).replaceAll("\\'", "'");
        }
        currentElement.pm[key] = decodeUnicode(value);
    }

    if (aleiSettings.extendedTriggers && !html5ModeActive) parseExtendedTriggers(); // !html5ModeActive because extended triggers use switch execution
}

function handleServerRequestResponse(request, operation, response) {
    if (response.indexOf("var es = new Array();") != -1) {
        clearSelectedObjects();
        ServerRequest_handleMapData(response);
        getALEIMapDataFromALEIMapDataObject(); //map data object >>> aleiMapData
        loadALEIMapDataIntoUse(); //aleiMapData >>> data in use
        loadUIDMap();
        loadParameterMap();
        if (aleiSettings.ocmEnabled) loadOCM();
    }else if (response.indexOf("knownmaps = [") !== -1) {
        window.knownmaps = [];
        for (let map of response.match(/"(.*?)"/g)) {
            knownmaps.push(map.slice(1, -1))
        }
        aleiLog(logLevel.DEBUG, `Updated knownmaps with ${knownmaps.length} maps`);
    }else {
        aleiLog(logLevel.VERBOSE, `Evaling for request ${ANSI_YELLOW}"${request}"${ANSI_RESET} with operation of ${ANSI_YELLOW}"${operation}"${ANSI_RESET}: ${response}`)
        try {JS_eval(response);}
        catch(e) {
            NewNote("Eval error!", note_bad);
            console.error(e);
            aleiLog(logLevel.INFO, `Eval Error from ${request}, for op ${operation} whose response is ${response}`);
        }
    };
}

function makeRequest(method, url, data) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve({status: 200, response: xhr.response});
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(data);
    });
}

function updateDecorList() {
    try {
        let list_native = $id("list_native");
        for(let i = 0; i < ALEI_decors.length; i++) {
            let decor = ALEI_decors[i];
            let decor_model = decor[0];
            let decor_name = decor[1];
            let decor_image = decor[2];
            list_native.innerHTML += `
                    <div class="img_option" onClick="CustomImageSelected('${decor_model}', '${decor_name}' )">
                       <div class="imgdiv" style="background:url(${decor_image})"></div>
                       <div>
                         ${decor_name}
                       </div>
                    </div>
                    `
        }
        aleiLog(logLevel.DEBUG, "Updated decor list.");
    }
    catch(e) {} // We assume we are not in decor list yet.
}

async function ALEI_ServerRequest(request, operation, callback = null) {
    let response = await makeRequest("POST", `e_server.php?a=${request_a}`, request);

    if (response.status != 200) {
        if (operation == 'save') NewNote('Oops! Error occoured during saving. Usually it may be happening due to connection problems. Map will be temporary saved to your computer\'s LocalStorage', note_bad);
        else if (operation == 'load') NewNote('Oops! Error occoured durning loading. Usually it may be happening due to connection problems.', note_bad)
        return;
    }

    try {
        handleServerRequestResponse(request, operation, response.response);
        if (request.indexOf("a=get_images") != -1 && request.indexOf("for_class=decor_model") != -1) {
            updateDecorList();
        }
        window.ImageContext = ImageContext;
        if (operation == 'save' || operation == 'load') {
            changes_made = false;
            if (operation == 'load') {
                need_redraw = true;
                need_GUIParams_update = true;
                ClearUndos();
            }
        }
    } catch (e) {
        console.error(e);
        NewNote('Server responds with unclear message. Looks like one of recent actions wasn\'t successful.', note_bad);
        debugger;
    }

    if (callback != null) {
        callback();
    }
}

let _serverRequestPatched = false;
function patchServerRequest() {
    // This code just exists to prevent logging more than once
    if (_serverRequestPatched) return;
    _serverRequestPatched = true;
    // Patches ServerRequest function.
    // vanilla ServerRequest function literally eval()'s every single thing that server sends.
    // Which opens up to expected vulnerabilities.
    // Hopefully in future, ALEI will completely get rid of eval.
    window.ServerRequest = ALEI_ServerRequest;
    // We are pretty much done, we have patched ServerRequest, so just roll with old eval.
    // Oh and a note for myself incase i confuse myself: vanilla ServerRequest is synchrono
    window.eval = JS_eval;
    aleiLog(logLevel.DEBUG, "Patched ServerRequest");
}

window.eval = function(code) { // Temporarily overriding eval so we can patch ServerRequest as early as possible
    if (window.ServerRequest !== undefined) { // ServerRequest is defined.
        handleServerRequestResponse(null, null, code);
        patchServerRequest();
    } else {
        // Is not defined.
        // Is this even possible in normal circumstances?
        console.log(code);
        debugger;
    }
};

function patchEvalSet() {
    window.EvalSet = function(key, value) {
        // No evaling. Death to eval! (except for when i want to use it...)
        window[key] = value;
        UpdateTools();
    }
    aleiLog(logLevel.DEBUG, "Patched EvalSet");
}

function patchTeamList() {
    for (let entry of Object.entries(VAL_TABLE["team"])) {
        let teamID = parseInt(entry[0]);
        let teamName = entry[1];

        if (teamID < 0) {
            teamName = teamName.replace("(no friendly fire)", "(No collision, Yes friendly fire)")
            VAL_TABLE["team"][teamID] = teamName;
        }

        if (teamID === -1) continue;
        VAL_TABLE["team+any"][teamID] = teamName;
    }
    aleiLog(logLevel.DEBUG, "Edited team list..");
}

function addProjectileModels() {
    let projectileModels = VAL_TABLE["ALEI_projectileModels"] = {
        1: "https://static.miraheze.org/plazmaburstwiki/6/6a/Lazer_1.png",
        2: "https://static.miraheze.org/plazmaburstwiki/a/ae/Lazer_2.png",
        3: "https://static.miraheze.org/plazmaburstwiki/0/06/Lazer_3.png",
        4: "https://static.miraheze.org/plazmaburstwiki/d/de/Lazer_4.png",
        5: "https://static.miraheze.org/plazmaburstwiki/8/8f/Lazer_5.png",
        6: "https://static.miraheze.org/plazmaburstwiki/a/a0/Lazer_6.png",
        7: "https://static.miraheze.org/plazmaburstwiki/7/71/Lazer_7.png",
        8: "https://static.miraheze.org/plazmaburstwiki/c/c6/Lazer_8.png",
        9: "https://static.miraheze.org/plazmaburstwiki/d/d2/Lazer_9.png",
        10: "https://static.miraheze.org/plazmaburstwiki/5/5b/Lazer_10.png",
        11: "https://static.miraheze.org/plazmaburstwiki/d/d2/Lazer_11.png",
        12: "https://static.miraheze.org/plazmaburstwiki/2/2d/Lazer_12.png",
        13: "https://static.miraheze.org/plazmaburstwiki/b/be/Lazer_13.png",
        14: "https://static.miraheze.org/plazmaburstwiki/1/14/Lazer_14.png",
        15: "", // Empty projectile.
        16: "https://static.miraheze.org/plazmaburstwiki/7/7f/Lazer_16.png",
        17: "https://static.miraheze.org/plazmaburstwiki/3/31/Lazer_17.png",
        18: "https://static.miraheze.org/plazmaburstwiki/8/89/Lazer_18.png",
        19: "https://static.miraheze.org/plazmaburstwiki/f/fe/Lazer_19.png",
        20: "https://static.miraheze.org/plazmaburstwiki/1/1a/Lazer_20.png",
        21: "https://static.miraheze.org/plazmaburstwiki/4/42/Lazer_21.png",
        22: "https://static.miraheze.org/plazmaburstwiki/c/c0/Lazer_22.png",
        23: "https://static.miraheze.org/plazmaburstwiki/d/d9/Lazer_23.png",
        24: "https://static.miraheze.org/plazmaburstwiki/f/f5/Lazer_24.png",
        25: "https://static.miraheze.org/plazmaburstwiki/7/7c/Lazer_25.png",
        26: "https://static.miraheze.org/plazmaburstwiki/a/a7/Lazer_26.png",
        27: "https://static.miraheze.org/plazmaburstwiki/3/30/Lazer_27.png",
        28: "https://static.miraheze.org/plazmaburstwiki/3/3a/Lazer_28.png",
        29: "https://static.miraheze.org/plazmaburstwiki/9/90/Lazer_29.png",
        30: "https://static.miraheze.org/plazmaburstwiki/2/23/Lazer_30.png",
        31: "https://static.miraheze.org/plazmaburstwiki/3/3a/Lazer_31.png",
        32: "https://static.miraheze.org/plazmaburstwiki/f/f0/Lazer_32.png",
        33: "https://static.miraheze.org/plazmaburstwiki/0/0d/Lazer_33.png",
        34: "https://static.miraheze.org/plazmaburstwiki/c/c8/Lazer_34.png",
        35: "https://static.miraheze.org/plazmaburstwiki/3/38/Lazer_35.png",
        36: "https://static.miraheze.org/plazmaburstwiki/6/6d/Lazer_36.png",
        37: "https://static.miraheze.org/plazmaburstwiki/a/a9/Lazer_37.png",
        38: "https://static.miraheze.org/plazmaburstwiki/e/e7/Lazer_38.png",
        39: "https://static.miraheze.org/plazmaburstwiki/6/6c/Lazer_39.png",
        40: "https://static.miraheze.org/plazmaburstwiki/d/d4/Lazer_40.png",
        41: "https://static.miraheze.org/plazmaburstwiki/5/5d/Lazer_41.png",
        42: "https://static.miraheze.org/plazmaburstwiki/9/9d/Lazer_42.png",
        43: "https://static.miraheze.org/plazmaburstwiki/7/79/Lazer_43.png",
        44: "https://static.miraheze.org/plazmaburstwiki/6/6d/Lazer_44.png",
        45: "https://static.miraheze.org/plazmaburstwiki/4/44/Lazer_45.png",
        46: "https://static.miraheze.org/plazmaburstwiki/3/3b/Lazer_46.png",
        47: "https://static.miraheze.org/plazmaburstwiki/8/84/Lazer_47.png",
        48: "https://static.miraheze.org/plazmaburstwiki/7/75/Lazer_48.png",
        49: "https://static.miraheze.org/plazmaburstwiki/0/08/Lazer_49.png",
        50: "https://static.miraheze.org/plazmaburstwiki/4/41/Lazer_50.png",
        51: "https://static.miraheze.org/plazmaburstwiki/9/92/Lazer_51.png",
        52: "https://static.miraheze.org/plazmaburstwiki/9/92/Lazer_52.png",
        53: "https://static.miraheze.org/plazmaburstwiki/7/70/Lazer_53.png",
        54: "https://static.miraheze.org/plazmaburstwiki/e/ee/Lazer_54.png",
        55: "https://static.miraheze.org/plazmaburstwiki/d/d1/Lazer_55.png"
    };
    for (let i = 1; i < 56; i++) {
        projectileModels[i] = `<img src='${projectileModels[i]}' style='width: 60px; height: 20px'/>`;
    }
    aleiLog(logLevel.DEBUG, "Loaded projectile models.");
}

function patchSpecialValue() {
    let _OG = window.special_value;
    window.special_value = (base, value) => {
        if (["ALEI_projectileModels"].indexOf(base) !== -1) {
            let returning = VAL_TABLE[base][value];
            if (returning === undefined) return ERROR_VALUE;
            else return returning;
        } else if(base == "trigger+none") { // I actually do not have to do this, but i will do it to get rid of annoyance
            if(value == -1) return VAL_TABLE["trigger+none"][-1];
            return special_value("trigger", value);
        }else if(base == "timer+none") {
            if(value == -1) return VAL_TABLE["timer+none"][-1];
            return special_value("timer", value);
        }else return _OG(base, value);
    }
    aleiLog(logLevel.DEBUG, "Patched SpecialValue");
}

function ALEI_DoWorldScale() {
    var newscale = prompt('Multiply selection size by % (percents)', 100);
    if (!(newscale == null || newscale == 100)) {
        var factor = Math.floor(newscale) / 100;
        {
            let snappingScript = `/GRID_SNAPPING)*GRID_SNAPPING;`
            var roundwell = true;
            lcz();
            for (let i = 0; i < es.length; i++)
                if (es[i].exists)
                    if (es[i].selected)
                        if (MatchLayer(es[i])) {
                            if (es[i].pm.w != undefined) {
                                ldn('es[' + i + '].pm.w=Math.round(es[' + i + '].pm.w*' + factor + snappingScript);
                                lnd('es[' + i + '].pm.w=' + es[i].pm.w + ';');
                                if (es[i].pm.w * factor != Math.round(es[i].pm.w * factor / GRID_SNAPPING) * GRID_SNAPPING)
                                    roundwell = false;
                            }
                            if (es[i].pm.h != undefined) {
                                ldn('es[' + i + '].pm.h=Math.round(es[' + i + '].pm.h*' + factor + snappingScript);
                                lnd('es[' + i + '].pm.h=' + es[i].pm.h + ';');
                                if (es[i].pm.h * factor != Math.round(es[i].pm.h * factor / GRID_SNAPPING) * GRID_SNAPPING)
                                    roundwell = false;
                            }
                            if (es[i].pm.x != undefined) {
                                ldn('es[' + i + '].pm.x=Math.round(es[' + i + '].pm.x*' + factor + snappingScript);
                                lnd('es[' + i + '].pm.x=' + es[i].pm.x + ';');
                                if (es[i].pm.x * factor != Math.round(es[i].pm.x * factor / GRID_SNAPPING) * GRID_SNAPPING)
                                    roundwell = false;
                            }
                            if (es[i].pm.y != undefined) {
                                ldn('es[' + i + '].pm.y=Math.round(es[' + i + '].pm.y*' + factor + snappingScript);
                                lnd('es[' + i + '].pm.y=' + es[i].pm.y + ';');
                                if (es[i].pm.y * factor != Math.round(es[i].pm.y * factor / GRID_SNAPPING) * GRID_SNAPPING)
                                    roundwell = false;
                            }
                        }
            lfz(true);
            NewNote('Operation complete:<br><br>Selected objects scaled by ' + factor + ' (' + newscale + '% of original size)', note_passive);
            if (!roundwell)
                NewNote('Note: Position and/or dimensions of some objects were not scaled properly due to Level Editor rounding rules', note_neutral);
            need_GUIParams_update = true;
            need_redraw = true;
            UpdateTools();
        }
    }
}
function patchPercentageTool() {
    window.DoWorldScale = ALEI_DoWorldScale;
    aleiLog(logLevel.DEBUG, "Patched percentage tool");
}

/**
 * patches DO_UNDO and DO_REDO to add simple error reporting to undo and redo
 */
function addUndoRedoErrorReporting() {
    const old_DO_UNDO = DO_UNDO;
    const old_DO_REDO = DO_REDO;

    window.DO_UNDO = function() {
        try {
            old_DO_UNDO();
        } catch (err) {
            NewNote("Failed to undo action.", note_bad);
        }
    }

    window.DO_REDO = function() {
        try {
            old_DO_REDO();
        } catch (err) {
            NewNote("Failed to redo action.", note_bad);
        }
    }
}

function patchDrawGrid() {
    let old_lg = lg;

    window.lg = function(param1, param2) {
        if(aleiSettings.gridBasedOnSnapping) {
            old_lg(param1 * (GRID_SNAPPING / 10), Math.min(param2 * Math.max(GRID_SNAPPING / 10, 1), 1));
        } else {
            old_lg(param1, param2)
        }
    }
    aleiLog(logLevel.DEBUG, "Patched LG");
}

/**
 *  extendTriggerList() is responsible for patching many of the original functions to support the
 *  implementation of extended triggers.
 *
 *  Extended triggers are triggers that can hold more than 10 trigger actions, and is compatible with the vanilla ALE.
 *  They are implemented similar to a linked list, with the main extended trigger pointing to the next trigger via the
 *  10th trigger action.
 *
 *  View addTriggerActionCount to see what unique properties an extended trigger has (class invariant).
 *  View SaveThisMap to see the structe of the linked list.
 */
function extendTriggerList() {
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
        const skipTriggerActions = [123, 361, 364, 365];

        // Get the number and trigger type.
        let regex = /actions_(\d+)_(targetA|targetB|type)/g;
        let match = Array.from(lettarget.id.replace('pm_', '').matchAll(regex))[0];

        // Disallow skip trigger actions every 9th trigger action for triggers.
        if(
            Number(match && match[1]) % 9 === 0 && match[2] === 'type' && skipTriggerActions.includes(Number(val1))
        ){
            NewNote("Due to how extended triggers is implemented, skip trigger actions are disabled every 9th trigger action. Leave a 'Do Nothing' trigger action here instead.", note_bad);
            return;
        }

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

    let oldSaveThisMap = window.SaveThisMap;
    /**
     *  This function extends the SaveThisMap functionality by first parsing all instances of extended triggers into a linked list of normal triggers.
     *
     *  [FROM]                       |    [TO]
     *  trigger*1                    |    trigger*1                             trigger*3                             trigger*3
     *  extended:           true     |    extended:           true              *deleted*                             *deleted*
     *  totalNumOfActions:  25       |    totalNumOfActions:  25                *deleted*                             *deleted*
     *  additionalActions:  [..]     |    *deleted*                             *deleted*                             *deleted*
     *  additionalParamA:   [..]     |    *deleted*                             *deleted*                             *deleted*
     *  additionalParamB:   [..]     |    *deleted*                             *deleted*                             *deleted*
     *  actions1-10         [..]     |    actions1-9          [..]              actions1-9   [..]                     actions1-7    [..]
     *                               |    actions10           trigger*2         actions10    trigger*3                actions8-10   Do nothing.
     *
     *
     *  @param {*} temp_to_real_compile_data     Parameters that the old SaveThisMap uses. (no idea what it is tbh)
     *  @param {*} callback                      Parameters that the old SaveThisMap uses. (no idea what it is tbh)
     */
    function SaveThisMap(temp_to_real_compile_data='', callback=null) {
        const gapBetweenTrigger = 40;
        const executeTriggerAction = 99; // Required for main -> child if we want main trigger's maxcalls be in effect.
        const switchExecutionAction = 363;

        // Keep a reference to all the newly generated triggers, so we can delete them in the end.
        let allGeneratedTriggers = new Array();

        // Keep a copy of the properties all extended triggers. We will temporarily delete these additional properties before
        // file save then restore them back to the respective triggers.
        let allAdditionalActions = new Array();
        let allAdditionalParamA = new Array();
        let allAdditionalParamB = new Array();

        // For every extended trigger..
        for(const entity of es){
            if(!entity.exists)              continue;
            if(entity._class !== "trigger") continue;
            if(!entity.pm["extended"])      continue;

            // The first trigger can only store 9 actions, as the last one is required to execute the next one.
            // Let's push the 10th one to the front of respective arrays.
            entity.pm["additionalActions"].unshift(entity.pm["actions_10_type"]);
            entity.pm["additionalParamA"].unshift(entity.pm["actions_10_targetA"]);
            entity.pm["additionalParamB"].unshift(entity.pm["actions_10_targetB"]);

            // Calculate and create the number of triggers we need.
            const triggersToCreate = Math.floor((entity.pm["totalNumOfActions"] - 1) / 9);
            let   startX = entity.pm["x"] + gapBetweenTrigger;
            const startY = entity.pm["y"];

            // Auto generate all the necessary triggers. Space them out evenly.
            for(let i = 0; i < triggersToCreate; i++){
                let name = `${entity.pm["uid"]}'s extended trigger no: ${i}.`
                let newTrigger = new E("trigger");

                // Set properties.
                newTrigger.pm["x"] = startX;
                newTrigger.pm["y"] = startY;
                newTrigger.pm["uid"] = name;
                //newTrigger.pm["maxcalls"] = -1;

                // If it's the first trigger, let the main extended trigger point to this.
                if(i == 0){
                    entity.pm[`actions_10_type`] = executeTriggerAction;
                    entity.pm[`actions_10_targetA`] = name;
                    newTrigger.pm["maxcalls"] = -1;
                }

                // If not the last trigger, point to the next trigger.
                if(i < triggersToCreate - 1){
                    name = `${entity.pm["uid"]}'s extended trigger no: ${i + 1}.`
                    newTrigger.pm[`actions_10_type`] = switchExecutionAction;
                    newTrigger.pm[`actions_10_targetA`] = name;
                }

                // Set trigger action and parameters
                for(let actionNum = 1; actionNum < 10; actionNum++){
                    let index = i * 9 + (actionNum - 1);    // 0-8, 9-17, 18-26, ...

                    newTrigger.pm[`actions_${actionNum}_type`]    = entity.pm["additionalActions"][index] === undefined ? -1 : entity.pm["additionalActions"][index];
                    newTrigger.pm[`actions_${actionNum}_targetA`] = entity.pm["additionalParamA"][index]  === undefined ? 0 :  entity.pm["additionalParamA"][index];
                    newTrigger.pm[`actions_${actionNum}_targetB`] = entity.pm["additionalParamB"][index]  === undefined ? 0 :  entity.pm["additionalParamB"][index];
                }

                es.push(newTrigger);
                allGeneratedTriggers.push(newTrigger);
                startX += gapBetweenTrigger;
            }

            // Delete additional properties, and save a copy to prepare for saving.
            allAdditionalActions.push(JSON.parse(JSON.stringify(entity.pm["additionalActions"])));
            allAdditionalParamA.push(JSON.parse(JSON.stringify(entity.pm["additionalParamA"])));
            allAdditionalParamB.push(JSON.parse(JSON.stringify(entity.pm["additionalParamB"])));

            delete entity.pm["additionalActions"];
            delete entity.pm["additionalParamA"];
            delete entity.pm["additionalParamB"];
        }

        // Save this map!
        oldSaveThisMap(temp_to_real_compile_data, callback);

        let index = 0;

        // Post clean up.
        for(const entity of es){
            if(!entity.exists)              continue;
            if(entity._class !== "trigger") continue;
            if(!entity.pm["extended"])      continue;

            // Restore deleted additional properties.
            entity.pm["additionalActions"] = allAdditionalActions[index];
            entity.pm["additionalParamA"] = allAdditionalParamA[index];
            entity.pm["additionalParamB"] = allAdditionalParamB[index];

            // Restore the 10th trigger action from arrays
            entity.pm[`actions_10_type`]    = entity.pm["additionalActions"].shift();
            entity.pm[`actions_10_targetA`] = entity.pm["additionalParamA"].shift();
            entity.pm["additionalParamB"].shift();
            index++;
        }

        onEntitiesCreated(allGeneratedTriggers);

        // Delete all generated triggers.
        for(const newTrigger of allGeneratedTriggers){
            newTrigger.exists = false;
        }

        UpdateGUIObjectsList();
    }

    /**
     *  This function is responsible for compiling the text portion of the trigger action when saved.
     *  It is further patched to support more than 10 trigger actions.
     */
    function CompileTrigger() {
        const skipTriggerActions = [123, 361, 364, 365];

        if(SelectedObjects.length != 1){
            return;
        }
        const selectedTrigger = SelectedObjects[0];

        var opcode_field = document.getElementById('opcode_field');
        var code = opcode_field.value;
        var code_lines = code.split('\n');
        var new_trigger_actions = [];
        var direct_update_params = [];
        var direct_update_values = [];

        function ScheduleParamSet(a, b) {
            direct_update_params.push(a);
            direct_update_values.push(b);
        }

        for (var i = 0; i < code_lines.length; i++) {
            var line = code_lines[i];

            let paramA_start = line.indexOf('( "');
            let separator = line.indexOf('", "');
            let end = line.indexOf('" );');
            let semicolon = line.indexOf(':');

            // Parsing list of trigger actions
            if (paramA_start != -1 && separator != -1 && end != -1) {
                var first_c = line.indexOf('(');
                var opcode = line.substring(0, first_c);
                var action_type = -1;
                if (opcode.substring(0, 2) == 'op' && !isNaN(opcode.slice(2)))
                    action_type = parseInt(opcode.slice(2));
                else {
                    action_type = trigger_opcode_aliases.indexOf(opcode);
                    if (action_type == -1) {
                        NewNote('Error: Changes were not applied because "' + opcode + '" seems to be an unknown operation code.', note_neutral);
                        return false;
                    }
                }
                var valueA = '';
                var valueB = '';
                if (action_type != -1) {
                    valueA = line.substring(paramA_start + 3, separator);
                    valueB = line.substring(separator + 4, end);
                }

                new_trigger_actions.push([action_type, valueA, valueB]);

            }
            // Parsing the header portion..
            else if (semicolon != -1) {
                var left_part = line.substring(0, semicolon);
                var right_part = line.slice(semicolon + 1);
                while (left_part.charAt(0) == ' ')
                    left_part = left_part.slice(1);
                while (left_part.charAt(left_part.length - 1) == ' ')
                    left_part = left_part.slice(0, -1);
                while (right_part.charAt(0) == ' ')
                    right_part = right_part.slice(1);
                while (right_part.charAt(right_part.length - 1) == ' ')
                    right_part = right_part.slice(0, -1);
                if (left_part == 'uid' || left_part == 'enabled' || left_part == 'maxcalls' || left_part == 'execute')
                    ScheduleParamSet(left_part, right_part);
                else {
                    NewNote('Error: Changes were not applied because "' + left_part + '" seems to be not a default property.', note_neutral);
                    return false;
                }
            } else if (line != '') {
                NewNote('Error: Changes were not applied because line "' + line + '" wasn\'t recognized or contains unsupported syntax.', note_neutral);
                return false;
            }
        }

        let hasEncounteredSkipTrigger = false;
        // Retrieve all the trigger action.
        for (let i = 0; i < new_trigger_actions.length; i++) {
            // A skip trigger action for every 9th trigger action. Add a do nothing trigger action.
            if((i + 1) % 9 === 0 && skipTriggerActions.includes(new_trigger_actions[i][0])){
                new_trigger_actions.splice(i, 0, [-1, 0, 0]);
                hasEncounteredSkipTrigger = true;
            }

            ScheduleParamSet('actions_' + (i + 1) + '_type', new_trigger_actions[i][0]);
            ScheduleParamSet('actions_' + (i + 1) + '_targetA', new_trigger_actions[i][1]);
            ScheduleParamSet('actions_' + (i + 1) + '_targetB', new_trigger_actions[i][2]);
        }

        if(hasEncounteredSkipTrigger){
            NewNote("Skip trigger actions encountered in every 9th trigger action. Inserted an 'Do Nothing' trigger action.", note_neutral);
        }

        const currentActionsCount = !selectedTrigger.pm.extended ? 10 : selectedTrigger.pm.totalNumOfActions;
        if (new_trigger_actions.length > currentActionsCount) {
            // extend trigger to fit new number of actions
            const diff = new_trigger_actions.length - currentActionsCount;
            addTriggerActionCount(diff);
        }
        else {
            // Populate the rest with empty trigger actions if not all trigger actions are used
            for(let i = new_trigger_actions.length + 1; i <= currentActionsCount; i++){
                ScheduleParamSet('actions_' + i + '_type', -1);
                ScheduleParamSet('actions_' + i + '_targetA', 0);
                ScheduleParamSet('actions_' + i + '_targetB', 0);
            }
        }

        UpdatePhysicalParams(direct_update_params, direct_update_values, false, false);

        NewNote("Trigger updated successfully.", note_good);
        return true;
    }

    window.setletedit = setletedit;
    window.SaveThisMap = SaveThisMap;
    window.CompileTrigger = CompileTrigger;

    // the current serialisation and unserialisation used is an external library Eric used
    // it is currently used by the Copy and Paste clipboard functions
    // however, it does not work with arrays, turning them into objects instead.
    // therefore, Nyove has decided to overwrite these library
    window.serialize = JSON.stringify;
    window.unserialize = JSON.parse;

    // Patch the render function's connection line to work with >10 trigger actions.
    /*let RenderInString = window.Render.toString().replaceAll(
        /es\[(i2?)\]\.pm\[ property \];/g,
        `es[$1].pm[ property ];
        let array;
        if(Array.isArray(value)) {
            array = value;
        }
        else {
            array = [value];
        }

        for(let index = 0, value = array[index]; index < array.length; ++index, value = array[index])
        `
    );

    // Patch function for strict mode compliance
    RenderInString = RenderInString.toString().replaceAll(
        `for ( property in`,
        `for ( let property in`
    );

    window.Render = eval(`(${RenderInString})`);*/
}

/** This function is invoked whenever the map loads.
 *
 *  It looks for potential triggers configured in a linked list manner and converts it to an extended trigger.
 */
function parseExtendedTriggers(){
    const maxIteration = 1000;
    const executeTriggerAction = 99;
    const switchExecutionAction = 363;

    // Find all extended triggers.
    for(const entity of es){
        if(!entity.exists)              continue;
        if(entity._class !== "trigger") continue;
        if(!entity.pm["extended"])      continue;

        let iterationCount = 1;
        let previousTotalNumOfActions = entity.pm["totalNumOfActions"];

        // Create extended trigger's additional properties.
        entity.pm["totalNumOfActions"] = 9;
        entity.pm["additionalActions"] = new Array();
        entity.pm["additionalParamA"] = new Array();
        entity.pm["additionalParamB"] = new Array();

        let currentTrigger = entity;

        // Iterate through the linked list, pointed by the 10th trigger action.
        let nextTriggerIndex = es.findIndex(e => 
            (e.pm["uid"] === currentTrigger.pm["actions_10_targetA"]) && 
            (
                (currentTrigger.pm["actions_10_type"] == switchExecutionAction) || // Backwards compatibility
                (currentTrigger.pm["actions_10_type"] == executeTriggerAction)     // Current system
            )
        )
        while(nextTriggerIndex !== -1){
            let nextTrigger = es[nextTriggerIndex];

            // Retrieve all trigger actions.
            for(let i = 1; i <= 9; ++i){
                // The very first entry of additional actions and parameters belongs to action 10
                if(i === 1 && iterationCount === 1){
                    entity.pm["actions_10_type"] = nextTrigger.pm[`actions_1_type`];
                    entity.pm["actions_10_targetA"] = nextTrigger.pm[`actions_1_targetA`];
                    entity.pm["actions_10_targetB"] = nextTrigger.pm[`actions_1_targetB`];
                    continue;
                }

                entity.pm["additionalActions"].push(nextTrigger.pm[`actions_${i}_type`]);
                entity.pm["additionalParamA"].push(nextTrigger.pm[`actions_${i}_targetA`]);
                entity.pm["additionalParamB"].push(nextTrigger.pm[`actions_${i}_targetB`]);
            }

            entity.pm["totalNumOfActions"] += 9;

            // Remove those auto generated triggers
            es.splice(nextTriggerIndex, 1);

            // Continue iterating
            currentTrigger = nextTrigger;
            nextTriggerIndex = es.findIndex(e => e.pm["uid"] === currentTrigger.pm["actions_10_targetA"] && currentTrigger.pm["actions_10_type"] === switchExecutionAction);

            // Protect users from potential infinite iteration.
            iterationCount++;
            if(iterationCount > maxIteration){
                aleiLog(note_bad, "When parsing extended triggers, potentially reached an infinite loop.");
                break;
            }
        }

        // Shrink extended trigger to previously saved size if the last few trigger actions is empty.
        if(previousTotalNumOfActions){
            const doNothingTriggerAction = -1;
            let isAllEmpty = true;

            for(let i = previousTotalNumOfActions + 1; i < entity.pm["totalNumOfActions"]; i++){
                if(entity.pm["additionalActions"][i - 11] != doNothingTriggerAction){
                    isAllEmpty = false;
                    break;
                }
            }

            // Shrink the trigger action.
            if(isAllEmpty){
                let difference = entity.pm["totalNumOfActions"] - previousTotalNumOfActions;
                entity.pm["additionalActions"].length -= difference;
                entity.pm["additionalParamA"].length -= difference;
                entity.pm["additionalParamB"].length -= difference;
                entity.pm["totalNumOfActions"] = previousTotalNumOfActions;
            }
        }
    }
}

function patchRender() {
    // This is where Render will be patched.
    // Due to nature of this function, maybe it'll be better to call this function each time a patch is needed.
    // And to support that, this function will strictly work on ALE_Render than current Render
    if(aleiSettings.customRenderer) {
        Renderer_initialize();
        return;
    };
    if(THEME != 4) return;
    // We should only patch for black theme, because setting render makes things lag for no apparent reason.

    let fn = ALE_Render.toString();
    fn = fn.replaceAll("for ( property", "for ( let property");

    // Noname & Xeden's black theme
    let GridColor = "#222222";
    let GridLineColor = "#FFFFFF50";

    fn = fn.replace("if ( THEME === THEME_BLUE )", `if (THEME === 4) ctx.fillStyle = '${GridColor}';\n else if (THEME === THEME_BLUE)`);
    fn = fn.replace("if ( THEME !== THEME_DARK )", `if (THEME === 4) ctx.fillStyle = '${GridLineColor}';\n else if (THEME !== THEME_DARK)`);

    window.Render = eval(`(${fn})`);
}

function patchStartNewMap() {
    // necessary cuz of patching via direct code replacement
    window.initializeALEIMapData = initializeALEIMapData;
    window.clearOCM = clearOCM;
    window.clearUIDMap = clearUIDMap;
    window.clearParameterMap = clearParameterMap;
    window.clearSelectedObjects = clearSelectedObjects;

    const oldCode = window.StartNewMap.toString();

    let newCode = oldCode.replace("ClearUndos();", "ClearUndos(); initializeALEIMapData(); clearOCM(); clearUIDMap(); clearParameterMap(); clearSelectedObjects();");
    if (newCode === oldCode) {
        aleiLog(logLevel.WARN, "StartNewMap direct code replacement failed");
    }

    window.StartNewMap = eval("(" + newCode + ")");
}

function fixCharEscapingInCompiObj() {
    const oldCode = window.compi_obj.toString();
    const newCode = oldCode.replace(
        /(?<=if\s*\(\s*typeof\s*\(?\s*pars\s*\)?\s*==\s*'?\w+'?\s*\)\s*\{).*?(?=\})/s, 
        `
        pars = pars.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
        pars = pars.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        `
    );
    if (oldCode === newCode) {
        aleiLog(logLevel.WARN, "compi_obj direct code replacement failed");
    }

    window.compi_obj = eval(`(${newCode})`);
}

let alreadyStarted = false;
let ALE_start = (async function() {
    if(alreadyStarted) return;
    alreadyStarted = true;
    'use strict';

    VAL_TABLE = special_values_table;
    ROOT_ELEMENT = document.documentElement;
    stylesheets = document.styleSheets;
    ALE_Render = Render;

    // Handling rest of things
    addPropertyPanelResize();
    addObjBoxResize();

    patchServerRequest();

    // style sheets and theme stuff
    fixWebpackStyleSheets();
    replaceThemeSet();
    patchSaveBrowserSettings();
    initTheme();

    updateStyles();
    updateRegionActivations();
    updateSkins();
    updateSounds();
    updateVoicePresets();
    updateParameters();
    updateOffsets();
    updateObjects();

    if (aleiSettings.html5Mode) {
        activateHTML5Mode();
        setTimeout(() => {
            NewNote("Note: HTML5 mode is enabled. Features and options that aren't available on the HTML5 port have been disabled.", "#FFFF00");
        }, 2000);
    }

    // needs to be after updateObjects and activateHTML5Mode
    patchTriggerActionList();
    patchMaskTriggerActions();

    patchTopPanel();
    addTopButton("Download XML", exportXML);
    addTopButton("Insert XML", insertXMLUserInput);
    addTopButton("ALEI Settings", showSettings);

    patch_m_down();
    addSessionSync();
    addTriggerIDs();
    patchShowHideButton();
    optimize();
    patchUpdateTools();
    patchDecorUpload();
    patchEntityClass();
    patchEvalSet();
    // Allowing for spaces in parameters.
    patchUpdatePhysicalParam();
    window.PasteFromClipBoard = PasteFromClipBoard;
    // Tooltip.
    if(aleiSettings.enableTooltips) {
        doTooltip();
    }
    if (aleiSettings.extendedTriggers && !html5ModeActive) { // !html5ModeActive because extended triggers use switch execution
        extendTriggerList();
        window.ExtendedTriggersLoaded = true;
    }
    patchParamsGUI();
    patchTeamList();
    patchRandomizeName();
    patchAllowedCharacters();
    addProjectileModels();
    patchSpecialValue();
    UpdateTools();
    patchPercentageTool();
    createClipboardDiv();
    addPasteFromPermanentClipboard();

    patchForInteractableTriggerActions();
    registerClipboardItemAction();

    addUndoRedoErrorReporting();
    patchDrawGrid();
    addFunctionToWindow();
    createALEISettingsMenu();

    aleimapdatapatches.patchSaveThisMap();
    
    patchStartNewMap();

    // register param side buttons
    registerCommentAdderButton();
    registerCommentRemoverButton();
    registerOpenInColorEditorButton();

    if(isNative && !GM_info.script.name.includes("Local")) {
        checkForUpdates();
    }
    changeTopRightText();

    aleiLog(logLevel.VERBOSE, "Settings: " + JSON.stringify(aleiSettings));

    // update stuff for render object names setting
    window.ENABLE_TEXT = aleiSettings.renderObjectNames;
    window.need_redraw = true;
    window.UpdateTools();


    let ALE_PreviewQualitySet = window.PreviewQualitySet;
    window.PreviewQualitySet = (val) => {
        ALE_PreviewQualitySet(val);
        writeStorage("ALEI_PreviewQualitySet", val);
    };

    window.PreviewQualitySet(
        readStorage(
            "ALEI_PreviewQualitySet",
            false,
            (val) => val === "true")
    );

    patchRender();
    patchFindErrorsButton();
    fixCharEscapingInCompiObj();

    // load map again if map was already loaded but not successfully (in terms of alei)
    // map load is unsuccessful if it happens before alei is initialized
    // alei enters a bugged state if map load is unsuccessful
    if (es.length > 0) {
        aleiLog(logLevel.DEBUG, "Map was loaded unsuccessfully. Doing it again");
        
        // this is most of the stuff from StartNewMap (except setting mapid and calling ResetView)
        es = [];
        changes_made = false;
        need_redraw = true;
        need_GUIParams_update = true;
        ClearUndos();
        initializeALEIMapData();
        clearOCM();
        clearUIDMap();
        clearParameterMap();
        
        LoadThisMap();
    }

    NewNote("ALEI: Welcome!", "#7777FF");
    NewNote(`Don't forget to join discord server! discord.gg/vKgDbVTE2V`, "#7777FF");
    aleiLog(logLevel.INFO, `Welcome!`);
    if(isNative) {
        aleiLog(logLevel.INFO, `TamperMonkey Version: ${GM_info.version} ALEI Version: ${GM_info.script.version}`);
    } else {
        let message = "You are running ALEI not under tampermonkey, this is not native ALEI, please load ALEI by tampermonkey when possible.";
        NewNote(`ALEI: ${message}`, "#FFFF00");
        NewNote(`ALEI: Check https://github.com/Molisson/ALEI for more details.`, "#FFFF00");
        aleiLog(logLevel.INFO, message);
        NewNote(`ALEI: Reminder that ALEI under tampermonkey is bound to break less than without.`, "#FFFFFF");
    }

    // Recheck in the future
    setTimeout( recheckDecors, 1000 );
});

function recheckDecors() {
    // A buggy fix, but will do for now

    // In the case of Tampermonkey screwing up...
    for ( const decor of decors_to_change ) {
        // Compare the URL.

        let decor_model                       = decor[0];
        let decor_change_image                = decor[1];

        if ( img_decors[decor_model].src !== decor_change_image ) {
            // Damn it, looks like that bug has appeared, no problem.
            // Just fix this real quick
            console.warn( `${decor_model} does not have the right image, attempting to fix...` );
            img_decors[decor_model].src = decor_change_image;
            img_decors[decor_model].native        = true;
            CACHED_DECORS[decor_model]            = img_decors[decor_model];
            CUSTOM_IMAGES_APPROVED[decor_model]   = true; // Since it's obviously vanilla, and other vanilla decors are approved, it's only natural if we approve added decors too
        }
    }
};

if(isNative) document.addEventListener("DOMContentLoaded", () => ALE_start());
else ALE_start();

// Set this into the future.
// setTimeout( recheckDecors, 1000 );

console.log("ALEI!");
