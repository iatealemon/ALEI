/*
create a new hsv color spectrum by using the color-spectrum html tag.
set the size using a container element with a set size.
public methods: getHue, setHue, getRGBColor, setRGBColor, getHexColor, setHexColor
optional attributes:
- data-output-format: set the output format for colorinput event (rgb/hex)
- data-hide-dot: hide the selection dot
- data-transparent-dot: make the selection dot transparent
- data-update-selection-on-hue-change: update selected color when the setHue method is called
styling can be changed using these css variables:
- --border-radius
- --dot-border-color
- --dot-diameter
- --dot-border-width
events: dragselectstart, colorinput (has detail.color), dragselectend
*/

import { ColorSpectrumGLHandler } from "./gl/colorspectrumgl.js";
import { rgbToHex, hexToRGB, hueFromRGB, rgbToHSV } from "../colorutils.js";

const colorSpectrumTemplate = document.createElement("template");
colorSpectrumTemplate.innerHTML = `
    <style>
        :host {
            --border-radius: 0;
            --dot-border-color: #fff;
            --dot-diameter: 10px;
            --dot-border-width: 2px;
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        canvas {
            display: block;
            width: 100%;
            height: 100%;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            border-radius: var(--border-radius);
        }

        .selection-dot {
            position: absolute;
            display: block;
            width: var(--dot-diameter);
            height: var(--dot-diameter);
            border: var(--dot-border-width) solid var(--dot-border-color);
            border-radius: 50%;
            pointer-events: none;
        }

        .selection-dot--hidden {
            display: none;
        }
    </style>

    <canvas>WebGL is not supported in your browser.</canvas>
    <div class="selection-dot"></div>
`;

class ColorSpectrum extends HTMLElement {
    canvas;
    selectionDot;
    glHandler;
    selectedColor = { red: 128, green: 128, blue: 128 };
    hue;
    currentX = 0;
    currentY = 0;
    dragged = false;
    outputFormat = "rgb";
    hideDot = false;
    transparentDot = false;
    updateSelectionOnHueChange = false;
    documentMouseMoveBound;
    documentMouseUpBound;
    resizeObserver;

    static observedAttributes = ["data-output-format", "data-hide-dot", "data-transparent-dot", "data-update-selection-on-hue-change"];

    constructor() {
        super();

        this.hue = hueFromRGB(this.selectedColor);

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(colorSpectrumTemplate.content.cloneNode(true));

        this.canvas = this.shadowRoot.querySelector("canvas");
        this.selectionDot = this.shadowRoot.querySelector(".selection-dot");
        
        this.glHandler = new ColorSpectrumGLHandler(this.canvas);

        this.canvas.addEventListener("mousedown", (event) => this.canvasMouseDown(event));
        this.documentMouseMoveBound = this.documentMouseMove.bind(this);
        this.documentMouseUpBound = this.documentMouseUp.bind(this);

        this.resizeObserver = new ResizeObserver(() => {
            this.updateCurrentPosition();
            this.updateSelectionDot();
        });
    }

    connectedCallback() {
        document.addEventListener("mousemove", this.documentMouseMoveBound);
        document.addEventListener("mouseup", this.documentMouseUpBound);

        this.resizeObserver.observe(this);
        this.resizeObserver.observe(this.selectionDot, { box: "border-box" });

        this.redraw();
        this.updateCurrentPosition();
        this.updateSelectionDot();
    }

    disconnectedCallback() {
        document.removeEventListener("mousemove", this.documentMouseMoveBound);
        document.removeEventListener("mouseup", this.documentMouseUpBound);

        this.resizeObserver.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "data-output-format":
                this.outputFormat = newValue || "rgb";
                break;
            case "data-hide-dot":
                this.hideDot = this.hasAttribute("data-hide-dot");
                if (this.hideDot) {
                    this.selectionDot.classList.add("selection-dot--hidden");
                }
                else {
                    this.selectionDot.classList.remove("selection-dot--hidden");
                }
                break;
            case "data-transparent-dot": 
                this.transparentDot = this.hasAttribute("data-transparent-dot");
                if (this.transparentDot) {
                    this.selectionDot.style.backgroundColor = "transparent";
                }
                else {
                    this.updateSelectionDot();
                }
            case "data-update-selection-on-hue-change":
                this.updateSelectionOnHueChange = this.hasAttribute("data-update-selection-on-hue-change");
                break;
        }
    }

    canvasMouseDown(event) {
        if (event.button === 0) {
            this.dragged = true;
            this.dispatchEvent(new Event("dragselectstart", {
                bubbles: true,
                composed: true
            }));
            this.currentX = event.offsetX;
            this.currentY = event.offsetY;
            this.updateSelectedColor();
        }
    }

    documentMouseMove(event) {
        if (this.dragged) {
            const rect = this.canvas.getBoundingClientRect();
    
            // relative to element
            let relativeX = event.clientX - rect.left;
            let relativeY = event.clientY - rect.top;
    
            // clamp to element bounds
            const minX = 0;
            const maxX = this.canvas.clientWidth - 1;
            const minY = 0;
            const maxY = this.canvas.clientHeight - 1;
            relativeX = Math.max(minX, Math.min(relativeX, maxX));
            relativeY = Math.max(minY, Math.min(relativeY, maxY));
            
            // relativeX/Y is now the mouse position relative to the canvas clamped to the canvas bounds
    
            //console.log(relativeX, relativeY);
    
            this.currentX = relativeX;
            this.currentY = relativeY;

            this.updateSelectedColor();
        }
    }

    documentMouseUp(event) {
        if (event.button === 0 && this.dragged) {
            this.dragged = false;
            this.dispatchEvent(new Event("dragselectend", {
                bubbles: true,
                composed: true
            }));
        }
    }

    updateSelectedColor() {
        const rgb = this.glHandler.readPixelRGB(this.currentX, this.currentY);
        this.selectedColor.red = rgb.red;
        this.selectedColor.green = rgb.green;
        this.selectedColor.blue = rgb.blue;

        let outputColor;
        switch (this.outputFormat) {
            case "rgb":
                outputColor = this.getRGBColor();
                break;
            case "hex":
                outputColor = this.getHexColor();
                break;
            default:
                outputColor = undefined;
                break;
        }
        this.dispatchEvent(new CustomEvent("colorinput", {
            detail: { color: outputColor },
            bubbles: true,
            composed: true
        }));

        // set selection dot position and color
        this.updateSelectionDot();
    }

    updateSelectionDot() {
        this.selectionDot.style.left = this.currentX - this.selectionDot.offsetWidth/2;
        this.selectionDot.style.top = this.currentY - this.selectionDot.offsetHeight/2;
        if (!this.transparentDot) {
            this.selectionDot.style.backgroundColor = `rgb(${this.selectedColor.red}, ${this.selectedColor.green}, ${this.selectedColor.blue})`;
        }
    }
    
    updateCurrentPosition() {
        const hsv = rgbToHSV(this.selectedColor);

        // saturation is from x coordinate and value is from y coordinate
        this.currentX = (this.clientWidth - 1) * hsv.saturation;
        this.currentY = (this.clientHeight - 1) * (1 - hsv.value);
    }

    redraw(updateSelection=false) {
        unsafeWindow.requestAnimationFrame(() => {
            this.glHandler.draw(this.hue);
            if (updateSelection) {
                this.updateSelectedColor();
            }
        });
    }

    getHue() {
        return this.hue;
    }

    setHue(value) {
        this.hue = value;
        this.redraw(this.updateSelectionOnHueChange);
    }

    getRGBColor() {
        return { ...this.selectedColor }; //copy
    }

    setRGBColor(rgb) {
        this.selectedColor = { ...rgb };
        this.hue = hueFromRGB(this.selectedColor);
        this.redraw();
        this.updateCurrentPosition();
        this.updateSelectionDot();
    }

    getHexColor() {
        return rgbToHex(this.selectedColor);
    }

    setHexColor(hex) {
        this.selectedColor = hexToRGB(hex);
        this.hue = hueFromRGB(this.selectedColor);
        this.redraw();
        this.updateCurrentPosition();
        this.updateSelectionDot();
    }
}

customElements.define("color-spectrum", ColorSpectrum);