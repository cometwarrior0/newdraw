export class BezierMapper {
    constructor() {
        // Default control points (as [x, y] pairs) for the mapping.
        // x and y values are assumed to be in the [0, 1] range.
        this.controlPoints = [
            [0, 0],
            [0.25, 0],
            [0.75, 1],
            [1, 1],
        ];
    }

    /**
     * Updates a control point at the given index after clamping 
     * the new coordinates to valid boundaries.
     *
     * The x-coordinate is clamped between the previous point's x (or 0)
     * and the next point's x (or 1) to ensure proper ordering.
     *
     * @param {number} index - Index of the control point to update.
     * @param {number} cx - New x-coordinate.
     * @param {number} cy - New y-coordinate.
     */
    setControlPoint(index, cx, cy) {
        // Validate the index.
        if (index < 0 || index >= this.controlPoints.length) {
            console.warn("Invalid control point index.");
            return;
        }

        // Determine the valid range for the x-coordinate using adjacent points.
        const prevX = this.controlPoints[index - 1]?.[0] ?? 0;
        const nextX = this.controlPoints[index + 1]?.[0] ?? 1;

        // Clamp the coordinates.
        // Assumes clamp(number, min?, max?) is defined elsewhere:
        // - For cx, clamps between prevX and nextX.
        // - For cy, assumes a default [0, 1] range.
        cx = clamp(cx, prevX, nextX);
        cy = clamp(cy);

        // Update the control point.
        this.controlPoints[index] = [cx, cy];

        // Uncomment the following line if automatic reordering (by x) is desired.
        // this.controlPoints.sort((a, b) => a[0] - b[0]);
    }

    /**
     * Adds a new control point after clamping its coordinates,
     * then sorts all control points by x to maintain proper ordering.
     *
     * @param {number} cx - x-coordinate of the new control point.
     * @param {number} cy - y-coordinate of the new control point.
     */
    addControlPoint(cx, cy) {
        cx = clamp(cx);
        cy = clamp(cy);
        this.controlPoints.push([cx, cy]);
        this.controlPoints.sort((a, b) => a[0] - b[0]);
    }

    /**
     * Returns the index of the control point that is within a given
     * tolerance of the target point. If none is found, returns -1.
     *
     * @param {number[]} target - The [x, y] target coordinate.
     * @param {number} tolerance - Maximum allowed distance for a match.
     * @returns {number} Index of the matched control point, or -1 if none.
     */
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

    /**
     * Computes the Euclidean distance between a control point (by index) and a given position.
     *
     * @param {number} index - Index of the control point.
     * @param {number[]} pos - The [x, y] coordinate to measure against.
     * @returns {number} The computed distance or -1 if the index is invalid.
     */
    getControlPointDist(index, pos) {
        if (index < 0 || index >= this.controlPoints.length) {
            console.warn("Invalid control point index.");
            return -1;
        }
        const [x, y] = this.controlPoints[index];
        return Math.hypot(x - pos[0], y - pos[1]);
    }

    /**
     * Removes the control point at the given index.
     * Ensures that at least two control points always remain.
     *
     * @param {number} index - Index of the control point to remove.
     */
    removeControlPoint(index) {
        if (this.controlPoints.length < 2) {
            console.warn("Can't delete last control point.");
            return;
        }
        this.controlPoints = this.controlPoints.filter((_, i) => i !== index);
    }

    /**
     * Maps an x-value to a y-value using a Bézier curve defined by the control points.
     *
     * The algorithm:
     * 1. Checks if the x-value is out of bounds (before the first or after the last control point).
     * 2. Iterates through control segments using averages of adjacent points to find the segment
     *    where the x-value falls.
     * 3. Normalizes the position within that segment and uses quadratic Bézier interpolation.
     *
     * @param {number} x - The input x-value (assumed to be between 0 and 1).
     * @returns {number} The corresponding y-value or -1 if the input x is below the allowed range.
     */
    mapXToY(x) {
        let firstX = this.controlPoints[0][0];
        let lastX = this.controlPoints[this.controlPoints.length - 1][0];
        let firstY = this.controlPoints[0][1];
        let lastY = this.controlPoints[this.controlPoints.length - 1][1];

        // Return maximum y if x is at or beyond the last control point.
        if (x >= lastX) return lastY;

        // Return an out-of-bound indicator if x is less than the first control point's x.
        if (x < firstX) return -1;

        // Determine the current segment by averaging adjacent control points.
        let i = 1;
        for (; i < this.controlPoints.length - 2; i += 1) {
            const avgX = (this.controlPoints[i][0] + this.controlPoints[i + 1][0]) * 0.5;
            const avgY = (this.controlPoints[i][1] + this.controlPoints[i + 1][1]) * 0.5;
            if (x < avgX) {
                lastX = avgX;
                lastY = avgY;
                break;
            }
            firstX = avgX;
            firstY = avgY;
        }

        // Normalize the x position within the current segment.
        const t = (x - firstX) / (lastX - firstX);

        // bx (relative x) and by (y) for the specific control point determine the curve shape.
        const bx = (this.controlPoints[i][0] - firstX) / (lastX - firstX);
        const by = this.controlPoints[i][1];

        // Compute y using a quadratic Bézier evaluation.
        return this.XToY(t, firstY, bx, by, lastY);
    }

    /**
     * Evaluates the quadratic Bézier curve at a normalized position.
     *
     * Uses the standard quadratic Bézier formula:
     *
     *   y = (1-t)² * ay + 2*(1-t)*t*by + t² * cy
     *
     * To compute t, a quadratic equation is solved based on the relationship
     * derived from the control x-values (where bx is the relative x-control point).
     *
     * If the quadratic coefficient is zero (degenerate case), a linear interpolation is used.
     *
     * @param {number} x - Normalized position (0 to 1) along the segment.
     * @param {number} ay - y-value at the start of the segment.
     * @param {number} bx - Relative x-value of the control point (affects the quadratic equation).
     * @param {number} by - y-value of the control point.
     * @param {number} cy - y-value at the end of the segment.
     * @returns {number} The computed and clamped y-value.
     */
    XToY(x, ay, bx, by, cy) {
        // Early exit for boundary conditions.
        if (x <= 0) return clamp(ay);
        if (x >= 1) return clamp(cy);

        // Derive coefficients for the quadratic equation: a*t² + b*t + c = 0.
        const a = 2 * -bx + 1;
        const b = 2 * bx;
        const c = -x;

        // In the degenerate case where a === 0, fall back to linear interpolation.
        if (a === 0) {
            const t = x;
            const it = 1 - t;
            return clamp(it * it * ay + 2 * it * t * by + t * t * cy);
        }

        // Compute the discriminant.
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            console.warn("Warning: no real solutions for t.");
        }

        // Solve for t using the quadratic formula.
        // Here, only one solution is used (assuming it falls within [0, 1]).
        const t = (-b + Math.sqrt(discriminant)) / (2 * a);
        const it = 1 - t;

        // Return the Bézier-interpolated y-value.
        return clamp(it * it * ay + 2 * it * t * by + t * t * cy);
    }
}
function clamp(val, min = 0, max = 1) {
    return Math.min(Math.max(val, min), max);
}