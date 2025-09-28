import { aleiLog, logLevel } from "./log.js";

// const html5TriggerActions = new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,53,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,279,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341]);
// const html5Weapons = new Set(["gun_rifle","gun_rifle_b","gun_pistol","gun_pistol_b","gun_pistol2","gun_vehgun","gun_gl","gun_rl","gun_railgun","gun_railgun2","gun_shotgun","gun_shotgun_b","gun_apistol","gun_arifle","gun_arifle2","gun_vehcannon","gun_defibrillator","gun_bfg","gun_raygun","gun_rayrifle","gun_vehminigun","gun_vehminigl","gun_real_shotgun","gun_real_rifle","gun_oicw","gun_plasmagun","gun_minigun","gun_vgun","gun_sniper","item_grenade","item_port","item_shield","gun_sp_sh","gun_glock","gun_m4a1","gun_pixel_rifle","gun_pixel_rl","gun_fttp_vehgun","gun_invisgun","gun_sharkgun","gun_rl0"]);
const html5Voices = new Set(["mute","marine","cs","ghost","usurpation","usurpation_destroyer","android","hum_droid","proxy","proxy_helmetless","silk","noir_lime","grub","falkok","falkok_phoenix","star_defender","mine_droid","reakhohsha","hexagon","civilian_male","vulture","crossfire_sentinel"]);
const html5Sounds = new Set(["am_base","am_wind","android_die","android_die_1","android_enemy_down1","android_hurt","android_miner_die","android_miner_enemy_down","android_miner_hurt","android_miner_welcome2","android_welcome","android_welcome1","android_welcome2","android_welcome3","android2_die","android2_hurt","android2_welcome2","badge_earned","barrel","barrel2","beam1","beam1_recharge","beam1_rechargeB","beam5","beam5_recharge","beam5_rechargeB","explode_bfg","sou_blade_swing1","sou_blade_swing2","sou_blade_swing3","blood_body","blood_body2","blood_head","blood_head2","blood_hit","blood_hit_sword","blood_leg_arm","body_fall","body0","body1","body2","body3","bounce_bullet","box_die","box_hor","box_ver1","box_ver2","box_ver3","capsule_hit1","capsule_hit2","charged_explosion","chat","civilian_male_celebrate1","civilian_male_celebrate2","civilian_male_death1","civilian_male_death2","civilian_male_dying1","civilian_male_dying2","civilian_male_hurt1","civilian_male_hurt2","civilian_male_hurt3","civilian_male_hurt4","civilian_male_welcome1","civilian_male_welcome2","civilian_male_welcome3","coolbuddy2","coop_defeat","coop_draw","coop_time_warning","coop_victory","corvett_die","crossfire_sentinel_celebrate1","crossfire_sentinel_celebrate2","crossfire_sentinel_death1","crossfire_sentinel_death2","crossfire_sentinel_death3","crossfire_sentinel_dying","crossfire_sentinel_hurt1","crossfire_sentinel_hurt2","crossfire_sentinel_hurt3","crossfire_sentinel_welcome1","crossfire_sentinel_welcome2","crossfire_sentinel_welcome3","dart4","wea_ditzy_cs_ik","wea_ditzy_cs_ik2","drone_die","drone_hurt","enemy_alert","enemy_die_1","enemy_die_2","enemy_die_3","enemy_die_4","enemy_die1","enemy_hurt_1","enemy_hurt_2","enemy_hurt_3","enemy_hurt1","exp_event_stop","exp_level","exp_tick","explode_underwater","explode1","explode2","f_death1","f_death2","f_death3","f_pain2","f_pain3","f_pain4","f_welcome1","fail_shot","fp_death1","fp_death2","fp_death3","fp_pain2","fp_pain3","fp_pain4","fp_welcome1","g_death1","g_death2","g_death3","g_pain1","g_pain2","g_pain3","g_welcome1","glass1","glass2","gravitator2","grenade","grenade_act","wea_gl","grenade_wet","s_gun_rayrifle","helm_proxy_alert_over_hereB","helm_proxy_alert_take_coverB","helm_proxy_alert_up_thereA","helm_proxy_death3","helm_proxy_death4","helm_proxy_death5","helm_proxy_death6","helm_proxy_dyingC","helm_proxy_dyingF","helm_proxy_enemy_down_fantasticA","helm_proxy_enemy_down_got_oneD","helm_proxy_enemy_down_niceA","helm_proxy_enemy_down_niceC","helm_proxy_hurt11","helm_proxy_hurt12","helm_proxy_hurt13","helm_proxy_hurt14","helm_proxy_hurt15","helm_proxy_hurt17","helm_proxy_hurt4","helm_proxy_hurt5","helm_proxy_hurt8","helm_proxy_hurt9","hero_death1","hero_death2","hero_pain1","hero_pain2","hero_pain3","hero_pain4","hero_welcome1","hero_welcome2","hero_welcome3","hexagon_death1","hexagon_death2","hexagon_pain1","hexagon_pain2","hexagon_pain4","hexagon_pain3","hexagon_welcome1","hexagon_welcome2","hexagon_welcome3","hint_appear","hint_disappear","hit_dmg","hit_dmg2","hit_dmg3","hit_frag","s_info","s_info_act","s_info_off","gameplay_song","last_teleport","marine_alert","marine_alert2","marine_alert3","marine_alert4","marine_death1","marine_death2","marine_death3","marine_dying","marine_hurt1","marine_hurt2","marine_hurt3","metal_gib","metal_hit","metal_hor","metal_ver1","metal_ver2","metal_ver3","mission_done","wea_moonhawk_smg2","nade_throw","noir_die","noir_hurt1","noir_hurt2","main_song","plasma_explosion","portnade_act2","portnade_explode","proxy_alert_over_hereB","proxy_alert_take_coverB","proxy_alert_up_thereA","proxy_death3","proxy_death4","proxy_death5","proxy_death6","proxy_dyingC","proxy_dyingF","proxy_enemy_down_fantasticA","proxy_enemy_down_got_oneD","proxy_enemy_down_niceA","proxy_enemy_down_niceC","proxy_hurt11","proxy_hurt12","proxy_hurt13","proxy_hurt14","proxy_hurt15","proxy_hurt17","proxy_hurt4","proxy_hurt5","proxy_hurt8","proxy_hurt9","wea_railgun","reakhohsha_death3","reakhohsha_hurt1","reakhohsha_hurt2","reakhohsha_hurt3","reakhohsha_welcome1","reakhohsha_welcome2","rl_reload","robo_bug_hit","robo_bug_jump","robo_bug_launch","robo_step1","robo_step2","robo_step3","robo_step4","wea_rocket_launch","reload","sd_death","sd_hurt1","sd_hurt2","sd_welcome2","ship_explosion","ship_incoming","shnade_act","shnade_explode","shnade_hit","shnade_hit_low","shnade_offline","silenced","silk_alert_contactA","silk_alert_i_see_oneA","silk_alert_there_is_oneA","silk_death1B","silk_death2B","silk_dyingB","silk_enemy_down_brilliantC","silk_enemy_down_eliminatedB","silk_enemy_down_hell_yeahB","silk_enemy_down_ive_got_oneB","silk_enemy_down_minus_oneB","silk_enemy_down_no_kicking_for_youB","silk_hurt1B","silk_hurt2B","silk_hurt5","silk_hurt6","slicer_alert","slicer_die","slow_down","slow_up","steel_hard","steel_hor","steel_low","steel_med","step1","step2","step3","step4","t_door1_start","t_door1_stop","t_switch_denied","t_switch1","t_switch2","team_switch","teleport_spawn","test_sound","usurpation_alert","usurpation_death2","usurpation_death3","usurpation_dying","usurpation_hurt","wea_vehcannon","vulture_celebrate1","vulture_celebrate2","vulture_celebrate3","vulture_death1","vulture_death2","vulture_dying","vulture_hurt1","vulture_hurt2","vulture_hurt3","vulture_hurt4","vulture_welcome1","vulture_welcome2","vulture_welcome3","walker_die","walker_phase1","walker_phase2","walker_step","warmup","warmup_ping","water_splash1","water_splash2","water_splash3","wea_acid_gl3","wea_alien_rail_sg","wea_android_railgun","wea_android_shotgun","wea_android_sniper","wea_apistol","wea_auto_sg2","wea_bison","wea_crossfire2","wea_darkstar_rl3","wea_defibrillator","wea_ditzy_energy_rifle","wea_energy","wea_evil_shot","wea_glhf","wea_impulse","wea_incompetence_archetype_27xx_fire","wea_lazyrain_gravy_rl","wea_lmg","wea_m202","wea_mingun","wea_mingun2","wea_moonhawk_railgun","wea_plasmagun","wea_ph01","wea_phanx","wea_pistol","wea_pistol2","wea_plasma_shotgun","wea_plasma_smg","wea_rail_alt","wea_rail_alt2","wea_rail_toxic2","wea_real_rifle","wea_real_shotgun","wea_real_shotgun_r","wea_revolver5","wea_rifle","wea_rifle_alt","wea_rifle_nade","wea_roxxar_rifle","wea_shotgun","wea_shotgun_alt","wea_sniper","wea_thetoppestkek_shotgun_nxs25","wea_vehminigun","wea1","wea2","wea_pickup","hp_dead","hp_warn"]);
const charExistsInHTML5 = (id) => id <= 150;

export let html5ModeActive = false;
export let aleiExtendedTriggerActionLimit = 100;

export function activateHTML5Mode() {
    // downgradeTriggerActionsToHTML5();
    // downgradeWeaponsToHTML5();
    downgradeVoicesToHTML5();
    downgradeSoundsToHTML5();
    downgradeCharsToHTML5();
    // downgradeRegionsToHTML5();
    // downgradeParametersToHTML5();
    upgradeSoundsToHTML5();
    html5ModeActive = true;
    aleiExtendedTriggerActionLimit = 100;
    aleiLog(logLevel.INFO, `HTML5 mode active`);
}

/* function downgradeTriggerActionsToHTML5() {
    let count = 0;
    // loop each trigger action that exists in alei
    for (let actionNum of Object.keys(special_values_table["trigger_type"])) {
        actionNum = parseInt(actionNum);
        if (actionNum !== -1 && !html5TriggerActions.has(actionNum)) {
            delete special_values_table["trigger_type"][actionNum]; // remove description
            delete mark_pairs[`trigger_typeA${actionNum}`]; // remove param A type
            delete mark_pairs[`trigger_typeB${actionNum}`]; // remove param B type
            delete trigger_opcode_aliases[actionNum]; // remove opcode alias
            count++;
        }
    }
    aleiLog(logLevel.INFO, `Unregistered ${count} trigger actions`);
} */

/* function downgradeWeaponsToHTML5() {
    let count = 0;
    for (const model of Object.keys(special_values_table["gun_model"])) {
        if (!html5Weapons.has(model)) {
            delete special_values_table["gun_model"][model];
            delete img_guns[model];
            count++;
        }
    }
    aleiLog(logLevel.INFO, `Unregistered ${count} weapons`);
} */

function downgradeVoicesToHTML5() {
    let count = 0;
    for (const voice of Object.keys(special_values_table["voice_preset"])) {
        if (!html5Voices.has(voice)) {
            delete special_values_table["voice_preset"][voice];
            count++;
        }
    }
    aleiLog(logLevel.INFO, `Unregistered ${count} voice presets`);
}

function downgradeSoundsToHTML5() {
    let count = 0;
    for (const sound of Object.keys(special_values_table["sound"])) {
        if (sound !== "null" && !html5Sounds.has(sound)) {
            delete special_values_table["sound"][sound];
            count++;
        }
    }
    aleiLog(logLevel.INFO, `Unregistered ${count} sounds`);
}

function downgradeCharsToHTML5() {
    let count = 0;
    for (const id of Object.keys(special_values_table["char"])) {
        if (!charExistsInHTML5(id)) {
            delete special_values_table["char"][id];
            delete img_chars_full[id];
            count++;
        }
    }
    aleiLog(logLevel.INFO, `Unregistered ${count} chars`);
}

/* function downgradeRegionsToHTML5() {
    delete special_values_table["region_activation"][17]; // remove "Actor"
    delete special_values_table["region_activation"][18]; // remove "Actor not ally to player"
    aleiLog(logLevel.INFO, `Unregistered 2 region activations`);
} */

/* function downgradeParametersToHTML5() {
    const unregisterParam = (paramName, paramClass) => {
        const index = FindMatchingParameterID(paramName, paramClass);
        if (index !== -1) param_type.splice(index, 1);
    };

    unregisterParam("execute", "trigger");
    unregisterParam("uses_timer", "region");
    unregisterParam("text", "decor");
    unregisterParam("attach", "water");

    aleiLog(logLevel.INFO, `Unregistered 1 parameter`);
} */

/** add sounds that aren't in flash */
function upgradeSoundsToHTML5() {
    special_values_table["sound"]["coop_defeat"] = "coop_defeat (HTML5 only)";
    special_values_table["sound"]["coop_draw"] = "coop_draw (HTML5 only)";
    special_values_table["sound"]["coop_time_warning"] = "coop_time_warning (HTML5 only)";
    special_values_table["sound"]["coop_victory"] = "coop_victory (HTML5 only)";
    special_values_table["sound"]["warmup"] = "warmup (HTML5 only)";
    special_values_table["sound"]["warmup_ping"] = "warmup_ping (HTML5 only)";

    aleiLog(logLevel.INFO, `Registered 6 sounds`);
}