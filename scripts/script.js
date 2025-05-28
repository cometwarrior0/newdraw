import { handlePointerEvents } from './main-pointer-handler.mjs';

console.log("Hello World");
const dpr = window.devicePixelRatio || 1;

const ctx = document.createElement('canvas');
// const gl = ctx.getContext('webgl2', { antialias: false, alpha: true }) || ctx.getContext('webgl', { antialias: false, alpha: true });

document.getElementById('create-button').addEventListener('click', () => {
    const checkerbg = document.getElementById('checker-bg');

    const x = Math.round(document.getElementById('width-input').value);
    const y = Math.round(document.getElementById('height-input').value);

    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    checkerbg.style.width = x + 'px';
    checkerbg.style.height = y + 'px';

    document.getElementById('bgorigin').style.transform = `translate(${(bground.offsetWidth / 2) | 0}px, ${(bground.offsetHeight / 2) | 0}px)`

    ctx.width = x;
    ctx.height = y;

    checkerbg.appendChild(ctx);

    const offscreenCanvas = ctx.transferControlToOffscreen();

    const worker = new Worker('scripts/canvas-worker.js');
    worker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);

    // gl.clearColor(0, 0.5, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // gl.viewport(0, 0, ctx.width, ctx.height);

    // test(x, y);

    handlePointerEvents(document.getElementById('bgorigin'), worker, { x: 16384 - x / 2, y: 16384 - y / 2 });

    document.getElementById('create-panel').remove();

    window.getSelection().removeAllRanges(); // Clear any existing selection
});


function test(x, y) {
    // Vertex Shader (Just passes positions)
    const vsSource = /*glsl*/`
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment Shader (Determines circle using distance)
    const fsSource = /*glsl*/`
        precision mediump float;
        uniform vec2 u_resolution; // Define resolution as a uniform
        uniform float u_time;

        void main() {
            vec2 fragCoord = gl_FragCoord.xy; // Use raw pixel coordinates
            vec2 center = u_resolution * 0.5; // Center of the screen in pixels
            float pct = distance(fragCoord, (center + u_time)); // Distance from center
            vec4 col = vec4(pct);
            col = 1. - smoothstep(25., 26., col);

            gl_FragColor = col;
        }
    `;

    // Create and link shader program
    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set the uniform resolution value after using the program
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, ctx.width, ctx.height);

    // Helper function to compile shaders
    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    // Quad vertices covering the entire screen
    const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]);


    // Create buffer and bind attributes
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw the full-screen quad
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);


    // Get the location of u_time in the shader
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    function render(time) {
        // Convert time to seconds
        let timeInSeconds = time * 0.001;

        // Set the uniform value
        gl.uniform1f(timeUniformLocation, timeInSeconds);

        // Render the scene
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Request the next frame
        requestAnimationFrame(render);
    }

    // Start animation loop
    requestAnimationFrame(render);
}