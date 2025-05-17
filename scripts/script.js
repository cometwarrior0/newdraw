
console.log("Hello World");
const dpr = window.devicePixelRatio || 1;

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: true });

const bground = document.getElementById('bground');

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

    document.getElementById('bgorigin').style.transform = `translate(${bground.offsetWidth / 2}px, ${bground.offsetHeight / 2}px)`

    canvas.width = x;
    canvas.height = y;

    // ctx.scale(1 / dpr, 1 / dpr);

    checkerbg.appendChild(canvas);

    gl.clearColor(0, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);

    test(x, y);

    bgPointerPos();
    scrollBackground();

    document.getElementById('create-panel').remove();
    // window.getSelection().removeAllRanges(); // Clear any existing selection
});


const activePointers = new Map();
let pointerX = 0;
let pointerY = 0;

const bgPointerPos = () => {
    function handleDown(e) {
        activePointers.set(e.pointerId, {
            pointerType: e.pointerType,
            startX: e.clientX,
            startY: e.clientY,
            prevX: e.clientX,
            prevY: e.clientY,
            x: e.clientX,
            y: e.clientY,
            deltaX: 0,
            deltaY: 0,
            totalDeltaX: 0,
            totalDeltaY: 0,
            lastUpdate: Date.now(), // Track last update time
        });
    }

    function handleMove(e) {
        pointerX = e.clientX;
        pointerY = e.clientY;

        const prevPointer = activePointers.get(e.pointerId);
        if (!prevPointer) return;

        activePointers.set(e.pointerId, {
            ...prevPointer, // adds values from previous pointer so that startX startY pointerType are preserved
            prevX: prevPointer.x,
            prevY: prevPointer.y,
            x: e.clientX,
            y: e.clientY,
            deltaX: e.clientX - prevPointer.x,
            deltaY: e.clientY - prevPointer.y,
            totalDeltaX: e.clientX - prevPointer.startX,
            totalDeltaY: e.clientY - prevPointer.startY,
            lastUpdate: Date.now(), // Track last update time
        });
    }

    function handleUp(e) {
        activePointers.delete(e.pointerId);
    }

    // Cleanup function to remove old pointers
    function cleanUpPointers(timeout = 10000) {
        const now = Date.now();
        activePointers.forEach((pointer, id) => {
            if (now - pointer.lastUpdate > timeout) {
                activePointers.delete(id);
            }
        });
    }

    // Run cleanup periodically
    setInterval(() => cleanUpPointers(), 10000);

    bground.addEventListener('pointerdown', handleDown);
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);

}


const scrollBackground = () => {
    const bgorig = document.getElementById('bgorigin');

    const bgbcr = bgorig.getBoundingClientRect();
    let transX = bgbcr.left;
    let transY = bgbcr.top;

    function handlePan(e) {
        const data = activePointers.get(e.pointerId);
        if (!data) return;

        // Update global state
        transX += data.deltaX;
        transY += data.deltaY;

        // Construct the transform.
        bgorig.style.transform = `
        translate(${transX}px, ${transY}px)
        scale(${currentZoom})
        `;
    }

    document.addEventListener('pointermove', handlePan);

    // scroll --^
    //
    //  zoom ---v

    let rawZoom = 1, currentZoom = 0;
    const snapValues = [1 / 32, 1 / 24, 1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 1 / 1.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
    const tolerance = 0.0625;

    function getDistance(touch1, touch2) {
        const dx = touch2.pageX - touch1.pageX;
        const dy = touch2.pageY - touch1.pageY;
        return Math.hypot(dx + dy);
    }


    function handleTwoFinger(e) {
        if (e.touches.length === 2) {
            e.preventDefault();

        }
        let tmpR = e.deltaY / 10000;
        currentZoom += tmpR;

        // Save the original values to avoid interfering between calculations:
        const oldX = transX;
        const oldY = transY;

        // Rotate the point (transX, transY) around the pivot (e.clientX, e.clientY)
        transX = Math.cos(tmpR) * (oldX - e.clientX) - Math.sin(tmpR) * (oldY - e.clientY) + e.clientX;
        transY = Math.sin(tmpR) * (oldX - e.clientX) + Math.cos(tmpR) * (oldY - e.clientY) + e.clientY;


        // Apply both translate and scale in a single transform.
        // bgorig.style.transitionDuration = '100ms';
        bgorig.style.transform = `
        translate(${transX}px, ${transY}px)
        rotate(${currentZoom}rad)
        `;
    }

    // function handleZoom(e) {
    //     e.preventDefault();
    //     const oldZoom = currentZoom;
    //     rawZoom = rawZoom * Math.pow(2, (-e.deltaY) * 0.002);
    //     currentZoom = rawZoom;

    //     // Snap to one of your predefined snap values if close enough:
    //     for (const snap of snapValues) {
    //         const zoomSnapDiff = Math.abs(1 - rawZoom / snap);
    //         if (zoomSnapDiff > tolerance) continue;
    //         currentZoom = snap;
    //         break;
    //     }

    //     // Adjust the translation offsets so that the zoom is centered on the pointer.
    //     transX = pointerX - (pointerX - transX) * (currentZoom / oldZoom);
    //     transY = pointerY - (pointerY - transY) * (currentZoom / oldZoom);

    //     // Apply both translate and scale in a single transform.
    //     // bgorig.style.transitionDuration = '100ms';
    //     bgorig.style.transform = `
    //     translate(${transX}px, ${transY}px)
    //     scale(${currentZoom})
    //     `;
    // }

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