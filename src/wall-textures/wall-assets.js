import wallMaterialsJSON from "./wall-materials.json";

export const wallMaterials = Object.fromEntries(
    Object.entries(wallMaterialsJSON).filter(([key, _]) => key !== "example")
);

let wallSpriteKeys = [];
for (const mat in wallMaterials) {
    if (mat === "example") continue;
    for (const side in wallMaterials[mat].sprites) {
        for (const part in wallMaterials[mat].sprites[side]) {
            wallSpriteKeys.push(wallMaterials[mat].sprites[side][part].sprite);
        }
    }
}
wallSpriteKeys = [...new Set(wallSpriteKeys)];

const resourcesBasePath = "https://raw.githubusercontent.com/Molisson/ALEI/refs/heads/main/resources/";

const wallTextureAssets = {};
for (const spriteKey of wallSpriteKeys) {
    const image = new Image();
    image.src = resourcesBasePath + spriteKey + ".webp";
    image.loaded = false;
    image.onload = () => {
        image.loaded = true;
    };
    wallTextureAssets[spriteKey] = image;
}

const cachedImagePatterns = new Map();

export function getWallTextureImage(key) {
    return wallTextureAssets[key];
}

export function getPatternForWallImage(ctx, image) {
    if (cachedImagePatterns.has(image)) return cachedImagePatterns.get(image);
    const pattern = ctx.createPattern(image, "repeat");
    cachedImagePatterns.set(image, pattern);
    return pattern;
}