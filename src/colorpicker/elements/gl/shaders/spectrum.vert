#version 300 es

in vec2 in_position;
out vec2 vertex_position;

void main() {
    vertex_position = in_position;
    gl_Position = vec4(in_position, 0, 1);
}