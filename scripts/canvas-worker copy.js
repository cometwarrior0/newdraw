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
      if (ctx) {
        // Clear the main canvas and committed framebuffer.
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        ctx.clearColor(1, 1, 1, 1);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, committedFBO);
        ctx.clearColor(1, 1, 1, 1); // Adjust for transparent if needed (e.g. 0,0,0,0)
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
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
      ctx.bindFramebuffer(ctx.READ_FRAMEBUFFER, null);
      ctx.bindFramebuffer(ctx.DRAW_FRAMEBUFFER, committedFBO);
      ctx.blitFramebuffer(
        0, 0, canvasWidth, canvasHeight,
        0, 0, canvasWidth, canvasHeight,
        ctx.COLOR_BUFFER_BIT,
        ctx.NEAREST
      );
      // Clear the stroke framebuffer for a new stroke.
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, strokeFBO);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
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
  ctx = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  if (!ctx) {
    console.error("WebGL2 is not available");
    return;
  }

  // Create programs
  circleProgram = createProgram(
    compileShader(ctx.VERTEX_SHADER, quadVS),
    compileShader(ctx.FRAGMENT_SHADER, circleFS)
  );
  textureProgram = createProgram(
    compileShader(ctx.VERTEX_SHADER, quadVS),
    compileShader(ctx.FRAGMENT_SHADER, textureFS)
  );
  if (!circleProgram || !textureProgram) return;

  // Retrieve uniform locations
  uniforms.circle.resolution = ctx.getUniformLocation(circleProgram, "u_resolution");
  uniforms.circle.circleCenter = ctx.getUniformLocation(circleProgram, "u_circleCenter");
  uniforms.circle.circleRadius = ctx.getUniformLocation(circleProgram, "u_circleRadius");
  uniforms.circle.baseColor = ctx.getUniformLocation(circleProgram, "u_baseColor");
  uniforms.circle.outputPremultiplied = ctx.getUniformLocation(circleProgram, "u_outputPremultiplied");
  uniforms.texture.texture = ctx.getUniformLocation(textureProgram, "u_texture");

  // Create a shared full-screen quad
  const quadPositions = new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]);
  quadVAO = ctx.createVertexArray();
  ctx.bindVertexArray(quadVAO);
  posBuffer = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, posBuffer);
  ctx.bufferData(ctx.ARRAY_BUFFER, quadPositions, ctx.STATIC_DRAW);
  // Both programs use the attribute named "a_position"
  const posLoc = ctx.getAttribLocation(circleProgram, "a_position");
  ctx.enableVertexAttribArray(posLoc);
  ctx.vertexAttribPointer(posLoc, 2, ctx.FLOAT, false, 0, 0);
  ctx.bindVertexArray(null);

  // Create framebuffers
  const strokeFBObject = createFramebufferAndTexture(ctx, canvasWidth, canvasHeight);
  strokeFBO = strokeFBObject.fbo;
  strokeTexture = strokeFBObject.texture;

  const commitFBObject = createFramebufferAndTexture(ctx, canvasWidth, canvasHeight);
  committedFBO = commitFBObject.fbo;
  committedTexture = commitFBObject.texture;

  ctx.enable(ctx.BLEND);
}

function drawSegmentAndComposite(x, y) {
  if (!ctx) return;

  // 1. Draw new circle segment into the stroke framebuffer.
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, strokeFBO);
  ctx.viewport(0, 0, canvasWidth, canvasHeight);
  ctx.useProgram(circleProgram);
  ctx.bindVertexArray(quadVAO);
  ctx.uniform2f(uniforms.circle.resolution, canvasWidth, canvasHeight);
  ctx.uniform2f(uniforms.circle.circleCenter, x, canvasHeight - y);
  ctx.uniform1f(uniforms.circle.circleRadius, strokeSettings.radius);
  ctx.uniform4fv(uniforms.circle.baseColor, strokeSettings.color);
  ctx.enable(ctx.BLEND);
  if (strokeSettings.intraAlphaMode === 'maximum') {
    ctx.uniform1i(uniforms.circle.outputPremultiplied, 0);
    ctx.blendEquationSeparate(ctx.FUNC_ADD, ctx.MAX);
    ctx.blendFuncSeparate(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA, ctx.ONE, ctx.ONE);
  } else {
    ctx.uniform1i(uniforms.circle.outputPremultiplied, 1);
    ctx.blendEquation(ctx.FUNC_ADD);
    ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
  }
  ctx.drawArrays(ctx.TRIANGLES, 0, 6);

  // 2. Composite: draw the committed strokes and overlay the new stroke.
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.viewport(0, 0, canvasWidth, canvasHeight);
  ctx.useProgram(textureProgram);
  ctx.bindVertexArray(quadVAO);
  ctx.activeTexture(ctx.TEXTURE0);

  // Draw committed strokes (without blending)
  ctx.bindTexture(ctx.TEXTURE_2D, committedTexture);
  ctx.uniform1i(uniforms.texture.texture, 0);
  ctx.disable(ctx.BLEND);
  ctx.drawArrays(ctx.TRIANGLES, 0, 6);

  // Overlay new stroke (with blending)
  ctx.enable(ctx.BLEND);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
  ctx.bindTexture(ctx.TEXTURE_2D, strokeTexture);
  ctx.uniform1i(uniforms.texture.texture, 0);
  ctx.drawArrays(ctx.TRIANGLES, 0, 6);

  ctx.bindVertexArray(null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
}

function compileShader(type, source) {
  const shader = ctx.createShader(type);
  ctx.shaderSource(shader, source);
  ctx.compileShader(shader);
  if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
    console.error(`Shader (${type === ctx.VERTEX_SHADER ? "VS" : "FS"}) error:`, ctx.getShaderInfoLog(shader));
    ctx.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vs, fs) {
  if (!vs || !fs) return null;
  const program = ctx.createProgram();
  ctx.attachShader(program, vs);
  ctx.attachShader(program, fs);
  ctx.linkProgram(program);
  if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
    console.error("Program error:", ctx.getProgramInfoLog(program));
    ctx.deleteProgram(program);
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
