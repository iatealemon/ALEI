import { createShader, createProgram } from "./glhelper.js";
import vertexShaderSource from "./shaders/spectrum.vert";
import fragmentShaderSource from "./shaders/spectrum.frag";

export class ColorSpectrumGLHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
        if (!this.gl) {
            // WebGL2 not supported
            this.gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
            if (!this.gl) {
                console.error("WebGL not supported");
                NewNote("The color selector won't work because WebGL is not supported in your browser. Try updating your browser.", note_bad);
                return;
            }
        }
        const gl = this.gl; //temporary alias

        this.currentHue = 0;

        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.target === this.canvas) {
                    this.updateCanvasSize();
                }
            }
        });
        this.resizeObserver.observe(this.canvas);
        //this.updateCanvasSize();

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = createProgram(gl, vertexShader, fragmentShader);

        this.hueUniformLocation = gl.getUniformLocation(this.program, "hue");

        const vertices = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0
        ]);
    
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(this.program, "in_position");
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);
    }

    draw(hue) {
        this.gl.useProgram(this.program);

        this.gl.uniform1f(this.hueUniformLocation, hue); // set hue variable

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.currentHue = hue;
    }

    readPixelRGB(mousePosX, mousePosY) {
        let pixelPosX = Math.floor(this.gl.drawingBufferWidth * (mousePosX / this.canvas.clientWidth));
        let pixelPosY = Math.floor(this.gl.drawingBufferHeight * (mousePosY / this.canvas.clientHeight));
        pixelPosY = (this.gl.drawingBufferHeight - 1) - pixelPosY; // flip y coord because webgl origin is bottom-left
        const pixel = new Uint8Array(4);
        this.gl.readPixels(pixelPosX, pixelPosY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
        return {
            red: pixel[0],
            green: pixel[1],
            blue: pixel[2]
        };
    }

    updateCanvasSize() {
        if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            unsafeWindow.requestAnimationFrame(() => this.draw(this.currentHue));
        }
    }

    // debug function. currently gives this output when hue=0:
    // bottom left: (1, 1, 1)
    // top left: (254, 254, 254)
    // bottom right: (1, 0, 0)
    // top right: (254, 0, 0)
    // i tried to fix this inaccuracy but idk what causes it.
    checkCorners() {
        const xMax = this.gl.drawingBufferWidth - 1;
        const yMax = this.gl.drawingBufferHeight - 1;

        let pixel = new Uint8Array(4);

        this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
        console.log(`bottom left: (${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);

        this.gl.readPixels(0, yMax, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
        console.log(`top left: (${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);

        this.gl.readPixels(xMax, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
        console.log(`bottom right: (${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);

        this.gl.readPixels(xMax, yMax, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
        console.log(`top right: (${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
    }
}