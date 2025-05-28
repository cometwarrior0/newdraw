let prevLength = null, prevAngle = null;
let rawRotation = 0, rawZoom = 1;

/**
 * Processes touch inputs.
 * @param {PointerEvent} e 
 * @param {Object} state - Contains shared variables like activePointers, zoom, transX, etc.
 */
export function handleTransform(e, state) {
    const pointerCount = state.activePointers.size;
    if (pointerCount === 2) {
        const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = [...state.activePointers.values()];
        const diffX = x2 - x1;
        const diffY = y2 - y1;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        // Rotation logic.
        const angleRad = Math.atan2(diffY, diffX);
        if (prevAngle !== null) {
            const deltaRotation = angleRad - prevAngle;
            rawRotation += deltaRotation;
            rawRotation %= 2 * Math.PI;

            const snapThreshold = 0.08;
            const candidate = Math.round(rawRotation / (Math.PI / 2)) * (Math.PI / 2);
            state.rotation = (Math.abs(rawRotation - candidate) < snapThreshold)
                ? candidate
                : rawRotation;

            // Rotate translation offset around the pivot (centerX, centerY).
            const oldX = state.transX;
            const oldY = state.transY;
            state.transX = Math.cos(deltaRotation) * (oldX - centerX)
                - Math.sin(deltaRotation) * (oldY - centerY) + centerX;
            state.transY = Math.sin(deltaRotation) * (oldX - centerX)
                + Math.cos(deltaRotation) * (oldY - centerY) + centerY;
        }
        prevAngle = angleRad;

        // Zoom logic.
        const length = Math.hypot(diffX, diffY);
        if (prevLength !== null) {
            const deltaZoom = length - prevLength;
            const oldZoom = state.zoom;
            rawZoom *= Math.pow(2, (deltaZoom) * 0.005);
            state.zoom = rawZoom;

            const snapValues = [
                1 / 32, 1 / 24, 1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3,
                1 / 2, 1 / 1.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32
            ];
            const tolerance = 0.05;
            for (const snap of snapValues) {
                if (Math.abs(1 - rawZoom / snap) < tolerance) {
                    state.zoom = snap;
                    break;
                }
            }

            // Adjust translation so the zoom is performed relative to the gesture center.
            state.transX = centerX - (centerX - state.transX) * (state.zoom / oldZoom);
            state.transY = centerY - (centerY - state.transY) * (state.zoom / oldZoom);
        }
        prevLength = length;
    } else {
        rawZoom = state.zoom;
        rawRotation = state.rotation;
        prevAngle = null;
        prevLength = null;
    }

    // Always pan based on the average pointer movement.
    const pointer = state.activePointers.get(e.pointerId);
    const deltaX = (pointer.x - pointer.prevX) / pointerCount;
    const deltaY = (pointer.y - pointer.prevY) / pointerCount;
    state.transX += deltaX;
    state.transY += deltaY;
}
