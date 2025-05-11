/*
all rects are 4px less on each side than what the custom skin template would suggest.
there's some amount of padding that isn't shown in-game so it doesn't change anything.
hiding it gets rid of some rounding errors and hides red borders that may be placed differently.
*/
const spriteRects = {
    head: { sx: 21, sy: 5, sw: 459, sh: 267, },
    body: { sx: 489, sy: 5, sw: 351, sh: 303, },
    lowerLeg: { sx: 849, sy: 5, sw: 187, sh: 211, },
    upperArm: { sx: 849, sy: 225, sw: 167, sh: 215, },
    upperLeg: { sx: 1045, sy: 5, sw: 243, sh: 247, },
    pelvis: { sx: 1045, sy: 261, sw: 155, sh: 139, },
    foreArm: { sx: 1297, sy: 5, sw: 215, sh: 263, },
    foot: { sx: 1297, sy: 277, sw: 187, sh: 163, },
    psi: { sx: 1521, sy: 5, sw: 319, sh: 455, },
};

const charPoses = {
    none: {
        drawOrder: ["foot", "upperLeg", "lowerLeg", "pelvis", "body", "head", "upperArm", "psi", "foreArm"],
        parts: {
            head: { x: 0, y: 0, deg: 0, sprite: "head" },
            body: { x: 0, y: 0, deg: 0, sprite: "body"},
            pelvis: { x: 0, y: 0, deg: 0, sprite: "pelvis"},
            upperLeg: { x: 0, y: 0, deg: 0, sprite: "upperLeg"},
            lowerLeg: { x: 0, y: 0, deg: 0, sprite: "lowerLeg" },
            foot: { x: 0, y: 0, deg: 0, sprite: "foot" },
            upperArm: { x: 0, y: 0, deg: 0, sprite: "upperArm"},
            foreArm: { x: 0, y: 0, deg: 0, sprite: "foreArm"},
            psi: { x: 0, y: 0, deg: 0, sprite: "psi"},
        }
    },
    standing: {
        // psi going under forearm isn't how non-custom skins work. probably a bug that will be fixed at some point
        drawOrder: ["upperArmLeft", "psiLeft", "foreArmLeft", "footLeft", "upperLegLeft", "lowerLegLeft", "pelvis", "body", "footRight", "upperLegRight", "lowerLegRight", "head", "upperArmRight", "psiRight", "foreArmRight"],
        //drawOrder: ["upperArmLeft", "foreArmLeft", "psiLeft", "footLeft", "upperLegLeft", "lowerLegLeft", "pelvis", "body", "footRight", "upperLegRight", "lowerLegRight", "head", "upperArmRight", "foreArmRight", "psiRight"],
        parts: {
            head: { x: 13, y: -20, deg: 0, sprite: "head" },
            body: { x: -60, y: 43, deg: 5, sprite: "body"},
            pelvis: { x: 57, y: 223, deg: 5, sprite: "pelvis"},
            upperLegLeft: { x: -15, y: 196, deg: -15.5, sprite: "upperLeg"},
            lowerLegLeft: { x: 63, y: 257, deg: 8, sprite: "lowerLeg" },
            footLeft: { x: 54, y: 301, deg: -3.5, sprite: "foot" },
            upperLegRight: { x: -27.5, y: 188, deg: 0, sprite: "upperLeg"},
            lowerLegRight: { x: 35, y: 255, deg: 22.5, sprite: "lowerLeg" },
            footRight: { x: 18, y: 300, deg: 7, sprite: "foot" },
            upperArmLeft: { x: 45, y: 99, deg: 1, sprite: "upperArm"},
            foreArmLeft: { x: -6, y: 185, deg: 7.5, sprite: "foreArm"},
            psiLeft: { x: -14, y: 106, deg: 7.5, sprite: "psi"},
            upperArmRight: { x: 46, y: 101, deg: -6.5, sprite: "upperArm"},
            foreArmRight: { x: 22, y: 192.5, deg: -10, sprite: "foreArm"},
            psiRight: { x: 16, y: 100, deg: -10, sprite: "psi"},
        }
    },
};

const ongoingCharPromises = {};

// this returns a promise so it shouldn't be used in the renderer (other than to start the image creation)
export function getCustomCharImage(id) {
    let sheetURL;
    if (typeof id === "string" && id.charAt(0) === "c") {
        sheetURL = `/mimage_cache.php?image_id=${id.slice(1)}`;
    }
    else {
        sheetURL = `/mimage_cache.php?image_id=${id}`;
        id = "c" + id;
    }

    if (CACHED_CHARS[id]?.loaded) return Promise.resolve(CACHED_CHARS[id]);
    if (id in ongoingCharPromises) return ongoingCharPromises[id];

    CACHED_CHARS[id] = new Image();
    CACHED_CHARS[id].loaded = false;
    CACHED_CHARS[id].native = false;

    const sheet = new Image();
    CACHED_CHARS[id].spriteSheet = sheet;
    CACHED_CHARS[id].charJSON = null;

    ongoingCharPromises[id] = new Promise((resolve, reject) => {
        sheet.src = sheetURL;
        sheet.onload = () => resolve(sheet);
        sheet.onerror = () => reject(new Error(`Failed to load spritesheet ${id}`));
    })
    .then(sheet => {
        CACHED_CHARS[id].spriteSheet = sheet;
        CACHED_CHARS[id].charJSON = readImageJSON(sheet, 0, 0, 16, 128);
        return makeSkinPreviewImage(sheet, CACHED_CHARS[id].charJSON);
    })
    .then(objectURL => {
        CACHED_CHARS[id].src = objectURL;
        CACHED_CHARS[id].loaded = true;
        delete ongoingCharPromises[id];
        return CACHED_CHARS[id];
    })
    .catch(e => {
        console.error(e);
        delete ongoingCharPromises[id];
        return CACHED_CHARS[id];
    });

    return ongoingCharPromises[id];
}

async function makeSkinPreviewImage(spritesheet, charJSON) {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 260;
    const ctx = canvas.getContext("2d");

    ctx.scale(0.5, 0.5); //spritesheet is 2x resolution

    const psiBlend = isNaN(charJSON.swords) ? 0 : parseInt(charJSON.swords);

    for (const part of charPoses.standing.drawOrder) {
        const { x, y, deg, sprite } = charPoses.standing.parts[part];
        const { sx, sy, sw, sh } = spriteRects[sprite];
        ctx.save();
        ctx.translate(x + sw/2, y + sh/2);
        ctx.rotate(deg * Math.PI / 180);
        if (sprite === "psi") {
            ctx.globalCompositeOperation = "lighter";
            if (psiBlend === 1) {
                ctx.globalCompositeOperation = "source-over";
            }
            else if (psiBlend === 2) {
                ctx.globalCompositeOperation = "multiply";
            }
        }
        ctx.drawImage(spritesheet, sx, sy, sw, sh, -sw/2, -sh/2, sw, sh);
        ctx.restore();
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    return blob === null ? "" : URL.createObjectURL(blob);
}

/**
 * reads binary stored in the pixels of the image. each color channel (RGB) encodes 1 bit (either greater or less than 127).  
 * binary is read in RGB and row-major order. alpha channel is skipped.
 */
function readImageJSON(img, sx, sy, sw, sh) {
    function getImageData(img, sx, sy, sw, sh) {
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        return ctx.getImageData(0, 0, sw, sh);
    }

    const imageData = getImageData(img, sx, sy, sw, sh);

    let binaryString = "";
    imageData.data.forEach((colorValue, index) => {
        if (index % 4 !== 3) { // skip alpha channel
            binaryString += colorValue > 127 ? "1" : "0";
        }
    });

    let jsonString = "";
    for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.slice(i, i + 8);
        const charCode = parseInt(byte, 2);
        if (charCode === 0) break;
        jsonString += String.fromCharCode(charCode);
    }

    try {
        return JSON.parse(jsonString);
    }
    catch(e) {
        console.warn("Failed to parse json. It's probably invalid or not included.\n", e, "\nInput:", jsonString);
        return null;
    }
}