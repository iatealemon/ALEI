/*
a spawn point is randomized from an area that is within the minimal bounding box of the map walls with 100 units of padding on all sides.

the spawn point is filtered with these requirements:
1. the point must have solid ground in the surronding points (x-10, y+50), (x, y+50), and (x+10, y+50)
2. the point must not have solid ground in the surronding points (x-10, y-50), (x, y-50), and (x+10, y-50)
3. the point must not be within 100 units of waters or pushers
+ other requirements that are based on dynamic stuff (distance to enemies, distance to non-defib guns, enemy line of sight)
technically waters and pushers can also be dynamic but usually they're not.
requirements 1. and 2. consider both walls and movables.

if a spawn point hasn't been found after 1500 tries, distance to enemies and non-defib guns is ignored.
if a spawn point hasn't been found after 3000 tries, any random spawn point is accepted.

the algorithm used here assumes waters and pushers to be static. movables are also assumed to be static even though they aren't. they may be in the starting position most of the time, though.


edge cases:  
1. early exit with defaults if there are no walls, because the map wouldn't be playable and the map bounding box bounds would be undefined which breaks the respawn system.
2. walls with negative dimensions are omitted in the algorithm, because the negative dimensions cause every point within the wall to be considered not solid. they're still used when computing the guess region, however, and their rect is computed without considering the negative dimensions (gives the correct result).
3. walls with 0 width/height are omitted in the algorithm, but still used when computing the guess region.
4. movables with negative dimensions are omitted in the algorithm (same reason as for walls).
5. movables with 0 width/height are omitted in the algorithm.
6. if water/pusher width or height <= -200, it is ignored because it can no longer block spawns. negative but above -200 is handled without considering the negative dimensions (gives the correct result).
*/

const OPEN = true;
const CLOSE = false;
const INCLUSIVE = true;
const EXCLUSIVE = false;
const LEFT = 0;
const CENTER = 1;
const RIGHT = 2;
const DOESNT_MATTER = CENTER; // used for exclusive intervals that aren't associated with any intervalPos

// region that the spawn point attempt is randomized from. equal to the bounding box of the map walls with 100 units of padding
export const guessRegion = {
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    totalArea: 0,
};

export const validRegion = {
    rects: [],
    totalArea: 0,
};

export let approxRandomSpawnChance = 0;

export const classes = new Set(["box", "door", "water", "pushf"]);
export const params = new Set(["x", "y", "w", "h"]);

let updateScheduled = false;
// does update asynchronously. helps to avoid updating more than necessary
export function scheduleUpdate() {
    if (!updateScheduled) {
        updateScheduled = true;
        queueMicrotask(() => {
            update();
            updateScheduled = false;
        });
    }
}
unsafeWindow.scheduleSpawnAreasUpdate = scheduleUpdate; // add to window so it can be used in undo/redo

export function update() {
    updateRegions();
    updateRandomSpawnChance();
}

function updateRegions() {
    // set defaults
    guessRegion.bounds.minX = 0;
    guessRegion.bounds.minY = 0;
    guessRegion.bounds.maxX = 0;
    guessRegion.bounds.maxY = 0;
    guessRegion.totalArea = 0;
    validRegion.rects = [];
    validRegion.totalArea = 0;

    const existingEntities = es.filter(entity => entity.exists);
    const existingWalls = existingEntities.filter(entity => entity._class === "box");

    // early exit if there are no walls (edge case 1.)
    if (existingWalls.length === 0) return;

    /** wall rects that allow max bounds to be less than or equal to min bounds (see edge case 2. and 3.) */
    const guessRegionWallRects = existingEntities
        .filter(entity => entity._class === "box")
        .map(({ pm: {x, y, w, h} }) => ({ minX: x, minY: y, maxX: x + w, maxY: y + h }));

    const guessBounds = getAttemptRegion(guessRegionWallRects);
    guessRegion.bounds = guessBounds;
    guessRegion.totalArea = getArea(guessBounds);

    /** wall rects that omit walls with non-positive dimensions (edge case 2. and 3.) */
    const algorithmWallRects = guessRegionWallRects.filter(({ minX, minY, maxX, maxY }) => minX < maxX && minY < maxY);

    /** movable rects that omit movables with non-positive dimensions (edge case 4. and 5.) */
    const algorithmMovableRects = existingEntities
        .filter(entity => entity._class === "door")
        .filter(({ pm: {w, h} }) => w > 0 && h > 0)
        .map(({ pm: {x, y, w, h}}) => ({ minX: x, minY: y, maxX: x + w, maxY: y + h }));
    
    /** water/pusher rects that omit those with width or height <= -200 (edge case 6.) */
    const hazardRects = existingEntities
        .filter(entity => entity._class === "water" || entity._class === "pushf")
        .filter(({ pm: {w, h} }) => w > -200 && h > -200)
        .map(({ pm: {x, y, w, h} }) => ({ minX: x, minY: y, maxX: x + w, maxY: y + h }));

    // events for sweep line algorithm
    const events = algorithmWallRects
        // wall/movable stuff (requirements 1. and 2.)
        .concat(algorithmMovableRects)
        .flatMap(({ minX, minY, maxX, maxY }) => {
            return [
                // requirement 1. (ground under player)
                { x: minX - 10, eventType: OPEN,  intervalType: INCLUSIVE, intervalPos: LEFT,   minY: minY - 50, maxY: maxY - 50 },
                { x: maxX - 10, eventType: CLOSE, intervalType: INCLUSIVE, intervalPos: LEFT,   minY: minY - 50, maxY: maxY - 50 },
                { x: minX,      eventType: OPEN,  intervalType: INCLUSIVE, intervalPos: CENTER, minY: minY - 50, maxY: maxY - 50 },
                { x: maxX,      eventType: CLOSE, intervalType: INCLUSIVE, intervalPos: CENTER, minY: minY - 50, maxY: maxY - 50 },
                { x: minX + 10, eventType: OPEN,  intervalType: INCLUSIVE, intervalPos: RIGHT,  minY: minY - 50, maxY: maxY - 50 },
                { x: maxX + 10, eventType: CLOSE, intervalType: INCLUSIVE, intervalPos: RIGHT,  minY: minY - 50, maxY: maxY - 50 },
                // requirement 2. (no ground above player)
                { x: minX - 10, eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: LEFT,   minY: minY + 50, maxY: maxY + 50 },
                { x: maxX - 10, eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: LEFT,   minY: minY + 50, maxY: maxY + 50 },
                { x: minX,      eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: CENTER, minY: minY + 50, maxY: maxY + 50 },
                { x: maxX,      eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: CENTER, minY: minY + 50, maxY: maxY + 50 },
                { x: minX + 10, eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: RIGHT,  minY: minY + 50, maxY: maxY + 50 },
                { x: maxX + 10, eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: RIGHT,  minY: minY + 50, maxY: maxY + 50 },
            ];
        })
        // exclude areas around waters and pushers (requirement 3.)
        .concat(
            hazardRects.flatMap(({ minX, minY, maxX, maxY }) => {
                return [
                    { x: minX - 100, eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: minY - 100, maxY: maxY + 100 },
                    { x: maxX + 100, eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: minY - 100, maxY: maxY + 100 },
                ];
            })
        )
        // exclude areas beyond the spawn attempt region
        .concat(
            [
                // exclude left area
                { x: -Infinity,        eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: Infinity },
                { x: guessBounds.minX, eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: Infinity },
                // exclude top area
                { x: -Infinity,        eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: guessBounds.minY },
                { x: Infinity,         eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: guessBounds.minY },
                // exclude bottom area
                { x: -Infinity,        eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: guessBounds.maxY, maxY: Infinity },
                { x: Infinity,         eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: guessBounds.maxY, maxY: Infinity },
                // exclude right area
                { x: guessBounds.maxX, eventType: OPEN,  intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: Infinity },
                { x: Infinity,         eventType: CLOSE, intervalType: EXCLUSIVE, intervalPos: DOESNT_MATTER, minY: -Infinity,        maxY: Infinity },
            ]
        )
        // sort by x while putting OPEN event first
        .sort((a, b) => {
            if (a.x !== b.x) return a.x - b.x; // prioritize sorting by x
            if (a.eventType !== b.eventType) return a.eventType === OPEN ? -1 : 1; // put OPEN event first if x values are the same
            return 0;
        });

    let yIntervalsTree;
    try {
        yIntervalsTree = new SpawnRegionSegmentTree(events.flatMap(({ minY, maxY }) => [minY, maxY]));
    }
    catch {
        return; // early exit if there are less than 2 unique y-values (algorithm won't work and there's nothing for it to do)
    }

    let area = 0;
    let outRects = [];
    
    let openRects = {}; // maps segment keys to indexes in outRects. used to avoid creating more rectangles than necessary on the x-axis
    let prevX = Infinity;
    for (const { x, eventType, intervalType, intervalPos, minY, maxY } of events) {
        const dx = x - prevX;
        if (dx > 0) {
            const newOpenRects = {};

            for (const [start, end] of mergeAdjacentSegments(yIntervalsTree.getSpawnableSegments())) {
                const key = `${start},${end}`;
                let rectIndex;
                if (key in openRects) {
                    rectIndex = openRects[key];
                    outRects[rectIndex].maxX = x;
                }
                else {
                    rectIndex = outRects.length;
                    outRects.push({ minX: prevX, minY: start, maxX: x, maxY: end });
                }
                newOpenRects[key] = rectIndex;
            }

            openRects = newOpenRects;

            const dA = dx * yIntervalsTree.getCoveredLength();
            if (!Number.isNaN(dA)) area += dA; // dA becomes NaN if dx === Infinity and yIntervalsTree.getCoveredLength() === 0
        }

        yIntervalsTree.update(minY, maxY, eventType === OPEN ? 1 : -1, intervalType, intervalPos);

        prevX = x;
    }

    validRegion.rects = outRects;
    validRegion.totalArea = area;
}

function updateRandomSpawnChance() {
    const pOneSuccess = validRegion.totalArea / guessRegion.totalArea;
    const pOneFail = 1 - pOneSuccess;

    // because distance to enemies and non-defib guns is dynamic, we'll pessimistically assume that they block spawns for the first 1500 attempts.
    // so the approximated probability of getting a random spawn is the probability of getting a failed attempt the remaining 1500 times
    approxRandomSpawnChance = Number.isNaN(pOneFail) ? 1 : pOneFail ** 1500;
}

function getAttemptRegion(wallRects) {
    const mapBoundingBox = getBoundingBox(wallRects);
    const xValues = [mapBoundingBox.minX + 100, mapBoundingBox.maxX - 100];
    const yValues = [mapBoundingBox.minY + 100, mapBoundingBox.maxY - 100];
    return {
        minX: Math.min(...xValues),
        maxX: Math.max(...xValues),
        minY: Math.min(...yValues),
        maxY: Math.max(...yValues),
    };
}

function getBoundingBox(rects) {
    let bbMinX = Infinity;
    let bbMinY = Infinity;
    let bbMaxX = -Infinity;
    let bbMaxY = -Infinity;
    for (const { minX, minY, maxX, maxY } of rects) {
        if (minX < bbMinX) bbMinX = minX;
        if (minY < bbMinY) bbMinY = minY;
        if (maxX > bbMaxX) bbMaxX = maxX;
        if (maxY > bbMaxY) bbMaxY = maxY;
    }
    return { minX: bbMinX, minY: bbMinY, maxX: bbMaxX, maxY: bbMaxY };
}

function getArea(rect) {
    return (rect.maxX - rect.minX) * (rect.maxY - rect.minY);
}

function mergeAdjacentSegments(segments) {
    const merged = [];
    let prevEnd = -Infinity;
    for (const [start, end] of segments) {
        if (start !== prevEnd) {
            merged.push([start, end]);
        }
        else {
            merged[merged.length - 1][1] = end;
        }
        prevEnd = end;
    }
    return merged;
}

class SpawnRegionSegmentTree {
    /**
     * @param {number[]} coords values to create the segment tree for
     */
    constructor(coords) {
        this.coords = [...new Set(coords)].sort((a, b) => a - b);
        if (this.coords.length < 2) {
            throw new Error("Cannot create interval tree for less than 2 unique coordinates");
        }
        this.coordIndexes = Object.fromEntries(this.coords.map((v, i) => [v, i])); // maps coords to their indexes / leaf node indexes
        this.leaves = this.coords.length - 1; // number of leaf nodes/intervals

        // data for nodes.
        // root is index 1. left and right child node index is given by 2*i and 2*i + 1 where i is the parent node index.
        // space is allocated for 4 times the number of leaf nodes to ensure that there's a slot for every node.
        this.leftHasFloorCount = new Uint8Array(4 * this.leaves);
        this.centerHasFloorCount = new Uint8Array(4 * this.leaves);
        this.rightHasFloorCount = new Uint8Array(4 * this.leaves);
        this.leftBlockedCount = new Uint8Array(4 * this.leaves);
        this.centerBlockedCount = new Uint8Array(4 * this.leaves);
        this.rightBlockedCount = new Uint8Array(4 * this.leaves);
        this.bubblingBlockedCount = new Uint16Array(4 * this.leaves); // how many times the node's or its descendants' intervals have been blocked
        this.covered = new Float32Array(4 * this.leaves); // the total length covered by included non-excluded intervals in the node
    }

    getNodeDataArray(intervalType, intervalPos) {
        switch (intervalPos) {
            case LEFT:
                return intervalType === INCLUSIVE ? this.leftHasFloorCount : this.leftBlockedCount;
            case CENTER:
                return intervalType === INCLUSIVE ? this.centerHasFloorCount : this.centerBlockedCount;
            case RIGHT:
                return intervalType === INCLUSIVE ? this.rightHasFloorCount : this.rightBlockedCount;
            default:
                throw new Error(`what the fuck is the interval pos "${intervalPos}"?`);
        }
    }

    /**
     * returns the left child node index of the node with index i
     * @param {number} i parent node index
     * @returns {number}
     */
    leftChild(i) {
        return 2*i;
    }

    /**
     * returns the right child node index of the node with index i
     * @param {number} i parent node index
     * @returns {number}
     */
    rightChild(i) {
        return 2*i + 1;
    }

    /**
     * @param start min value of the interval
     * @param end max value of the interval
     * @param delta value to add to each node in the interval (like +1 or -1)
     * @param intervalType type of the interval that the tree is updated for. either INCLUSIVE (true) or EXCLUSIVE (false)
     * @param intervalPos either LEFT, CENTER, RIGHT, or DOESNT_MATTER (equal to CENTER)
     */
    update(start, end, delta, intervalType, intervalPos) {
        if (!(start in this.coordIndexes) || !(end in this.coordIndexes)) {
            throw new Error("Start or end value is not in original coordinate set.");
        }
        if (start >= end) {
            throw new Error("Start must be less than end");
        }
        const queryLeft = this.coordIndexes[start];
        const queryRight = this.coordIndexes[end];
        this._update(1, 0, this.leaves, queryLeft, queryRight, delta, intervalType, intervalPos);
    }

    /**
     * recursive part of update
     * @param node current node index
     * @param left left bound of the current node (in coord index)
     * @param right right bound of the current node (in coord index)
     * @param ql left bound of the query (in coord index)
     * @param qr right bound of the query (in coord index)
     * @param delta count to add or subtract
     * @param intervalType query interval type. either INCLUSIVE (true) or EXCLUSIVE (false)
     * @param intervalPos either LEFT, CENTER, RIGHT, or DOESNT_MATTER (equal to CENTER)
     */
    _update(node, left, right, ql, qr, delta, intervalType, intervalPos) {
        if (right <= ql || qr <= left) return; // don't run for nodes whose intervals don't contain the query interval

        if (ql <= left && right <= qr) { // current node's range is completely within the query range
            this.getNodeDataArray(intervalType, intervalPos)[node] += delta;
        }

        if (intervalType === EXCLUSIVE) {
            this.bubblingBlockedCount[node] += delta;
        }
        
        if (right - left > 1) {
            const split = Math.floor((left + right) / 2); // split index
            this._update(this.leftChild(node), left, split, ql, qr, delta, intervalType, intervalPos);
            this._update(this.rightChild(node), split, right, ql, qr, delta, intervalType, intervalPos);
        }

        if (this.leftBlockedCount[node] > 0 || this.centerBlockedCount[node] > 0 || this.rightBlockedCount[node] > 0) {
            this.covered[node] = 0;
        }
        else if (this.bubblingBlockedCount[node] > 0) {
            // this never runs for leaf nodes even tho it comes before that check. any non-blocked node with blocks in descendants must have child nodes
            this.covered[node] = this.covered[this.leftChild(node)] + this.covered[this.rightChild(node)];
        }
        else if (this.leftHasFloorCount[node] > 0 && this.centerHasFloorCount[node] > 0 && this.rightHasFloorCount[node] > 0) {
            this.covered[node] = this.coords[right] - this.coords[left];
        }
        else if (right - left === 1) { // leaf node
            this.covered[node] = 0;
        }
        else {
            this.covered[node] = this.covered[this.leftChild(node)] + this.covered[this.rightChild(node)];
        }
    }

    /**
     * gets all disjoint segments where:
     * 1. leftHasFloorCount, centerHasFloorCount, rightHasFloorCount are all positive
     * 2. none of leftBlockedCount, centerBlockedCount, rightBlockedCount are positive
     * @returns {[start: number, end: number][]}
     */
    getSpawnableSegments() {
        const result = [];
        this._getSpawnableSegments(1, 0, this.leaves, result);
        return result;
    }

    /**
     * recursive part of getSpawnableSegments
     * @param node current node index
     * @param left left bound of the current node (in coord index)
     * @param right right bound of the current node (in coord index)
     * @param result accumulated segments
     */
    _getSpawnableSegments(node, left, right, result) {
        if (this.leftBlockedCount[node] <= 0 && this.centerBlockedCount[node] <= 0 && this.rightBlockedCount[node] <= 0) {
            if (this.leftHasFloorCount[node] > 0 && this.centerHasFloorCount[node] > 0 && this.rightHasFloorCount[node] > 0 && this.bubblingBlockedCount[node] <= 0) {
                result.push([this.coords[left], this.coords[right]]);
            }
            else if (right - left > 1) {
                const split = Math.floor((left + right) / 2); // split index
                this._getSpawnableSegments(this.leftChild(node), left, split, result);
                this._getSpawnableSegments(this.rightChild(node), split, right, result);
            }
        }
    }

    getCoveredLength() {
        return this.covered[1]; // total covered length at the root node
    }
}