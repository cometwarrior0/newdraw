console.log("Hello World");
const checkerbg = document.getElementById('checker-bg');
const dpr = window.devicePixelRatio || 1;

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: true });

document.getElementById('create-button').addEventListener('click', () => {
    const x = Math.round(document.getElementById('width-input').value / dpr);
    const y = Math.round(document.getElementById('height-input').value / dpr);

    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    checkerbg.style.width = x + 'px';
    checkerbg.style.height = y + 'px';

    checkerbg.style.left = `calc(50vw - (0.5 * ${x}px)`;
    checkerbg.style.top = `calc(50vh - (0.5 * ${y}px)`;

    canvas.width = x;
    canvas.height = y;
    // ctx.scale(1 / dpr, 1 / dpr);
    checkerbg.appendChild(canvas);
    gl.clearColor(0, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);
    shadertmp();

    document.getElementById('create-panel').remove();
});

let vertexShaderText = `
precision mediump float;

attribute vec2 vertPosition;

void main(){
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`;

let fragmentShaderText = `
precision mediump float;

void main(){
    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
`

function shadertmp() {
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.warn("ERROR COMPILING VERTEX SHADER: " + gl.getShaderInfoLog(vertexShader));

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.warn("ERROR COMPILING VERTEX SHADER: " + gl.getShaderInfoLog(vertexShader));

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.warn("ERROR LINKING PROGRAM: " + gl.getProgramInfoLog(program));
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        console.warn("ERROR VALIDATING PROGRAM: " + gl.getProgramInfoLog(program));

    //
    // Create buffer
    //

    let triangleVertices =
        new Float32Array([ // X, Y
            0.0, 0.5,
            -0.5, -0.5,
            0.5, -0.5
        ])

    let triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(positionAttribLocation, // Attribute location
        2, // Number of elements per attribute (X,Y)
        gl.FLOAT, // Type of each component
        false, // Normalized? (bool)
        2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0
    ); // Offset from the beginning of a single vertex to this attribute

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
