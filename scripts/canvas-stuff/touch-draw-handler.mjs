import { pressureMap } from "../mapper/pressure-map.mjs";
import { color } from "../tools/color-picker.mjs";
import { radius } from "../tools/head-size.mjs";
import { erase } from "../tools/eraser.mjs";
import { canvasWorker } from "../script.js";

const BACKGROUND_ELEMENT = document.getElementById("bground");

// Initial state for transformation and active pointers.
const activePointers = new Map();

// Define a threshold in milliseconds for when you consider a pointer "stale".
const STALE_THRESHOLD = 10000; // Stale pointers will be cleaned after between 10-20 seconds.

// Function to clean up inactive pointers.
function removeStalePointers() {
    const now = Date.now();

    activePointers.forEach((pointer, pointerId) => {
        if (now - pointer.lastUpdate > STALE_THRESHOLD) {
            activePointers.delete(pointerId);
        }
    });
}
setInterval(removeStalePointers, STALE_THRESHOLD);

const ACTIVATION_DISTANCE = 15;

let type;
let rect;

/**
 * Draw if only one finger is detected
 */
function handleDraw() {
    const [[key, value]] = activePointers.entries();
    const pressure = pressureMap.mapXToY(1);

    if (type === 'pointerDown') {
        const dist = Math.hypot(value.startClientX - value.clientX, value.startClientY - value.clientY);
        if (dist < ACTIVATION_DISTANCE) {
            return;
        }
        canvasWorker.postMessage({
            type,
            event: [{
                x: value.startOffsetX - rect.x,
                y: value.startOffsetY - rect.y,
                pressure,
            }],
            color,
            radius,
            erase
        });
        type = 'pointerMove';
    }

    canvasWorker.postMessage({
        type,
        event: [{
            x: value.offsetX - rect.x,
            y: value.offsetY - rect.y,
            pressure,
        }],
        color,
        radius,
        erase
    });
}

function setActivePointer(
    pointerID,
    offsetX, offsetY,
    clientX, clientY,
    startOffsetX = offsetX,
    startOffsetY = offsetY,
    startClientX = clientX,
    startClientY = clientY
) {
    activePointers.set(pointerID, {
        offsetX, offsetY,
        clientX, clientY,
        startOffsetX, startOffsetY,
        startClientX, startClientY,
        lastUpdate: Date.now(),
    });
}

export const initTouch = (recti) => {
    rect = { x: 16384 - recti.x / 2, y: 16384 - recti.y / 2 };

    // Pointer down handler: capture the pointer and register its initial state.
    /** @param {PointerEvent} e */
    function pointerDown(e) {
        if (e.pointerType !== 'touch') {
            return;
        }

        if (activePointers.size === 1 && type === 'pointerMove') {
            type = 'pointerUp';
            handleDraw();
        }

        // Capture pointer events so the element receives all related events.
        e.target.setPointerCapture(e.pointerId);

        setActivePointer(e.pointerId,
            e.offsetX, e.offsetY,
            e.clientX, e.clientY
        );

        if (activePointers.size === 1) {
            type = 'pointerDown';
            handleDraw();
        }
    }

    // Pointer move handler: update pointer tracking then delegate appropriately.
    /** @param {PointerEvent} e */
    function pointerMove(e) {
        if (!activePointers.has(e.pointerId)) {
            return;
        }
        const pointer = activePointers.get(e.pointerId);
        setActivePointer(e.pointerId,
            e.offsetX, e.offsetY,
            e.clientX, e.clientY,
            pointer.startOffsetX, pointer.startOffsetY,
            pointer.startClientX, pointer.startClientY
        );

        if (activePointers.size === 1) {
            handleDraw();
        }
    }

    function pointerUp(e) {
        if (!activePointers.has(e.pointerId)) {
            return;
        }

        if (activePointers.size === 1 && type === 'pointerMove') {
            type = 'pointerUp';
            handleDraw();
        }

        e.target.releasePointerCapture(e.pointerId);
        activePointers.delete(e.pointerId);

        if (activePointers.size === 1) {
            const [[key, value]] = activePointers.entries();
            setActivePointer(key,
                value.offsetX, value.offsetY,
                value.clientX, value.clientY
            );
            type = 'pointerDown';
            handleDraw();
        }
    }

    // Attach pointer event listeners on the background element.
    BACKGROUND_ELEMENT.addEventListener('pointerdown', pointerDown);
    BACKGROUND_ELEMENT.addEventListener('pointermove', pointerMove);

    BACKGROUND_ELEMENT.addEventListener('pointerup', pointerUp);
    BACKGROUND_ELEMENT.addEventListener('pointercancel', pointerUp);
    BACKGROUND_ELEMENT.addEventListener('lostpointercapture', pointerUp);
};