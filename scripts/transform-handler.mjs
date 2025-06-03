const origin = document.getElementById("origin");
const bground = document.getElementById("bground");
// Initial state for transformation and active pointers.
const state = {
    transX: document.documentElement.clientWidth / 2,
    transY: document.documentElement.clientHeight / 2,
    rotation: 0,
    zoom: 1,
    activePointers: new Map(),
};

let prevLength = null, prevAngle = null;
let rawRotation = 0, rawZoom = 1;
let rect;

const zoomSnapValues = [
    1 / 32, 1 / 24, 1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3,
    1 / 2, 1 / 1.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32
];

/**
 * Processes touch inputs.
 * @param {PointerEvent} e 
 * @param {Object} state - Contains shared variables like activePointers, zoom, transX, etc.
 */
function handleTransform(e, state) {
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
            const prevRotation = state.rotation;

            const deltaAngle = angleRad - prevAngle;
            rawRotation += deltaAngle;
            rawRotation %= 2 * Math.PI;

            const snapThreshold = 0.08;
            const candidate = Math.round(rawRotation / (Math.PI / 2)) * (Math.PI / 2);
            state.rotation = (Math.abs(rawRotation - candidate) < snapThreshold)
                ? candidate
                : rawRotation;

            const deltaRotation = state.rotation - prevRotation;

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
            rawZoom = Math.min(32, (Math.max(1 / 32, rawZoom)));
            state.zoom = rawZoom;

            const tolerance = 0.05;
            for (const snap of zoomSnapValues) {
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

    // !!! REMOVE THIS AT SOME POINT !!!
    // !!! REMOVE THIS AT SOME POINT !!! BUG FIX TODO
    // !!! REMOVE THIS AT SOME POINT !!!
    if (pointerCount === 1) {
        return;
    }
    // !!! REMOVE THIS AT SOME POINT !!!
    // !!! REMOVE THIS AT SOME POINT !!!
    // !!! REMOVE THIS AT SOME POINT !!!

    // Always pan based on the average pointer movement.
    const pointer = state.activePointers.get(e.pointerId);
    const deltaX = (pointer.x - pointer.prevX) / pointerCount;
    const deltaY = (pointer.y - pointer.prevY) / pointerCount;
    state.transX += deltaX;
    state.transY += deltaY;
}

export const handleTouch = (recti, panCanvas = false) => {
    rect = recti;
    fitToScreen();

    // Pointer down handler: capture the pointer and register its initial state.
    /** @param {PointerEvent} e */
    function pointerDown(e) {
        // Capture pointer events so the element receives all related events.
        e.target.setPointerCapture(e.pointerId);

        state.activePointers.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY,
            prevX: e.clientX,
            prevY: e.clientY,
        });

        // Process immediate movement.
        pointerMove(e);
    }

    // Pointer move handler: update pointer tracking then delegate appropriately.
    /** @param {PointerEvent} e */
    function pointerMove(e) {
        if (!state.activePointers.has(e.pointerId)) {
            if (!panCanvas)
                return;
            state.activePointers.set(e.pointerId, {
                x: e.clientX,
                y: e.clientY,
                prevX: e.clientX,
                prevY: e.clientY,
            });
        }

        const pointer = state.activePointers.get(e.pointerId);
        state.activePointers.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY,
            prevX: pointer.x,
            prevY: pointer.y,
        });

        // Dispatch to specialized handlers based on pointer type.
        if (e.pointerType === 'touch' || panCanvas) {
            handleTransform(e, state);
            applyTransform();
        }
    }

    // Pointer up & cancel handler: release pointer capture and clean-up tracking.
    /** @param {PointerEvent} e */
    function pointerUp(e) {
        e.target.releasePointerCapture(e.pointerId);
        state.activePointers.delete(e.pointerId);
    }

    // Attach pointer event listeners on the background element.
    bground.addEventListener('pointerdown', pointerDown);
    bground.addEventListener('pointermove', pointerMove);
    bground.addEventListener('pointerup', pointerUp);
    bground.addEventListener('pointercancel', pointerUp);

    bground.addEventListener('wheel', handleWheel);
};

function handleWheel(e) {
    const oldZoom = state.zoom;

    if (e.deltaY < 0) {
        state.zoom = zoomSnapValues.find(x => x > state.zoom) || zoomSnapValues[zoomSnapValues.length - 1];
    } else {
        state.zoom = zoomSnapValues.findLast(x => x < state.zoom) || zoomSnapValues[0];
    }

    state.transX = e.clientX - (e.clientX - state.transX) * (state.zoom / oldZoom);
    state.transY = e.clientY - (e.clientY - state.transY) * (state.zoom / oldZoom);

    applyTransform();
}

function fitToScreen(w = rect.x, h = rect.y, sw = document.documentElement.clientWidth, sh = document.documentElement.clientHeight) {
    const scaleX = (sw / w);
    const scaleY = (sh / h);

    // Use the smaller scale to ensure the object fits
    state.zoom = Math.min(scaleX, scaleY);
    state.transX = sw / 2;
    state.transY = sh / 2;
    state.rotation = 0;
    applyTransform();
}

function applyTransform() {
    state.zoom = Math.min(32, (Math.max(1 / 32, state.zoom)));
    // Apply the combined CSS transform.
    origin.style.transform = `
        translate(${state.transX}px, ${state.transY}px)
        scale(${state.zoom})
        rotate(${state.rotation}rad)
    `;
}