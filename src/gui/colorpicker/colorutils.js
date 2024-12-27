export function rgbToHex(rgbColor) {
    let r = rgbColor.red.toString(16);
    let g = rgbColor.green.toString(16);
    let b = rgbColor.blue.toString(16);
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
    return "#" + r + g + b;
}

export function hexToRGB(hex) {
    const asInt = parseInt(hex.substring(1), 16);
    const r = (asInt >> 16) & 255;
    const g = (asInt >> 8) & 255;
    const b = asInt & 255;
    return {
        red: r,
        green: g,
        blue: b
    };
}

export function hueFromRGB(rgbColor) {
    let R = rgbColor.red / 255;
    let G = rgbColor.green / 255;
    let B = rgbColor.blue / 255;
    let colorMax = Math.max(R, G, B);
    let colorMin = Math.min(R, G, B);
    let chroma = colorMax - colorMin;

    let hue;
    if (chroma == 0) {
        hue = 0;
    }
    else if (colorMax == R) {
        hue = 60 * (((G - B) / chroma) % 6);
    }
    else if (colorMax == G) {
        hue = 60 * (((B - R) / chroma) + 2);
    }
    else if (colorMax == B) {
        hue = 60 * (((R - G) / chroma) + 4);
    }
    if (hue < 0) {
        hue += 360;
    }
    return hue;
}

// https://gist.github.com/mjackson/5311256
export function rgbToHSV(rgb) {
    const r = rgb.red / 255;
    const g = rgb.green / 255;
    const b = rgb.blue / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;

    let d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    }
    else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h *= 60; // original divides by 6 to get hue in 0-1. multiplying by 360 to get range 0-360 simplifies to this
    }

    return {
        hue: h,
        saturation: s,
        value: v
    };
}

export function hsvToRGB(hsv) {
    const h = hsv.hue / 360;
    const s = hsv.saturation;
    const v = hsv.value;
    let r, g, b;

    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {
        red: Math.round(r * 255),
        green: Math.round(g * 255),
        blue: Math.round(b * 255)
    };
}

export function rgbToHSL(rgb) {
    const r = rgb.red / 255;
    const g = rgb.green / 255;
    const b = rgb.blue / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    }
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h *= 60; // original divides by 6 to get hue in 0-1. multiplying by 360 to get range 0-360 simplifies to this
    }

    return {
        hue: h,
        saturation: s,
        lightness: l
    };
}

export function hslToRGB(hsl) {
    const h = hsl.hue / 360;
    const s = hsl.saturation;
    const l = hsl.lightness;
    let r, g, b;

    if (s == 0) {
        r = g = b = hsl.lightness; // achromatic
    }
    else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        red: Math.round(r * 255),
        green: Math.round(g * 255),
        blue: Math.round(b * 255)
    };
}