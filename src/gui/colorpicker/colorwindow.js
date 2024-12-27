import "./elements/colorspectrum.js";
import "./elements/hueslider.js";
import { ColorTargetGroup } from "./colortarget.js";
import { hexToRGB, hsvToRGB, hslToRGB, rgbToHSV, rgbToHSL, rgbToHex } from "./colorutils.js";

let colorWindows = [];

// there needs to be a limit cuz there's a limit on how many webgl contexts can be active at the same time
const windowCountLimit = 6;

export class ColorWindow {
    static title = "Color picker";

    targetGroup;
    currentTextInputColorType = "hex";
    draggableWindow;
    targetsMenu = {};
    colorTextInputLabel;
    colorTextInput;
    colorTypeSelectIndicators = {};
    colorSpectrum;
    hueSlider;
    targetsMenuOffmenuClick;
    colorTypeMenuOffmenuClick;

    constructor(targetGroup, x, y) {
        this.targetGroup = targetGroup;
        this.draggableWindow = document.createElement("draggable-window");
        this.draggableWindow.setAttribute("data-title", ColorWindow.title);
        this.draggableWindow.style.left = `${x}px`;
        this.draggableWindow.style.top = `${y}px`;
        this.draggableWindow.addEventListener("windowclose", () => this.onWindowClosed());
        this.initContent();
    }

    initContent() {
        this.draggableWindow.insertAdjacentHTML("beforeend", `
            <div slot="content">
                <div class="color-window-top-layout">
                    <div class="color-window-top-layout__left">
                        <p class="draggable-window-text draggable-window-paragraph">Objects to affect:</p>
                        <div class="dropdown-container" data-id="targets menu">
                            <div class="dropdown-opener">
                                <div class="dropdown-item dropdown-item--small dropdown-clickable-element">
                                    <div class="dropdown-item-label">
                                        <div class="dropdown-item-label__left">
                                            <span class="dropdown-item-text dropdown-item-text--small">${this.targetGroup.title}</span>
                                        </div>
                                        <div class="dropdown-item-label__right">
                                            <span class="warning-indicator warning-indicator--hidden"></span>
                                        </div>
                                    </div>
                                    <div class="dropdown-item-control">
                                        <div class="dropdown-arrow-container dropdown-arrow-container--small">
                                            <div class="dropdown-arrow"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="dropdown dropdown--smaller">
                                <div class="dropdown-items-container"></div>
                            </div>
                        </div>
                    </div>
                    <div class="color-window-top-layout__right">
                        <div class="color-text-input-layout">
                            <div class="dropdown-container" data-id="color type menu">
                                <div class="draggable-window-text color-text-input-label">HEX:</div>
                                <div class="dropdown dropdown--small dropdown--closer">
                                    <div class="dropdown-items-container">
                                        <div class="dropdown-item dropdown-item--small dropdown-clickable-element" data-value="hex">
                                            <div class="dropdown-item-label">
                                                <div class="dropdown-item-label__left">
                                                    <span class="dropdown-item-text dropdown-item-text--small">HEX</span>
                                                    <span class="select-indicator"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="dropdown-item dropdown-item--small dropdown-clickable-element" data-value="rgb">
                                            <div class="dropdown-item-label">
                                                <div class="dropdown-item-label__left">
                                                    <span class="dropdown-item-text dropdown-item-text--small">RGB</span>
                                                    <span class="select-indicator select-indicator--hidden"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="dropdown-item dropdown-item--small dropdown-clickable-element" data-value="hsv">
                                            <div class="dropdown-item-label">
                                                <div class="dropdown-item-label__left">
                                                    <span class="dropdown-item-text dropdown-item-text--small">HSV</span>
                                                    <span class="select-indicator select-indicator--hidden"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="dropdown-item dropdown-item--small dropdown-clickable-element" data-value="hsl">
                                            <div class="dropdown-item-label">
                                                <div class="dropdown-item-label__left">
                                                    <span class="dropdown-item-text dropdown-item-text--small">HSL</span>
                                                    <span class="select-indicator select-indicator--hidden"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <input type="text" size=10 class="color-text-input" value="#808080" />
                        </div>
                    </div>
                </div>
                <div class="color-picker-container">
                    <div class="color-spectrum-container">
                        <color-spectrum data-output-format="hex" data-update-selection-on-hue-change></color-spectrum>
                    </div>
                    <hue-slider data-dot-center-shows-color></hue-slider>
                </div>
            </div>
        `);
        const slottedContent = this.draggableWindow.querySelector(`[slot="content"]`);

        this.initTargetsMenu();
        this.initColorTextInput();

        this.colorSpectrum = slottedContent.querySelector("color-spectrum");
        this.hueSlider = slottedContent.querySelector("hue-slider");

        // this is so that targets validity can be checked only once instead of constantly while dragging the color.
        // problems can occur if the user presses ctrl z while dragging the color and a target becomes invalid.
        // in order to fix this, i will assume that no one will do that
        let targetsToGiveColor = [];
        const onColorDragStart = () => {
            this.updateErrors();
            targetsToGiveColor = this.targetGroup.targets.filter((target) => target.valid);
        };
        const onColorSelected = (event) => {
            const hex = event.detail.color;
            setTargetsColor(targetsToGiveColor, hex);
            this.targetGroup.color = hex;
            this.updateColorTextInputField();
        };
        const onColorDragEnd = () => {
            need_GUIParams_update = true; // updated only when dragging ends to avoid lag spikes
        };
        this.colorSpectrum.addEventListener("dragselectstart", onColorDragStart);
        this.colorSpectrum.addEventListener("colorinput", onColorSelected);
        this.colorSpectrum.addEventListener("dragselectend", onColorDragEnd);
        this.hueSlider.addEventListener("dragselectstart", onColorDragStart);
        this.hueSlider.addEventListener("hueinput", (event) => this.colorSpectrum.setHue(event.detail.hue));
        this.hueSlider.addEventListener("dragselectend", onColorDragEnd);

        if (this.targetGroup.color !== null) {
            this.colorSpectrum.setHexColor(this.targetGroup.color);
            this.hueSlider.setSelectedHue(this.colorSpectrum.getHue());
        }
        this.updateColorTextInputField();
    }

    initTargetsMenu() {
        const slottedContent = this.draggableWindow.querySelector(`[slot="content"]`);
        const dropdownContainer = slottedContent.querySelector(`.dropdown-container[data-id="targets menu"]`);
        const opener = dropdownContainer.querySelector(".dropdown-opener");
        const openerArrow = opener.querySelector(".dropdown-arrow");
        const dropdown = dropdownContainer.querySelector(".dropdown");
        this.targetsMenu.itemsContainer = dropdown.querySelector(".dropdown-items-container");
        this.targetsMenu.labels = {};
        this.targetsMenu.warningIndicators = {};
        this.targetsMenu.openerText = opener.querySelector(".dropdown-item-text");
        this.targetsMenu.openerWarningIndicator = opener.querySelector(".warning-indicator");
        this.targetsMenu.ignoreNextOffmenuClick = false;

        for (const target of this.targetGroup.targets) {
            this.addTargetListItem(target);
        }

        const targetsMenuToggle = () => { 
            if (!dropdown.classList.contains("dropdown--visible")) {
                this.updateSelectionStateOnTargetLabels(); // update label selection colors when opening menu
            }
            openerArrow.classList.toggle("dropdown-arrow--open");
            dropdown.classList.toggle("dropdown--visible");
        };
        this.targetsMenuOffmenuClick = (event) => {
            if (dropdown.classList.contains("dropdown--visible") && !dropdownContainer.contains(event.target)) {
                if (this.targetsMenu.ignoreNextOffmenuClick) {
                    this.targetsMenu.ignoreNextOffmenuClick = false
                    return;
                }
                openerArrow.classList.remove("dropdown-arrow--open");
                dropdown.classList.remove("dropdown--visible");
            }
        };
        opener.addEventListener("click", targetsMenuToggle);
        document.addEventListener("click", this.targetsMenuOffmenuClick);
    }

    addTargetListItem(target) {
        const count = this.targetsMenu.itemsContainer.children.length;
        this.targetsMenu.itemsContainer.insertAdjacentHTML("beforeend", `
            <div class="dropdown-item dropdown-item--small" data-uid="${target.uid}">
                <div class="dropdown-item-label selectable-target-item ${target.entity.selected ? "selectable-target-item--selected" : ""}">
                    <div class="dropdown-item-label__left">
                        <span class="dropdown-item-text dropdown-item-text--small">${count+1}. ${target.name}</span>
                    </div>
                    <div class="dropdown-item-label__right">
                        <span class="warning-indicator warning-indicator--hidden"></span>
                    </div>
                </div>
                <div class="dropdown-item-control">
                    <div class="target-quick-delete-button-container">
                        <button class="target-quick-delete-button"></button> 
                    </div>
                </div>
            </div>
        `);

        const item = this.targetsMenu.itemsContainer.lastElementChild;
        const label = item.querySelector(".dropdown-item-label");
        const deleteButton = item.querySelector(".target-quick-delete-button");

        this.targetsMenu.labels[target.uid] = label;
        this.targetsMenu.warningIndicators[target.uid] = label.querySelector(".warning-indicator");

        const selectTarget = (event) => {
            if (!target.entity.exists) {
                return;
            }
            const newSelectState = !target.entity.selected
            if (!event.ctrlKey) {
                for (const entity of es) {
                    entity.selected = false;
                }
            }
            target.entity.selected = newSelectState;
            this.updateSelectionStateOnTargetLabels();
            need_redraw = true;
            need_GUIParams_update = true;
        };
        const deleteTarget = () => {
            item.remove();
            delete this.targetsMenu.labels[target.uid];
            delete this.targetsMenu.warningIndicators[target.uid];
            this.targetsMenu.ignoreNextOffmenuClick = true; // this button won't be contained in the menu anymore so it would be considered an offmenu click
            this.targetGroup.targets.splice(this.targetGroup.targets.indexOf(target), 1);
            this.targetGroup.updateCategory();
            this.targetGroup.updateTitle();
            this.targetsMenu.openerText.textContent = this.targetGroup.title;
            this.targetGroup.updateColor();
            this.updateErrors();
        };
        label.addEventListener("click", selectTarget);
        deleteButton.addEventListener("click", deleteTarget);
    }

    initColorTextInput() {
        const slottedContent = this.draggableWindow.querySelector(`[slot="content"]`);
        this.colorTextInputLabel = slottedContent.querySelector(".color-text-input-label");
        this.colorTextInput = slottedContent.querySelector(".color-text-input");
        const dropdownContainer = slottedContent.querySelector(`.dropdown-container[data-id="color type menu"]`);
        const dropdown = dropdownContainer.querySelector(".dropdown");
        this.colorTypeSelectIndicators = {};
        for (const item of dropdown.querySelectorAll(".dropdown-item")) {
            const value = item.dataset.value;
            this.colorTypeSelectIndicators[value] = item.querySelector(".select-indicator");
            item.addEventListener("click", () => {
                this.selectColorType(value);
                dropdown.classList.remove("dropdown--visible");
            });
        }

        let updateTimeout = null;

        const colorTypeMenuToggle = () => {
            dropdown.classList.toggle("dropdown--visible");
        };
        const colorTextInputValueChange = () => {
            if (updateTimeout !== null) {
                clearTimeout(updateTimeout);
                updateTimeout = null;
            }
            updateTimeout = setTimeout(() => {
                this.tryApplyColorTextInput();
                // calling UpdateGUIParams directly instead of setting need_GUIParams_update because setting letediting to true wouldn't work otherwise
                UpdateGUIParams();
                letediting = true; // UpdateGUIParams sets letediting to false
                updateTimeout = null;
            }, 50);
        };
        const colorTextInputFocus = () => {
            letediting = true;
        };
        const colorTextInputLostFocus = () => {
            if (updateTimeout !== null) {
                clearTimeout(updateTimeout);
                updateTimeout = null;
            }
            this.tryApplyColorTextInput();
            this.updateColorTextInputField();
            need_GUIParams_update = true;
            letediting = false;
        };
        this.colorTypeMenuOffmenuClick = (event) => {
            if (dropdown.classList.contains("dropdown--visible") && !dropdownContainer.contains(event.target)) {
                dropdown.classList.remove("dropdown--visible");
            }
        }
        this.colorTextInputLabel.addEventListener("click", colorTypeMenuToggle);
        this.colorTextInput.addEventListener("input", colorTextInputValueChange);
        this.colorTextInput.addEventListener("focus", colorTextInputFocus);
        this.colorTextInput.addEventListener("blur", colorTextInputLostFocus);
        document.addEventListener("click", this.colorTypeMenuOffmenuClick);
    }

    selectColorType(type) {
        // hide previous select indicator
        this.colorTypeSelectIndicators[this.currentTextInputColorType].classList.add("select-indicator--hidden");

        // show new select indicator
        this.colorTypeSelectIndicators[type].classList.remove("select-indicator--hidden");

        this.currentTextInputColorType = type;

        // update text
        this.colorTextInputLabel.textContent = {
            hex: "HEX:",
            rgb: "RGB:",
            hsv: "HSV:",
            hsl: "HSL:",
        }[type];
        this.updateColorTextInputField();
    }

    updateColorTextInputField() {
        if (this.targetGroup.color === null) {
            if (this.targetGroup.targets.length > 0) {
                this.colorTextInput.value = "multiple";
            }
            else {
                this.colorTextInput.value = "none";
            }
            return;
        }
        let newStr = "";
        const hex = this.targetGroup.color;
        switch (this.currentTextInputColorType) {
            case "hex":
                newStr = hex;
                break;
            case "rgb":
                const rgb = hexToRGB(hex);
                newStr = `${rgb.red}, ${rgb.green}, ${rgb.blue}`
                break;
            case "hsv":
                const hsv = rgbToHSV(hexToRGB(hex));
                newStr = `${Math.round(hsv.hue)}, ${Math.round(hsv.saturation*100)}%, ${Math.round(hsv.value*100)}%`;
                break;
            case "hsl":
                const hsl = rgbToHSL(hexToRGB(hex));
                newStr = `${Math.round(hsl.hue)}, ${Math.round(hsl.saturation*100)}%, ${Math.round(hsl.lightness*100)}%`;
                break;
        }
        this.colorTextInput.value = newStr;
    }

    tryApplyColorTextInput() {
        let ret = this.readColorTextInput();
        const valid = ret.valid;
        const values = ret.values;
        if (valid) {
            let hex = undefined;
            let rgb;
            switch (this.currentTextInputColorType) {
                case "hex":
                    hex = values[0];
                    rgb = hexToRGB(values[0]);
                    break;
                case "rgb":
                    rgb = { red: values[0], green: values[1], blue: values[2] };
                    break;
                case "hsv":
                    rgb = hsvToRGB({ hue: values[0], saturation: values[1]/100, value: values[2]/100 });
                    break;
                case "hsl":
                    rgb = hslToRGB({ hue: values[0], saturation: values[1]/100, lightness: values[2]/100 });
                    break;
            }
            this.targetGroup.color = hex || rgbToHex(rgb);
            this.updateErrors(); // update validity of targets
            setTargetsColor(this.targetGroup.targets.filter((target) => target.valid), this.targetGroup.color);
            this.colorSpectrum.setRGBColor(rgb);
            this.hueSlider.setSelectedHue(this.colorSpectrum.getHue());
        }
    }

    readColorTextInput() {
        const input = this.colorTextInput.value;
        let valid = false;
        let values = null;
        switch (this.currentTextInputColorType) {
            case "hex":
                if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
                    valid = true;
                    values = [input];
                }
                break;
            case "rgb":
                let rgbMatch = input.match(/^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/);
                if (rgbMatch && rgbMatch.slice(1).every(v => v >= 0 && v <= 255)) {
                    valid = true;
                    values = rgbMatch.slice(1).map(Number);
                }
                break;
            case "hsv":
            case "hsl": // hsl has the same format as hsv
                let hsvMatch = input.match(/^(\d{1,3}(?:\.\d+)?),\s*(\d{1,3}(?:\.\d+)?)%?,\s*(\d{1,3}(?:\.\d+)?)%?$/);
                if (hsvMatch && 
                    hsvMatch[1] >= 0 && hsvMatch[1] <= 360 &&
                    hsvMatch[2] >= 0 && hsvMatch[2] <= 100 &&
                    hsvMatch[3] >= 0 && hsvMatch[3] <= 100
                ) {
                    valid = true;
                    values = [parseFloat(hsvMatch[1]), parseFloat(hsvMatch[2]), parseFloat(hsvMatch[3])];
                }
        }
        return {
            valid: valid,
            values: values,
        };
    }

    updateSelectionStateOnTargetLabels() {
        for (const target of this.targetGroup.targets) {
            const label = this.targetsMenu.labels[target.uid];
            if (target.entity.selected) {
                label.classList.add("selectable-target-item--selected");
            }
            else {
                label.classList.remove("selectable-target-item--selected");
            }
        }
    }

    onWindowClosed() {
        const index = colorWindows.indexOf(this);
        colorWindows.splice(index, 1);
        document.removeEventListener("click", this.targetsMenuOffmenuClick);
        document.removeEventListener("click", this.colorTypeMenuOffmenuClick);
    }

    updateErrors() {
        this.targetGroup.updateErrors();
        this.targetsMenu.openerWarningIndicator.classList.toggle("warning-indicator--hidden", !this.targetGroup.hasError);
        this.targetsMenu.openerWarningIndicator.title = this.targetGroup.hasError ? this.targetGroup.collectiveErrorMessage : "";
        for (const target of this.targetGroup.targets) {
            const warningIndicator = this.targetsMenu.warningIndicators[target.uid];
            warningIndicator.classList.toggle("warning-indicator--hidden", target.valid);
            warningIndicator.title = !target.valid ? target.errorMessage : "";
        }
    }

    addToPage() {
        document.body.appendChild(this.draggableWindow);
    }
}

export function makeNewColorWindow(newTargetGroup) {
    if (colorWindows.length < windowCountLimit) {
        if (newTargetGroup === null) {
            newTargetGroup = new ColorTargetGroup();
        }
        const newWindow = new ColorWindow(newTargetGroup, 200, 200);
        newWindow.addToPage();
        colorWindows.push(newWindow);
    }
    else {
        NewNote(`New color tool window wasn't created because maximum (${windowCountLimit}) has been reached.`, note_bad);
    }
}

function setTargetsColor(targets, hex) {
    for (const target of targets) {
        target.setColorValue(hex);
        if (target.entity._class == "bg") {
            need_redraw = true;
        }
    }
}

(function setConsoleStuff() {
    unsafeWindow.colorWindows = colorWindows;
})()