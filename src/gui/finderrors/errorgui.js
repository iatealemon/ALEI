import { SelectedObjects, clearSelectedObjects } from "../../entity/entity.js";

import { requirementsData } from "./errorcheck.js";

const windowTitle = "Find errors result";

/**
 * @param {Object<string, boolean>} requirementsStatus 
 * @param {Map<E, Set<string>>} errors 
 * @param {Map<E, Set<string>>} numericalRefs 
 */
export function displayErrorCheckGUI(requirementsStatus, errors, numericalRefs) {
    const unfilledRequirementCount = Object.values(requirementsStatus).filter(value => value === false).length;
    const errorCount = errors.values().reduce((accumulator, set) => accumulator + set.size, 0);
    const numericalRefCount = numericalRefs.values().reduce((accumulator, set) => accumulator + set.size, 0);
    const hasUnfilledRequirement = unfilledRequirementCount > 0;
    const hasError = errorCount > 0;
    const hasNumericalRef = numericalRefCount > 0;

    const emptyParamsTableHTML = `
        <table class="params-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Parameter</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    const draggableWindow = document.createElement("draggable-window");
    draggableWindow.setAttribute("data-title", windowTitle);
    draggableWindow.style.left = "500px";
    draggableWindow.style.top = "300px";
    draggableWindow.setDimensions(500, 400);
    draggableWindow.insertAdjacentHTML("beforeend", `
        <div slot="content">
            <div class="tab-view-container">
                <div class="tablist">
                    <div class="tab-label" data-tab="requirements">
                        <div class="tab-label-text">
                            <div class="tab-label-icon-container">
                                <span class="${hasUnfilledRequirement ? "error-icon" : "checkmark-icon"}"></span>
                            </div>
                            Requirements
                        </div>
                        <span class="tab-label-info">${unfilledRequirementCount}</span>
                    </div>
                    <div class="tab-label" data-tab="errors">
                        <div class="tab-label-text">
                            <div class="tab-label-icon-container">
                                <span class="${hasError ? "error-icon" : "checkmark-icon"}"></span>
                            </div>
                            Errors
                        </div>
                        <span class="tab-label-info">${errorCount}</span>
                    </div>
                    <div class="tab-label" data-tab="numerical-refs">
                        <div class="tab-label-text">
                            <div class="tab-label-icon-container">
                                <span class="${hasNumericalRef ? "warning-icon" : "checkmark-icon"}"></span>
                            </div>
                            Numerical references
                        </div>
                        <span class="tab-label-info">${numericalRefCount}</span>
                    </div>
                </div>
                <div class="tabpanel">
                    <div class="requirements-tab hidden-tab">
                        <span class="tab-text">These are the requirements for the map to be playable.</span>
                        <div>${getRequirementTextsHTML(requirementsStatus)}</div>
                    </div>
                    <div class="errors-tab hidden-tab">
                        <span class="tab-text">These are all the <span class="error" style="font-size: 12px">ERROR!</span>'s on the map.</span>
                        ${hasError ? emptyParamsTableHTML : `<span class="tab-text">(no errors to show)</span>`}
                    </div>
                    <div class="numrefs-tab hidden-tab">
                        <span class="tab-text">
                            These are all the numerical references on the map.
                            <span class="more-info" title="A numerical reference is when a parameter refers to an object using its number id instead of its uid (name). Numerical references aren't necessarily errors but they can cause bugs that are hard to find."></span>
                        </span>
                        ${hasNumericalRef ? emptyParamsTableHTML : `<span class="tab-text">(no numerical references to show)</span>`}
                    </div>
                </div>
            </div>
        </div>
    `);

    const slottedContent = draggableWindow.querySelector(`div[slot="content"]`);

    const tabs = {
        requirements: {
            label: slottedContent.querySelector(`.tab-label[data-tab="requirements"]`),
            tab: slottedContent.querySelector(".requirements-tab")
        },
        errors: {
            label: slottedContent.querySelector(`.tab-label[data-tab="errors"]`),
            tab: slottedContent.querySelector(".errors-tab")
        },
        numericalRefs: {
            label: slottedContent.querySelector(`.tab-label[data-tab="numerical-refs"]`),
            tab: slottedContent.querySelector(".numrefs-tab")
        },
    };

    let selectedTab = null
    if (hasUnfilledRequirement) selectedTab = "requirements";
    else if (hasError)          selectedTab = "errors";
    else if (hasNumericalRef)   selectedTab = "numericalRefs";

    function selectTab(id) {
        tabs[id].label.classList.add("tab-label--selected");
        tabs[id].tab.classList.remove("hidden-tab");
    }

    function unselectTab(id) {
        tabs[id].label.classList.remove("tab-label--selected");
        tabs[id].tab.classList.add("hidden-tab");
    }

    if (selectedTab !== null) selectTab(selectedTab);

    function switchSelectedTab(id) {
        if (selectedTab !== null) unselectTab(selectedTab);
        selectTab(id);
        selectedTab = id;
    }

    tabs.requirements.label?.addEventListener("click", () => switchSelectedTab("requirements"));
    tabs.errors.label?.addEventListener("click", () => switchSelectedTab("errors"));
    tabs.numericalRefs.label?.addEventListener("click", () => switchSelectedTab("numericalRefs"));

    
    tabs.numericalRefs.tab?.querySelector(".more-info")?.addEventListener("dblclick", (event) => alert(event.currentTarget.title));


    function highlightParamElement(element) {
        if (!element.classList.contains("highlighted-param")) {
            element.classList.add("highlighted-param");

            element.addEventListener("animationend", () => {
                element.classList.remove("highlighted-param");
            }, { once: true });
        }
    }

    function rowClicked(entity, paramName) {
        const selected = SelectedObjects.slice();
        clearSelectedObjects();

        selected.forEach(entity => entity.selected = false);
        entity.selected = true;

        need_redraw = true;

        UpdateGUIParams();

        const paramElement = document.getElementById(`pm_${paramName}`);
        if (paramElement !== null) {
            const parent = paramElement.parentElement;
            parent.scrollIntoView({ behavior: "instant", block: "center" });
            highlightParamElement(parent);
        }
    }

    function addCell(row, text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
    }

    function initializeParamsTable(table, paramsMap) {
        const tbody = table.querySelector("tbody");
        for (const { entity, paramName, displayedEntityName, displayedParamName, paramValue } of generateParamsTableRowData(paramsMap)) {
            const tr = document.createElement("tr");
            addCell(tr, displayedEntityName);
            addCell(tr, displayedParamName);
            addCell(tr, paramValue);
            tr.addEventListener("click", () => rowClicked(entity, paramName));
            tbody.appendChild(tr);
        }
    }

    const errorsTable = tabs.errors.tab.querySelector(".params-table");
    if (errorsTable !== null) initializeParamsTable(errorsTable, errors);

    const numrefsTable = tabs.numericalRefs.tab.querySelector(".params-table");
    if (numrefsTable !== null) initializeParamsTable(numrefsTable, numericalRefs);

    document.body.appendChild(draggableWindow);
}

/**
 * @param {Object<string, boolean>} requirementsStatus 
 * @returns {string}
 */
function getRequirementTextsHTML(requirementsStatus) {
    return Object.entries(requirementsStatus)
        .map(([name, status]) => {
            const desc = requirementsData[name].description;
            return `<div class="requirement-text">${desc}<span class="${status ? "checkmark-icon" : "error-icon"}"></span></div>`;
        })
        .join("");
}

function* generateParamsTableRowData(paramsMap) {
    const triggerActionParamsRegex = /^actions_(\d+)_(type|targetA|targetB)$/;

    function getEntityName(entity) {
        if (entity.pm.uid !== undefined) {
            return entity.pm.uid;
        }
        let title = known_class2known_class_title(entity._class);
        return title.charAt(0).toUpperCase() + title.slice(1);
    }

    function getDisplayedParamName(entity, paramName) {
        const match = paramName.match(triggerActionParamsRegex);
        if (match !== null) {
            const actionNum = match[1];
            const lastPart = {
                type: "Type",
                targetA: "A",
                targetB: "B"
            }[match[2]];
            return `Act. ${actionNum} ${lastPart}`;
        }
        else {
            const paramIndex = FindMachingParameterID(paramName, entity._class);
            if (paramIndex === -1) return paramName;
            return param_type[paramIndex][2];
        }
    }

    function getParamValue(entity, paramName) {
        if (entity.pm[paramName] !== undefined) {
            return entity.pm[paramName];
        }

        const match = paramName.match(triggerActionParamsRegex);
        if (match === null) return undefined;

        const actionNum = Number(match[1]);

        const arrayName = {
            type: "additionalActions",
            targetA: "additionalParamA",
            targetB: "additionalParamB"
        }[match[2]];

        return entity.pm[arrayName]?.[actionNum - 11] ?? undefined;
    }

    for (const [entity, params] of paramsMap) {
        const displayedEntityName = getEntityName(entity);
        for (const paramName of params) {
            const displayedParamName = getDisplayedParamName(entity, paramName);
            const paramValue = getParamValue(entity, paramName);
            yield { entity, paramName, displayedEntityName, displayedParamName, paramValue };
        }
    }
}