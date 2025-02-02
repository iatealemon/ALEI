/**
 * handles drag-and-drop state and logic on a vertical arrangement of HTML elements
 */
export class DragStateHandler {
    constructor(callbacks={}) {
        this.dragDistanceThreshold = 10;
        this.initializeState();
        this.onDragStarted = callbacks.onDragStarted ?? null;
    }

    // to be called from a mousedown event listener
    initializeState(mouseX=null, mouseY=null) {
        this.startMouseX = mouseX;
        this.startMouseY = mouseY;
        this.savedMouseX = mouseX;
        this.savedMouseY = mouseY;
        this.elements = [];
        this.isDragging = false;
        this.wasDragging = false;
        this.dropPosition = null;
    }

    setElements(elements) {
        this.elements = elements;
    }

    // to be called from a mousemove event listener
    updateMousePos(x, y) {
        this.savedMouseX = x;
        this.savedMouseY = y;

        if (!this.isDragging) {
            const dist = manhattanDistance(this.startMouseX, this.startMouseY, this.savedMouseX, this.savedMouseY);
            if (dist > this.dragDistanceThreshold) {
                this.dragStarted();
            }
        }

        this.recalculateDropPosition();
    }

    dragStarted() {
        this.isDragging = true;
        this.wasDragging = true;
        this.onDragStarted();
    }

    // can be called directly whenever recalculation is necessary (e.g. when scrolling)
    recalculateDropPosition() {
        if (!this.isDragging) return;

        this.dropPosition = this.findClosestGap();
    }

    findClosestGap() {
        // binary search
        let remaining = this.elements;
        let closestGap = null;
        let indexOffset = 0; // represents the starting index of the current segment
        while (remaining.length > 0) {
            const midIndex = Math.floor(remaining.length / 2);
            const midElement = remaining[midIndex];

            const rect = midElement.getBoundingClientRect();
            const midY = (rect.top + rect.bottom) / 2;

            if (this.savedMouseY <= midY) {
                // keep left side
                closestGap = indexOffset + midIndex;
                remaining = remaining.slice(0, midIndex);
            }
            else {
                // keep right side
                closestGap = indexOffset + midIndex + 1;
                remaining = remaining.slice(midIndex + 1);
                indexOffset += midIndex + 1;
            }
        }

        return closestGap
    }

    // to be called from a mouseleave event listener
    resetDropPosition() {
        this.dropPosition = null;
    }

    // to be called from a mouseup event listener
    stopDrag() {
        this.startMouseX = null;
        this.startMouseY = null;
        this.isDragging = false;
        this.dropPosition = null;
    }
}

function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}