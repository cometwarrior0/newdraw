let canvas, ctx;
let offset = -Infinity;
const TWO_PI = Math.PI * 2;
let radius = 16;

self.addEventListener('message', (e) => {
  const { type } = e.data;

  if (type === 'init') {
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d');
  }
  else if (type === 'pointerDown') {
    const ev = e.data.event;
    ctx.fillStyle = e.data.color;
    radius = e.data.radius;
    smooth(ev);
  }
  else if (type === 'pointerUp') {
    const ev = e.data.event;
    smooth(ev);
    pointerEvents.length = 0;
    offset = -Infinity;
  }
  else if (type === 'pointerMove') {
    const ev = e.data.event;
    smooth(ev);
  }
});

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

function drawCircles(curoff, headsize = 16, headdist = 0.1) {
  const xs = pointerEvents.map(e => e.x);
  const ys = pointerEvents.map(e => e.y);
  const ps = pointerEvents.map(e => e.pressure);

  const d01 = Math.hypot(xs[1] - xs[0], ys[1] - ys[0]);
  const d12 = Math.hypot(xs[2] - xs[1], ys[2] - ys[1]);
  const d23 = Math.hypot(xs[3] - xs[2], ys[3] - ys[2]);
  let approxLen = (d01 + d12 + d23);

  const tl = Math.ceil(approxLen); // find the required resolution
  const itl = 1 / tl; // get the inverse of the resolution for speedup

  const segLenghts = [0];
  let totalLength = 0;
  let prevX = xs[1];
  let prevY = ys[1];
  for (let prog = itl; prog <= 1; prog += itl) {
    const curX = crs(prog, xs[0], xs[1], xs[2], xs[3]);
    const curY = crs(prog, ys[0], ys[1], ys[2], ys[3]);

    let len = Math.hypot(curX - prevX, curY - prevY);

    totalLength += len;
    segLenghts.push(totalLength);

    prevX = curX;
    prevY = curY;
  }


  const segLenLen = segLenghts.length;
  const iSegLenLen = 1 / segLenLen;
  const inc = 0.25;
  for (let i = 0; i <= totalLength; curoff -= (totalLength > i) ? inc : (totalLength - i), i += inc) {
    let j = 0;
    while (j + 1 < segLenghts.length && segLenghts[j + 1] < i) {
      j++;
    }

    const addProg = j * iSegLenLen;
    const segStart = segLenghts[j];
    const segEnd = segLenghts[j + 1];
    const prog = (((i - segStart) / (segEnd - segStart)) * iSegLenLen + addProg) || 0;

    let p = Math.max(crs(prog, ps[0], ps[1], ps[2], ps[3]), 0);
    p *= headsize;

    if (curoff + p * headdist < -0.5) {
      const x = crs(prog, xs[0], xs[1], xs[2], xs[3]);
      const y = crs(prog, ys[0], ys[1], ys[2], ys[3]);

      ctx.beginPath();
      ctx.arc(x, y, p, 0, TWO_PI);
      ctx.fill();

      i += p * headdist;
      curoff = 0;
    }
  }
  return curoff;
}

function crs(t, a, b, c, d) {
  let tt = t * t;
  return (2 * b
    + (t * (-a + c)
      + tt * (2 * a - 5 * b + 4 * c - d))
    + tt * t * (-a + 3 * (b - c) + d)) * 0.5;
}

function clamp(val, min = 0, max = 1) {
  return Math.min(Math.max(val, min), max);
}