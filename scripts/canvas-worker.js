// let ctx;
// const TWOPI = Math.PI * 2;
// self.addEventListener('message', (e) => {
//   const { type } = e.data;

//   if (type === 'init') {
//     // The initial message contains the OffscreenCanvas
//     const offscreenCanvas = e.data.canvas;
//     ctx = offscreenCanvas.getContext('2d');
//     // Optionally, set initial canvas properties
//     ctx.fillStyle = 'white';
//     ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
//   }

//   // Handle pointer events or other drawing instructions
//   else if (type === 'pointerMove') {
//     const { x, y } = e.data;
//     // Example: Draw a circle where the pointer was pressed
//     drawCircle(x, y, 20, 'red');
//   }
//   // More cases can be added (pointerMove, pointerUp, etc.)
// });

// // Helper function to draw a circle
// function drawCircle(x, y, radius, color) {
//   if (!ctx) return;
//   ctx.fillStyle = color;
//   ctx.beginPath();
//   ctx.arc(x, y, radius, 0, TWOPI);
//   ctx.fill();
// }




// Global variables
let gl, canvasWidth, canvasHeight;
let circleProgram, textureProgram;
let quadVAO;
let strokeFBO, strokeTexture;
let committedFBO, committedTexture;

const uniforms = {
  circle: {},
  texture: {},
};

let isPointerDown = false;
let strokeSettings = {
  radius: 20,
  color: [1, 0, 0, 0.5],
  intraAlphaMode: 'maximum'
};

// Shaders
const quadVS = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_position * 0.5 + 0.5;
}`;

const circleFS = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_circleCenter;
uniform float u_circleRadius;
uniform vec4 u_baseColor;
uniform bool u_outputPremultiplied;
out vec4 outColor;
void main() {
  float dist = distance(gl_FragCoord.xy, u_circleCenter);
  float softness = 1.0;
  float aa_alpha = smoothstep(u_circleRadius + softness, u_circleRadius - softness, dist);
  float effective_alpha = u_baseColor.a * aa_alpha;
  if (u_outputPremultiplied) {
    outColor = vec4(u_baseColor.rgb * effective_alpha, effective_alpha);
  } else {
    outColor = vec4(u_baseColor.rgb, effective_alpha);
  }
}`;

const textureFS = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;
void main() {
  outColor = texture(u_texture, v_texCoord);
}`;

// Message handler (e.g. when used in a worker)
self.onmessage = (e) => {
  const { type, ...data } = e.data;
  switch (type) {
    case 'init':
      initGL(data.canvas);
      if (gl) {
        // Clear the main canvas and committed framebuffer.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, committedFBO);
        gl.clearColor(1, 1, 1, 1); // Adjust for transparent if needed (e.g. 0,0,0,0)
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      break;
    case 'pointerDown':
      isPointerDown = true;
      strokeSettings.radius = data.radius || strokeSettings.radius;
      strokeSettings.color = data.color || strokeSettings.color;
      if (data.strokeOptions?.intraStrokeAlphaMode === 'maximum') {
        strokeSettings.intraAlphaMode = data.strokeOptions.intraStrokeAlphaMode;
      }
      // Copy current main canvas into the committed framebuffer.
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, committedFBO);
      gl.blitFramebuffer(
        0, 0, canvasWidth, canvasHeight,
        0, 0, canvasWidth, canvasHeight,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );
      // Clear the stroke framebuffer for a new stroke.
      gl.bindFramebuffer(gl.FRAMEBUFFER, strokeFBO);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawSegmentAndComposite(data.x, data.y);
      break;
    case 'pointerMove':
      if (isPointerDown) {
        strokeSettings.radius = data.radius || strokeSettings.radius;
        strokeSettings.color = data.color || strokeSettings.color;
        drawSegmentAndComposite(data.x, data.y);
      }
      break;
    case 'pointerUp':
      if (isPointerDown) {
        isPointerDown = false;
        postMessage({ finishedDrawingStroke: true });
      }
      break;
  }
};

function initGL(canvas) {
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  if (!gl) {
    console.error("WebGL2 is not available");
    return;
  }

  // Create programs
  circleProgram = createProgram(
    compileShader(gl.VERTEX_SHADER, quadVS),
    compileShader(gl.FRAGMENT_SHADER, circleFS)
  );
  textureProgram = createProgram(
    compileShader(gl.VERTEX_SHADER, quadVS),
    compileShader(gl.FRAGMENT_SHADER, textureFS)
  );
  if (!circleProgram || !textureProgram) return;

  // Retrieve uniform locations
  uniforms.circle.resolution = gl.getUniformLocation(circleProgram, "u_resolution");
  uniforms.circle.circleCenter = gl.getUniformLocation(circleProgram, "u_circleCenter");
  uniforms.circle.circleRadius = gl.getUniformLocation(circleProgram, "u_circleRadius");
  uniforms.circle.baseColor = gl.getUniformLocation(circleProgram, "u_baseColor");
  uniforms.circle.outputPremultiplied = gl.getUniformLocation(circleProgram, "u_outputPremultiplied");
  uniforms.texture.texture = gl.getUniformLocation(textureProgram, "u_texture");

  // Create a shared full-screen quad
  const quadPositions = new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]);
  quadVAO = gl.createVertexArray();
  gl.bindVertexArray(quadVAO);
  posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
  // Both programs use the attribute named "a_position"
  const posLoc = gl.getAttribLocation(circleProgram, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // Create framebuffers
  const strokeFBObject = createFramebufferAndTexture(gl, canvasWidth, canvasHeight);
  strokeFBO = strokeFBObject.fbo;
  strokeTexture = strokeFBObject.texture;

  const commitFBObject = createFramebufferAndTexture(gl, canvasWidth, canvasHeight);
  committedFBO = commitFBObject.fbo;
  committedTexture = commitFBObject.texture;

  gl.enable(gl.BLEND);
}

function drawSegmentAndComposite(x, y) {
  if (!gl) return;

  // 1. Draw new circle segment into the stroke framebuffer.
  gl.bindFramebuffer(gl.FRAMEBUFFER, strokeFBO);
  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.useProgram(circleProgram);
  gl.bindVertexArray(quadVAO);
  gl.uniform2f(uniforms.circle.resolution, canvasWidth, canvasHeight);
  gl.uniform2f(uniforms.circle.circleCenter, x, canvasHeight - y);
  gl.uniform1f(uniforms.circle.circleRadius, strokeSettings.radius);
  gl.uniform4fv(uniforms.circle.baseColor, strokeSettings.color);
  gl.enable(gl.BLEND);
  if (strokeSettings.intraAlphaMode === 'maximum') {
    gl.uniform1i(uniforms.circle.outputPremultiplied, 0);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
  } else {
    gl.uniform1i(uniforms.circle.outputPremultiplied, 1);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 2. Composite: draw the committed strokes and overlay the new stroke.
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.useProgram(textureProgram);
  gl.bindVertexArray(quadVAO);
  gl.activeTexture(gl.TEXTURE0);

  // Draw committed strokes (without blending)
  gl.bindTexture(gl.TEXTURE_2D, committedTexture);
  gl.uniform1i(uniforms.texture.texture, 0);
  gl.disable(gl.BLEND);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Overlay new stroke (with blending)
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindTexture(gl.TEXTURE_2D, strokeTexture);
  gl.uniform1i(uniforms.texture.texture, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindVertexArray(null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`Shader (${type === gl.VERTEX_SHADER ? "VS" : "FS"}) error:`, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vs, fs) {
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createFramebufferAndTexture(glCtx, width, height) {
  const texture = glCtx.createTexture();
  glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
  glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, width, height, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, null);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);

  const fbo = glCtx.createFramebuffer();
  glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo);
  glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, texture, 0);
  if (glCtx.checkFramebufferStatus(glCtx.FRAMEBUFFER) !== glCtx.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incomplete");
  }
  glCtx.bindTexture(glCtx.TEXTURE_2D, null);
  glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, null);
  return { fbo, texture };
}
