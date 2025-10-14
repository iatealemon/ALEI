import { getWallTextureImages } from "./wall-textures-algo.js";
import { getPatternForWallImage } from "./wall-assets.js";

export const params = new Set(["x", "y", "w", "h"]);

let dirty = true;

/** @type {({tiling: false, image: HTMLImageElement, x: number, y: number} | {tiling: true, image: HTMLImageElement, x: number, y: number, width: number, tileX: number})[]} */
let cachedSprites = [];

function clearCache() {
    cachedSprites = [];
}

export function setDirty() {
    dirty = true;
}
unsafeWindow.wallTexturesSetDirty = setDirty; // add to window so it can be used in undo/redo

export function drawWallTextures(ctx) {
    if (dirty) update();

    for (const sprite of cachedSprites) {
        (sprite.tiling ? drawTilingSprite : drawSprite)(ctx, sprite);
    }
}

function drawSprite(ctx, sprite) {
    const sx = unsafeWindow.w2s_x(sprite.x);
    const sy = unsafeWindow.w2s_y(sprite.y);
    const sw = unsafeWindow.w2s_w(sprite.image.width);
    const sh = unsafeWindow.w2s_h(sprite.image.height);
    ctx.drawImage(sprite.image, sx, sy, sw, sh);
}

function drawTilingSprite(ctx, tilingSprite) {
    const pattern = getPatternForWallImage(tilingSprite.image);
    const sx = unsafeWindow.w2s_x(tilingSprite.x);
    const sTileX = unsafeWindow.w2s_x(tilingSprite.tileX);
    const sw = unsafeWindow.w2s_w(tilingSprite.width);
    const sh = unsafeWindow.w2s_w(tilingSprite.image.height);

    ctx.save();
    ctx.translate(sx + sTileX);
    ctx.fillStyle = pattern;
    ctx.fillRect(-sTileX, sw, sh);
    ctx.restore();
}

function update() {
    if (!dirty) return;

    clearCache();

    const walls = es.filter(e => e._class === "box" && e.exists);
    const workingWalls = walls.filter(w => w.pm.x % 10 === 0 && w.pm.y % 10 === 0 && w.pm.w % 10 === 0 && w.pm.h % 10 === 0);
    const sprites = getWallTextureImages(workingWalls);

    cachedSprites = sprites;

    dirty = false;
}