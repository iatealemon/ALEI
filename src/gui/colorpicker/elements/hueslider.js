/*
create a new hue slider by using the hue-slider html tag.
optional attributes:
- data-vertical: make the hue slider vertical (needs a container element with a set height)
- data-hide-dot: hide the selection dot
- data-dot-center-shows-color: display the color of the selected hue in the dot center
- data-dot-border-shows-color: display the color of the selected hue in the dot border
styling can be changed using these css variables:
- --thickness
- --border-radius
- --dot-center-color
- --dot-border-color
- --dot-diameter
- --dot-width (same as --dot-diameter if unspecified)
- --dot-height (same as --dot-diameter if unspecified)
- --dot-border-width
- --dot-border-radius
events: dragselectstart, hueinput (has detail.hue), dragselectend
*/

const hueSliderTemplate = document.createElement("template");
hueSliderTemplate.innerHTML = `
    <style>
        :host {
            --thickness: 10px;
            --border-radius: 8px;
            --dot-center-color: #000;
            --dot-border-color: #fff;
            --dot-diameter: 6px;
            --dot-width: var(--dot-diameter);
            --dot-height: var(--dot-diameter);
            --dot-border-width: 2px;
            --dot-border-radius: 50%;
            display: block;
            position: relative;
            border-radius: var(--border-radius);
            width: auto;
            height: var(--thickness);
            background: linear-gradient(to right,
                                        hsl(0, 100%, 50%),
                                        hsl(60, 100%, 50%),
                                        hsl(120, 100%, 50%),
                                        hsl(180, 100%, 50%),
                                        hsl(240, 100%, 50%),
                                        hsl(300, 100%, 50%),
                                        hsl(360, 100%, 50%));
        }

        :host([data-vertical]) {
            width: var(--thickness);
            height: 100%; /* height: auto doesn't work cuz the element has no content */
            background: linear-gradient(to bottom,
                                        hsl(0, 100%, 50%),
                                        hsl(60, 100%, 50%),
                                        hsl(120, 100%, 50%),
                                        hsl(180, 100%, 50%),
                                        hsl(240, 100%, 50%),
                                        hsl(300, 100%, 50%),
                                        hsl(360, 100%, 50%));
        }

        .selection-dot {
            position: absolute;
            display: block;
            width: var(--dot-width);
            height: var(--dot-height);
            border: var(--dot-border-width) solid var(--dot-border-color);
            border-radius: var(--dot-border-radius);
            background-color: var(--dot-center-color);
            pointer-events: none;
        }

        .selection-dot--hidden {
            display: none;
        }
    </style>

    <div class="selection-dot"></div>
`;

class HueSlider extends HTMLElement {
    selectionDot;
    selectedHue = 0;
    dragged = false;
    vertical = false;
    hideDot = false;
    dotCenterShowsColor = false;
    dotBorderShowsColor = false;
    documentMouseMoveBound;
    documentMouseUpBound;
    resizeObserver;

    static observedAttributes = ["data-vertical", "data-hide-dot", "data-dot-center-shows-color", "data-dot-border-shows-color"];

    constructor() {
        super();
        
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(hueSliderTemplate.content.cloneNode(true));

        this.selectionDot = this.shadowRoot.querySelector(".selection-dot");

        this.addEventListener("mousedown", (event) => this.sliderMouseDown(event));
        this.documentMouseMoveBound = this.documentMouseMove.bind(this);
        this.documentMouseUpBound = this.documentMouseUp.bind(this);

        this.resizeObserver = new ResizeObserver(() => this.updateSelectionDot());
    }

    connectedCallback() {
        document.addEventListener("mousemove", this.documentMouseMoveBound);
        document.addEventListener("mouseup", this.documentMouseUpBound);

        this.resizeObserver.observe(this);
        this.resizeObserver.observe(this.selectionDot, { box: "border-box" });

        this.updateSelectionDot();
    }

    disconnectedCallback() {
        document.removeEventListener("mousemove", this.documentMouseMoveBound);
        document.removeEventListener("mouseup", this.documentMouseUpBound);

        this.resizeObserver.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "data-vertical":
                this.vertical = this.hasAttribute("data-vertical");
                this.updateSelectionDot();
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
            case "data-dot-center-shows-color":
                this.dotCenterShowsColor = this.hasAttribute("data-dot-center-shows-color");
                if (this.dotCenterShowsColor) {
                    this.updateSelectionDot();
                }
                else {
                    this.selectionDot.style.removeProperty("background-color");
                }
                break;
            case "data-dot-border-shows-color":
                this.dotBorderShowsColor = this.hasAttribute("data-dot-border-shows-color");
                if (this.dotBorderShowsColor) {
                    this.updateSelectionDot();
                }
                else {
                    this.selectionDot.style.removeProperty("border-color");
                }
                break;
        }
    }

    sliderMouseDown(event) {
        if (event.button === 0) {
            this.dragged = true;
            this.dispatchEvent(new Event("dragselectstart", {
                bubbles: true,
                composed: true
            }));
            if (!this.vertical) {
                this.updateSelectedHue(event.offsetX);
            }
            else {
                this.updateSelectedHue(event.offsetY);
            }
        }
    }

    documentMouseMove(event) {
        if (this.dragged) {
            const rect = this.getBoundingClientRect();
            if (!this.vertical) {
                let relativeX = event.clientX - rect.left; // relative to element

                // clamp to element bounds
                const minX = 0;
                const maxX = this.clientWidth - 1;
                relativeX = Math.max(minX, Math.min(relativeX, maxX));

                this.updateSelectedHue(relativeX);
            }
            else {
                let relativeY = event.clientY - rect.top; // relative to element

                // clamp to element bounds
                const minY = 0;
                const maxY = this.clientHeight - 1;
                relativeY = Math.max(minY, Math.min(relativeY, maxY));

                this.updateSelectedHue(relativeY);
            }
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

    // pos is either relative x or y coordinate depending on the orientation of the slider
    updateSelectedHue(pos) {
        if (!this.vertical) {
            this.selectedHue = (pos / (this.clientWidth - 1)) * 360;
        }
        else {
            this.selectedHue = (pos / (this.clientHeight - 1)) * 360;
        }
        this.dispatchEvent(new CustomEvent("hueinput", {
            detail: { hue: this.selectedHue },
            bubbles: true,
            composed: true
        }));

        // update selection dot position and color
        this.updateSelectionDot();
    }

    updateSelectionDot() {
        if (!this.vertical) {
            this.selectionDot.style.top = Math.floor((this.clientHeight - this.selectionDot.offsetHeight) / 2);
            this.selectionDot.style.left = (this.clientWidth - 1) * (this.selectedHue / 360) - this.selectionDot.offsetWidth/2;
        }
        else {
            this.selectionDot.style.top = (this.clientHeight - 1) * (this.selectedHue / 360) - this.selectionDot.offsetHeight/2;
            this.selectionDot.style.left = Math.floor((this.clientWidth - this.selectionDot.offsetWidth) / 2);
        }
        if (this.dotCenterShowsColor) {
            this.selectionDot.style.backgroundColor = `hsl(${this.selectedHue}, 100%, 50%)`;
        }
        if (this.dotBorderShowsColor) {
            this.selectionDot.style.borderColor = `hsl(${this.selectedHue}, 100%, 50%)`;
        }
    }

    setSelectedHue(value) {
        this.selectedHue = value;
        this.updateSelectionDot();
    }
}

customElements.define("hue-slider", HueSlider);