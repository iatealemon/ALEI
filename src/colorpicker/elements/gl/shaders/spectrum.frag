precision mediump float;

varying vec2 vertex_position;

uniform float hue;

vec3 hsvToRgb(float h, float s, float v) {
    h /= 60.0;
    float c = v * s;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    float m = v - c;
    vec3 rgb;

    if (h < 1.0) {
        rgb = vec3(c, x, 0.0);
    } else if (h < 2.0) {
        rgb = vec3(x, c, 0.0);
    } else if (h < 3.0) {
        rgb = vec3(0.0, c, x);
    } else if (h < 4.0) {
        rgb = vec3(0.0, x, c);
    } else if (h < 5.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }

    return rgb + m;
}

void main() {
    // saturation is from x coordinate and value is from y coordinate
    float saturation = vertex_position.x * 0.5 + 0.5; // range [-1, 1] -> [0, 1]
    float value = vertex_position.y * 0.5 + 0.5;
    vec3 rgb = hsvToRgb(hue, saturation, value);

    gl_FragColor = vec4(rgb, 1.0);
}