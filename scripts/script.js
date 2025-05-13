
console.log("Hello World");
const dpr = window.devicePixelRatio || 1;

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: true });

document.getElementById('create-button').addEventListener('click', () => {
    const checkerbg = document.getElementById('checker-bg');

    // const x = Math.round(document.getElementById('width-input').value / dpr);
    // const y = Math.round(document.getElementById('height-input').value / dpr);
    const x = Math.round(document.getElementById('width-input').value);
    const y = Math.round(document.getElementById('height-input').value);

    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    checkerbg.style.width = x + 'px';
    checkerbg.style.height = y + 'px';

    // checkerbg.style.left = `calc(50vw - (0.5 * ${x}px)`;
    // checkerbg.style.top = `calc(50vh - (0.5 * ${y}px)`;

    // checkerbg.style.left = `calc(max(0px, (100% - ${x}px)*0.5))`;
    // checkerbg.style.top = `calc(max(0px, (100% - ${y}px)*0.5))`;

    document.getElementById('bgorigin').style.transform = `translate(50vw, 50vh)`

    canvas.width = x;
    canvas.height = y;

    // ctx.scale(1 / dpr, 1 / dpr);

    checkerbg.appendChild(canvas);

    gl.clearColor(0, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);

    test(x, y);

    scrollBackground();

    document.getElementById('create-panel').remove();
    // window.getSelection().removeAllRanges(); // Clear any existing selection
});


// const scrollBackground = () => {
//     const bground = document.getElementById('bground');
//     const bgorig = document.getElementById('bgorigin');

//     // Center the origin element
//     bgorig.style.left = `50%`;
//     bgorig.style.top = `50%`;

//     const activePointers = new Map(); // Object to store per-pointer state

//     function beginPan(e) {
//         activePointers.set(e.pointerId, {
//             clientX: e.clientX,
//             clientY: e.clientY,
//         });
//     }

//     function handlePan(e) {
//         if (!activePointers.has(e.pointerId)) return;

//         const data = activePointers.get(e.pointerId);

//         // Calculate delta using the current stored values
//         const deltaX = e.clientX - data.clientX;
//         const deltaY = e.clientY - data.clientY;

//         // Update the element's position
//         bgorig.style.left = `${bgorig.offsetLeft + deltaX}px`;
//         bgorig.style.top = `${bgorig.offsetTop + deltaY}px`;

//         // Update the existing pointer data
//         data.clientX = e.clientX;
//         data.clientY = e.clientY;
//     }

//     function endPan(e) {
//         activePointers.delete(e.pointerId);
//     }

//     bground.addEventListener("pointerdown", beginPan);
//     document.addEventListener("pointermove", handlePan);
//     document.addEventListener("pointerup", endPan);
//     document.addEventListener("pointercancel", endPan);

//     // scroll --^
//     //
//     //  zoom ---v

//     let scale = 1;
//     const snapValues = [0.0625, 0.125, 0.25, 1, 2, 4, 8, 16, 32];
//     const tolerance = 0.05;

//     function handleZoom(e) {
//         const oldscale = scale;
//         scale = scale * Math.pow(2, (-e.deltaY) * 0.001);
//         for (val of snapValues) {
//             if (Math.abs(1 - scale / val) > tolerance) continue;
//             scale = val;
//             break;
//         }
//         bgorig.style.scale = `${scale}`;

//         // change offsets so that transform origin is on top of cursor (magic function tbh)
//         const newxoff = e.clientX - (e.clientX - bgorig.offsetLeft) * (scale / oldscale);
//         const newyoff = e.clientY - (e.clientY - bgorig.offsetTop) * (scale / oldscale);

//         bgorig.style.left = `${newxoff}px`;
//         bgorig.style.top = `${newyoff}px`;
//     }

//     bground.addEventListener("wheel", handleZoom);
// };


const scrollBackground = () => {
    const bground = document.getElementById('bground');
    const bgorig = document.getElementById('bgorigin');

    const bgbcr = bgorig.getBoundingClientRect();
    let transX = bgbcr.left;
    let transY = bgbcr.top;

    const activePointers = new Map(); // Object to store per-pointer state

    function beginPan(e) {
        activePointers.set(e.pointerId, {
            clientX: e.clientX,
            clientY: e.clientY,
        });
        document.addEventListener("pointermove", handlePan);
    }

    function handlePan(e) {
        if (!activePointers.has(e.pointerId)) return;

        const data = activePointers.get(e.pointerId);

        // Calculate delta using the current stored values
        const deltaX = e.clientX - data.clientX;
        const deltaY = e.clientY - data.clientY;

        // Update the global translation state
        transX += deltaX;
        transY += deltaY;

        // Update the element's position
        // bgorig.style.transitionDuration = '0ms';
        bgorig.style.transform = `translate(${transX}px, ${transY}px) scale(${currentZoom})`;

        // Update the existing pointer data
        data.clientX = e.clientX;
        data.clientY = e.clientY;
    }

    function endPan(e) {
        activePointers.delete(e.pointerId);
        if (activePointers.size === 0) {
            document.removeEventListener("pointermove", handlePan);
        }
    }

    bground.addEventListener("pointerdown", beginPan);
    document.addEventListener("pointerup", endPan);
    document.addEventListener("pointercancel", endPan);

    // scroll --^
    //
    //  zoom ---v

    let rawZoom = 1, currentZoom = 1;
    const snapValues = [1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 1 / 1.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
    const tolerance = 0.0625;

    function handleZoom(e) {
        // e.preventDefault();
        const oldZoom = currentZoom;
        rawZoom = rawZoom * Math.pow(2, (-e.deltaY) * 0.002);
        currentZoom = rawZoom;

        // Snap to one of your predefined snap values if close enough:
        for (const snap of snapValues) {
            const zoomSnapDiff = Math.abs(1 - rawZoom / snap);
            if (zoomSnapDiff > tolerance) continue;
            currentZoom = snap;
            break;
        }

        // Adjust the translation offsets so that the zoom is centered on the pointer.
        transX = e.clientX - (e.clientX - transX) * (currentZoom / oldZoom);
        transY = e.clientY - (e.clientY - transY) * (currentZoom / oldZoom);

        // Apply both translate and scale in a single transform.
        // bgorig.style.transitionDuration = '100ms';
        bgorig.style.transform = `translate(${transX}px, ${transY}px) scale(${currentZoom})`;
    }

    bground.addEventListener("wheel", handleZoom);
};


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

    void main() {
        vec2 fragCoord = gl_FragCoord.xy; // Use raw pixel coordinates
        vec2 center = u_resolution * 0.5; // Center of the screen in pixels
        float pct = distance(fragCoord, center); // Distance from center
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
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

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
}