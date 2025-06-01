import { pressureMap } from "./pressure-map.mjs";
import { color } from "./color-picker.mjs";
import { radius } from "./head-size.mjs";
import { erase } from "./eraser.mjs";

const bground = document.getElementById("bground");
let worker, rect;
let touchActive = false;
let activatedNew = false;
let touchCount = 0;
let activeTime = null;
let startCoords;
const minTime = 200;
const minDist = 20;

/** @param {PointerEvent} e */
function pointerDown(e) {
    if (e.pointerType === 'touch') {
        if (touchCount === 1 && !activatedNew) {
            worker.postMessage({
                type: 'pointerUp',
                event: [{
                    x: e.offsetX - rect.x,
                    y: e.offsetY - rect.y,
                    pressure: pressureMap.mapXToY(e.pressure || 1),
                }],
            });
        }

        touchCount += 1;
        touchActive = (touchCount === 1);
        if (touchActive) {
            activatedNew = true;
            activeTime = Date.now();
            startCoords = { x: e.clientX, y: e.clientY };
        }
    }
}

/** @param {PointerEvent} e */
function pointerUp(e) {
    if (e.pointerType === 'touch') {
        if (touchCount === 1 && !activatedNew) {
            worker.postMessage({
                type: 'pointerUp',
                event: [{
                    x: e.offsetX - rect.x,
                    y: e.offsetY - rect.y,
                    pressure: pressureMap.mapXToY(e.pressure || 1),
                }],
            });
        }

        touchCount -= 1;
        touchActive = (touchCount === 1);
        if (touchActive) {
            console.log('just activated!');
            activatedNew = true;
            activeTime = Date.now();
            startCoords = { x: e.clientX, y: e.clientY };
        }
    }
}

/** @param {PointerEvent} e */
function pointerMove(e) {
    if (!touchActive || e.pointerType !== 'touch') return;
    if ((Date.now() - activeTime) < minTime && Math.hypot(startCoords.x - e.clientX, startCoords.y - e.clientY) < minDist) return;

    // Use getCoalescedEvents if available; otherwise, fall back to a single-event array.
    const coalescedEvents = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    // Extract only x, y, and pressure values in order
    const eventData = coalescedEvents.map(e => ({
        x: e.offsetX - rect.x,
        y: e.offsetY - rect.y,
        pressure: pressureMap.mapXToY(e.pressure || 1),
    }));

    if (activatedNew) {
        activatedNew = false;
        worker.postMessage({
            type: 'pointerDown',
            event: eventData,
            color: color,
            radius: radius,
            erase: erase,
        });
    }
    else {
        worker.postMessage({
            type: 'pointerMove',
            event: eventData,
        });
    }
}

export function initTouch(workeri, recti) {
    worker = workeri;
    rect = { x: 16384 - recti.x / 2, y: 16384 - recti.y / 2 }; // magic values, 16384 = half of 32768 to get the center, and subtract half of width and height of canvas to fit x y values to canvas

    bground.addEventListener('pointerdown', pointerDown);
    bground.addEventListener('pointermove', pointerMove);
    bground.addEventListener('pointerup', pointerUp);
    bground.addEventListener('pointercancel', pointerUp);
}