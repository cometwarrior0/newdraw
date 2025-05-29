let canvas, gl;

self.addEventListener('message', (e) => {
  const { type } = e.data;

  if (type === 'init') {
    canvas = e.data.canvas;
    ctx = canvas.getContext('webgl2');
    if (!ctx) {
      alert(
        "Unable to initialize WebGL2. Your browser or machine may not support it.",
      );
      return;
    }
    init();
  }

  // Handle pointer events or other drawing instructions
  else if (type === 'pointerMove') {
    const { x, y, r, c } = e.data;
    // Example: Draw a circle where the pointer was pressed
    drawCircle(x, y, r, c);
  }
  // More cases can be added (pointerMove, pointerUp, etc.)
});

// Helper function to draw a circle
function drawCircle(x, y, radius = 20, color = [0, 1, 0, 1]) {
  // code here, need to add texture/framebuffer and stuff i think?
}



var vertexShaderSource = /*glsl*/`#version 300 es

  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec4 a_position;

  // all shaders have a main function
  void main() {
    gl_Position = a_position;
  }
`;

var fragmentShaderSource = /*glsl*/`#version 300 es

  // fragment shaders don't have a default precision so we need
  // to pick one. highp is a good default. It means "high precision"
  precision highp float;

  uniform vec4 u_color;

  // we need to declare an output for the fragment shader
  out vec4 outColor;

  void main() {
    // Just set the output to a constant redish-purple
    outColor = u_color;
  }
`;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

function init() {
  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(ctx, ctx.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(ctx, ctx.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  var program = createProgram(ctx, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = ctx.getAttribLocation(program, "a_position");
  
  // look up uniform locations
  var colorLocation = ctx.getUniformLocation(program, "u_color");

  // Create a buffer and put three 2d clip space points in it
  var positionBuffer = ctx.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);

  var positions = [
    -1, -1,
    1, 1,
    -1, 1,
    -1, -1,
    1, 1,
    1, -1,
  ];
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(positions), ctx.STATIC_DRAW);

  // Create a vertex array object (attribute state)
  var vao = ctx.createVertexArray();

  // and make it the one we're currently working with
  ctx.bindVertexArray(vao);

  // Turn on the attribute
  ctx.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = ctx.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  ctx.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

  // Tell WebGL how to convert from clip space to pixels
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Clear the canvas
  ctx.clearColor(0, 0, 0, 0);
  ctx.clear(ctx.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  ctx.useProgram(program);

  // Bind the attribute/buffer set we want.
  ctx.bindVertexArray(vao);

  // Set a random color.
  ctx.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

  // draw
  var primitiveType = ctx.TRIANGLES;
  var offset = 0;
  var count = 6;
  ctx.drawArrays(primitiveType, offset, count);
}