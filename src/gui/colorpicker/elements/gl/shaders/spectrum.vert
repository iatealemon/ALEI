precision mediump float;

attribute vec2 in_position;
varying vec2 vertex_position;

void main() {
    vertex_position = in_position;
    gl_Position = vec4(in_position, 0.0, 1.0);
}