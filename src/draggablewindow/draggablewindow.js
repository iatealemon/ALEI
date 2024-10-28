/*
create a new draggable window by using the draggable-window html tag. 
set its title by setting the attribute data-title.
change its dimensions by calling the method setDimensions(width, height) or by setting the --content-width and --content-height properties in the style attribute.
add elements to the draggable window's content by adding them to the "content" slot.
styling can be changed using these css variables:
- --header-background-color
- --header-color
- --header-button-background-color
- --header-button-hover-background-color
- --header-button-active-background-color
- --header-button-color
- --header-button-border-color
- --content-background-color
- --shadow-color
events: windowclose
*/

const theWindow = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;

const draggableWindowTemplate = document.createElement("template");
draggableWindowTemplate.innerHTML = `
    <style>
        :host {
            --header-background-color: rgb(185, 185, 185);
            --header-color: #ffffff;
            --header-button-background-color: hsl(0, 0%, 60%);
            --header-button-hover-background-color: hsl(0, 0%, 55%);
            --header-button-active-background-color: hsl(0, 0%, 50%);
            --header-button-color: #ffffff;
            --header-button-border-color: #757575;
            --content-background-color: rgb(235, 235, 235);
            --shadow-color: #666;
            --content-width: 400px;
            --content-height: 300px;
            position: fixed;
            border-radius: 4px;
            box-shadow: 1px 2px 6px var(--shadow-color);
            z-index: 100;
            display: block;
            left: 200px;
            top: 200px;
        }
        
        .header {
            background-color: var(--header-background-color);
            color: var(--header-color);
            border-bottom: 2px solid rgba(0, 0, 0, 0.1);
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            cursor: move;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .header-title {
            font-size: 18px;
            user-select: none;
        }

        .header-buttons-container {
            cursor: default;
            position: absolute;
            top: 3px;
            right: 3px;
            display: flex;
            gap: 4px;
        }

        .header-button {
            background-color: var(--header-button-background-color);
            color: var(--header-button-color);
            border: 2px solid var(--header-button-border-color);
            font-size: 14px;
            font-weight: bold;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
        }

        .header-button:hover {
            background-color: var(--header-button-hover-background-color);
        }

        .header-button:active {
            background-color: var(--header-button-active-background-color);
        }

        .content-container {
            max-height: var(--content-height);
            transition: max-height 0.5s ease;
        }

        .content-container--collapsed {
            max-height: 0;
        }

        .content-container--clipping {
            overflow: hidden;
        }

        .content-container--no-transition {
            transition: none;
        }

        .content {
            background-color: var(--content-background-color);
            padding: 15px;
            width: var(--content-width);
            height: var(--content-height);
            box-sizing: border-box;
        }
    </style>

    <div class="header">
        <div class="header-title"></div>
        <div class="header-buttons-container">
            <button class="header-button" data-action="toggle collapse" title="Collapse content">></button>
            <button class="header-button" data-action="close" title="Close window">X</button>
        </div>
    </div>
    <div class="content-container">
        <div class="content">
            <slot name="content"></slot>
        </div>
    </div>
`;

let drawOrder = [];
const draggableWindowBasicZIndex = 100;

class DraggableWindow extends HTMLElement {
    headerTitle;
    collapseButton;
    contentContainer;
    contentElement;
    uncollapseTimeout = null;

    static observedAttributes = ["data-title"];

    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(draggableWindowTemplate.content.cloneNode(true));

        const header = this.shadowRoot.querySelector(".header");
        this.collapseButton = header.querySelector(`.header-button[data-action="toggle collapse"]`);
        const closeButton = header.querySelector(`.header-button[data-action="close"]`);
        this.headerTitle = header.querySelector(".header-title");
        this.contentContainer = this.shadowRoot.querySelector(".content-container");
        this.contentElement = this.contentContainer.querySelector(".content");
        
        this.collapseButton.addEventListener("click", () => this.toggleCollapse());
        closeButton.addEventListener("click", () => this.closeWindow());

        makeDraggable(this, header);

        this.addEventListener("mousedown", (event) => {
            if ([0, 1].includes(event.button)) {
                this.moveToFront();
            }
        });
    }

    connectedCallback() {
        drawOrder.push(this);
        updateZIndexes();
    }

    disconnectedCallback() {
        const index = drawOrder.indexOf(this);
        drawOrder.splice(index, 1);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "data-title":
                this.headerTitle.textContent = newValue;
                break;
        }
    }

    setDimensions(width, height) {
        this.contentContainer.classList.add("content-container--no-transition");
        this.style.setProperty("--content-width", `${width}px`);
        this.style.setProperty("--content-height", `${height}px`);
        void this.contentContainer.offsetHeight; //force reflow
        this.contentContainer.classList.remove("content-container--no-transition");
    }

    toggleCollapse() {
        if (!this.contentContainer.classList.contains("content-container--collapsed")) {
            // start collapse
            this.contentContainer.classList.add("content-container--collapsed", "content-container--clipping");
            if (this.uncollapseTimeout !== null) {
                clearTimeout(this.uncollapseTimeout);
            }
            
            this.collapseButton.title = "Expand content";
        }
        else {
            // start expand
            this.contentContainer.classList.remove("content-container--collapsed");
            // this timeout is necessary so that overflow: hidden is removed only when the transition finishes.
            // otherwise the content becomes visible immediately
            this.uncollapseTimeout = setTimeout(() => {
                this.contentContainer.classList.remove("content-container--clipping");
                this.uncollapseTimeout = null;
            }, 500);

            this.collapseButton.title = "Collapse content";
        }
    }

    closeWindow() {
        this.remove();
        this.dispatchEvent(new Event("windowclose", {
            bubbles: true,
            composed: true
        }));
    }

    moveToFront() {
        // move the clicked window to the end of the draw order
        const index = drawOrder.indexOf(this);
        drawOrder.splice(index, 1);
        drawOrder.push(this);

        updateZIndexes();
    }
}

customElements.define("draggable-window", DraggableWindow);

function updateZIndexes() {
    drawOrder.forEach((draggableWindow, index) => {
        draggableWindow.style.zIndex = index + draggableWindowBasicZIndex;
    });
}

function makeDraggable(element, draggableHeader) {
    let mouseOffsetX;
    let mouseOffsetY;

    function dragStart(event) {
        if (event.button === 0) {
            mouseOffsetX = event.clientX - element.offsetLeft;
            mouseOffsetY = event.clientY - element.offsetTop;

            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", dragStop);
        }
    }

    function drag(event) {
        let newX = event.clientX - mouseOffsetX;
        let newY = event.clientY - mouseOffsetY;
        
        // clamp to window bounds
        const minX = -element.offsetWidth * 0.5;
        const maxX = theWindow.innerWidth - element.offsetWidth * 0.5;
        const minY = 0;
        const maxY = theWindow.innerHeight - draggableHeader.offsetHeight;
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    }

    function dragStop(event) {
        if (event.button === 0) {
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("mouseup", dragStop);
        }
    }

    draggableHeader.addEventListener("mousedown", dragStart);
}