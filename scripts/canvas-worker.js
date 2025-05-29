let canvas, ctx;
const TWO_PI = Math.PI * 2;

self.addEventListener('message', (e) => {
  const { type } = e.data;

  if (type === 'init') {
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d');
  }

  // Handle pointer events or other drawing instructions
  else if (type === 'pointerMove') {
    const ev = e.data.event;
    // Example: Draw a circle where the pointer was pressed
    smooth(ev);
  }
  // More cases can be added (pointerMove, pointerUp, etc.)
});









function smooth(e) {
  for (const ev of e) {
    ctx.beginPath();
    ctx.arc(ev.x, ev.y, ev.pressure * 20, 0, TWO_PI);
    ctx.fill();
  }
}





function drawCircle(pointEvts, curoff, color = "rgb(0,0,0)") {
  canvas.fillStyle = color;
  if (pointEvts.length > 4) {
    pointEvts.splice(0, pointEvts.length - 4);
  }
  else if (pointEvts.length < 4) {
    while (pointEvts.length < 4)
      pointEvts.push(pointEvts[pointEvts.length - 1]);
  }
  const x0 = pointEvts[0][0];
  const x1 = pointEvts[1][0];
  const x2 = pointEvts[2][0];
  const x3 = pointEvts[3][0];
  const y0 = pointEvts[0][1];
  const y1 = pointEvts[1][1];
  const y2 = pointEvts[2][1];
  const y3 = pointEvts[3][1];
  const p0 = pointEvts[0][2];
  const p1 = pointEvts[1][2];
  const p2 = pointEvts[2][2];
  const p3 = pointEvts[3][2];
  const xl0 = x1 - x0;
  const xl1 = x2 - x1;
  const xl2 = x3 - x2;
  const yl0 = y1 - y0;
  const yl1 = y2 - y1;
  const yl2 = y3 - y2;
  const l0 = Math.sqrt(xl0 * xl0 + yl0 * yl0);
  const l1 = Math.sqrt(xl1 * xl1 + yl1 * yl1);
  const l2 = Math.sqrt(xl2 * xl2 + yl2 * yl2);
  // const avgPrs = (p0 + p1 + p2+ p3);
  // const testmultipler = clamp(2/(avgPrs*headsize*headdist), 0.25, 4);
  // console.log(testmultipler)
  const tl = (((l0 + l1 + l2) * 2 + 1) | 0);
  const itl = 1 / tl;
  let lx = crs(0, x0, x1, x2, x3);
  let ly = crs(0, y0, y1, y2, y3);
  // ct.strokeStyle = "red";
  // ct.beginPath();
  // ct.arc(x3, y3, 50, 0, 2 * Math.PI);
  // ct.stroke();
  // ct.fillStyle = "black";
  for (let prog = itl; prog < 1.00001; prog += itl) {
    const cx = crs(prog, x0, x1, x2, x3);
    const cy = crs(prog, y0, y1, y2, y3);
    let cp = crs(prog, p0, p1, p2, p3);
    cp *= headsize;
    const dx = cx - lx;
    const dy = cy - ly;
    const dlen = Math.hypot(dx, dy);
    lx = cx;
    ly = cy;
    curoff -= dlen;
    if (cp <= 0)
      continue;
    if ((curoff + cp * headdist) <= 0) {
      // curCTX.globalCompositeOperation = "destination-over";
      curCTX.globalAlpha = cp / headsize * 0.125;
      curCTX.beginPath();
      curCTX.arc(cx, cy, cp, 0, 6.2831853);
      curCTX.fill();
      // alphaComparison(curCTX, cx, cy, cp, color);
      curoff += Math.max(2 * cp * headdist, dlen); // add dlen if bigger than headsize
    }
  }
  return curoff;
}




function crs(t, a, b = a, c = b, d = c) {
  let tt = t * t;
  return (2 * b
    + (t * (-a + c)
      + tt * (2 * a - 5 * b + 4 * c - d))
    + tt * t * (-a + 3 * (b - c) + d)) * 0.5;
}


class BezierMapper {
  constructor() {
    this.controlPoints = [[0, 0], [0.25, 0], [0.75, 1], [1, 1]];
  }
  /**
   * Function to update the control point (must be between 0 and 1 for both x and y)
   * @param cx - x-coordinate of the control point
   * @param cy - y-coordinate of the control point
   */
  setControlPoint(index, cx, cy) {
    var _a, _b, _c, _d;
    if (index < 0 || index >= this.controlPoints.length) {
      console.warn("Invalid control point index.");
      return;
    }
    let prevX = (_b = (_a = this.controlPoints[index - 1]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 0;
    let nextX = (_d = (_c = this.controlPoints[index + 1]) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 1;
    cx = clamp(cx, prevX, nextX);
    cy = clamp(cy);
    this.controlPoints[index] = [cx, cy];
    // this.controlPoints.sort((a, b) => a[0] - b[0]);
  }
  addControlPoint(cx, cy) {
    cx = clamp(cx);
    cy = clamp(cy);
    this.controlPoints.push([cx, cy]);
    this.controlPoints.sort((a, b) => a[0] - b[0]);
  }
  getControlPointIdx(target, tolerance = 0) {
    let index = -1;
    let minDist = tolerance;
    this.controlPoints.forEach(([x, y], i) => {
      const dist = Math.hypot(x - target[0], y - target[1]);
      if (dist <= minDist) {
        minDist = dist;
        index = i;
      }
    });
    return index;
  }
  getControlPointDist(index, pos) {
    if (index < 0 || index >= this.controlPoints.length) {
      console.warn("Invalid control point index.");
      return -1;
    }
    const [x, y] = this.controlPoints[index];
    return Math.hypot(x - pos[0], y - pos[1]);
  }
  removeControlPoint(index) {
    if (this.controlPoints.length < 2) {
      console.warn("Can't delete last control point.");
      return;
    }
    this.controlPoints = this.controlPoints.filter((_, i) => i !== index);
  }
  /**
   * Map an x-value to a y-value using the Bézier curve.
   * @param x - The input x-value (between 0 and 1)
   * @returns The corresponding y-value (between 0 and 1)
   */
  mapXToY(x) {
    let frstX = this.controlPoints[0][0];
    let lastX = this.controlPoints[this.controlPoints.length - 1][0];
    let frstY = this.controlPoints[0][1];
    let lastY = this.controlPoints[this.controlPoints.length - 1][1];
    if (x >= lastX)
      return lastY;
    if (x < frstX)
      return -1;
    let i = 1;
    for (; i < this.controlPoints.length - 2; i += 1) {
      const avgx = (this.controlPoints[i][0] + this.controlPoints[i + 1][0]) * 0.5;
      const avgy = (this.controlPoints[i][1] + this.controlPoints[i + 1][1]) * 0.5;
      if (x < avgx) {
        lastX = avgx;
        lastY = avgy;
        break;
      }
      frstX = avgx;
      frstY = avgy;
    }
    const t = (x - frstX) / (lastX - frstX);
    const bx = (this.controlPoints[i][0] - frstX) / (lastX - frstX);
    const by = this.controlPoints[i][1];
    return this.XToY(t, frstY, bx, by, lastY);
  }
  XToY(x, ay, bx, by, cy) {
    if (x <= 0) {
      return clamp(ay);
    }
    else if (x >= 1) {
      return clamp(cy);
    }
    // Solve for t using the quadratic formula
    const a = 2 * -bx + 1;
    const b = 2 * bx;
    const c = -x;
    if (a === 0) {
      const t = x;
      const it = 1 - t;
      const y = clamp(it * it * ay + 2 * it * t * by + t * t * cy);
      return y;
    }
    // Calculate the discriminant
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      console.warn("Warning: no real solutions.");
    }
    // // Solve for t for both values (t2 is not necessary I think??)
    // const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    // const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    // const t = (t1 < 0 || t1 > 1) ? t2 : t1;
    // if (t < 0 || t > 1) throw new Error("No valid solution for t in [0, 1].");
    const t = (-b + Math.sqrt(discriminant)) / (2 * a);
    const it = 1 - t;
    // Calculate y using the Bézier formula
    const y = clamp(it * it * ay + 2 * it * t * by + t * t * cy);
    return y;
  }
}
const pressureMap = new BezierMapper;
const alphaMap = new BezierMapper;