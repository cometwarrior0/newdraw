let canvases = [];

let ctx;
let offset = -Infinity;
const TWO_PI = Math.PI * 2;
let radius = 16;

self.addEventListener('message', (e) => {
  const { type } = e.data;

  if (type === 'pointerMove') {
    const ev = e.data.event;

    smooth(ev);
  }
  else if (type === 'pointerDown') {
    const ev = e.data.event;
    ctx.fillStyle = e.data.color;
    radius = e.data.radius;
    ctx.globalCompositeOperation = (e.data.erase) ? "destination-out" : "source-over";

    smooth(ev);
  }
  else if (type === 'pointerUp') {
    const ev = e.data.event;
    smooth(ev);

    pointerEvents.length = 0;
    offset = -Infinity;
    activeLen = 0;
  }
  else if (type === 'newcanvas') {
    canvases.push({ canvas: e.data.canvas, id: e.data.id });
  }
  else if (type === 'focuscanvas') {
    focusCanvas(e.data.id);
  }
  else if (type === 'removecanvas') {
    removeCanvas(e.data.id);
  }
});

function removeCanvas(id) {
  const idx = canvases.findIndex(canvas => canvas.id === id);
  if (idx === -1) {
    console.warn('Warning: index not found with id:', id);
    return;
  }
  canvases.splice(idx, 1);
}

function focusCanvas(id) {
  const idx = canvases.findIndex(canvas => canvas.id === id);
  if (idx === -1) {
    console.warn('Warning: index not found with id:', id);
    return;
  }
  ctx = canvases[idx].canvas.getContext('2d');
}

const pointerEvents = [];
function smooth(e) {
  for (const ev of e) {
    pointerEvents.push(ev);

    if (pointerEvents.length < 1) return;
    while (pointerEvents.length < 4) {
      pointerEvents.push(pointerEvents[pointerEvents.length - 1]);
    }
    if (pointerEvents.length > 4) {
      pointerEvents.splice(0, pointerEvents.length - 4);
    }

    offset = drawCircles(offset, radius);
  }
}

function drawCircles(curoff, headsize = 16, headdist = 0.125) {
  const xs = pointerEvents.map(e => e.x);
  const ys = pointerEvents.map(e => e.y);
  const ps = pointerEvents.map(e => e.pressure);

  const d01 = Math.hypot(xs[1] - xs[0], ys[1] - ys[0]);
  const d12 = Math.hypot(xs[2] - xs[1], ys[2] - ys[1]);
  const d23 = Math.hypot(xs[3] - xs[2], ys[3] - ys[2]);
  let approxLen = (d01 + d12 + d23);

  const tl = Math.ceil(approxLen); // find the required resolution

  const segLenghts = [0];
  let totalLength = 0;

  let prevX = cbs(0, xs[0], xs[1], xs[2], xs[3]);
  let prevY = cbs(0, ys[0], ys[1], ys[2], ys[3]);
  for (let i = 1; i <= tl; i += 1) {
    const prog = i / tl;
    const curX = cbs(prog, xs[0], xs[1], xs[2], xs[3]);
    const curY = cbs(prog, ys[0], ys[1], ys[2], ys[3]);

    const len = Math.hypot(curX - prevX, curY - prevY);
    totalLength += len;
    segLenghts.push(totalLength);

    prevX = curX;
    prevY = curY;
  }



  const invSegLen = 1 / (segLenghts.length - 1);
  const inc = 0.25;
  for (; activeLen <= totalLength; activeLen += inc) {
    let j = 0;
    while (segLenghts[j + 1] < activeLen) {
      j++;
    }

    const addProg = j * (invSegLen);
    const segStart = segLenghts[j];
    const segEnd = segLenghts[j + 1];
    const prog = (((activeLen - segStart) / (segEnd - segStart)) * invSegLen + addProg) || 0;

    let p = Math.max(cbs(prog, ps[0], ps[1], ps[2], ps[3]), 0);
    p *= headsize;

    if (curoff + p * headdist <= -0.5) {
      const x = cbs(prog, xs[0], xs[1], xs[2], xs[3]);
      const y = cbs(prog, ys[0], ys[1], ys[2], ys[3]);

      ctx.beginPath();
      ctx.arc(x, y, p, 0, TWO_PI);
      ctx.fill();

      activeLen += p * headdist;
      curoff = 0;
    }
    curoff -= inc;
  }
  activeLen -= totalLength;
  return curoff;
}
let activeLen = 0;

// function crs(t, a, b, c, d) {
//   const tt = t * t;
//   return (2 * b
//     + (t * (-a + c)
//       + tt * (2 * a - 5 * b + 4 * c - d))
//     + tt * t * (-a + 3 * (b - c) + d)) * 0.5;
// }

function cbs(t, a, b, c, d) {
  const tt = t * t;
  return 1 / 6 * (
    (a + 4 * b + c)
    + t * (3 * (-a + c))
    + tt * (3 * (a - 2 * b + c))
    + tt * t * (-a + 3 * (b - c) + d)
  );
}

function clamp(val, min = 0, max = 1) {
  return Math.min(Math.max(val, min), max);
}