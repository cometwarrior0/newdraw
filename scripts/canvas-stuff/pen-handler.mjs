import { pressureMap } from "../mapper/pressure-map.mjs";
import { color } from "../tools/color-picker.mjs";
import { radius } from "../tools/head-size.mjs";
import { erase } from "../tools/eraser.mjs";
import { canvasWorker } from "../script.js";

const bground = document.getElementById("bground");
let rect;
let drawActive = false;
let activeId = null;

/** @param {PointerEvent} e */
function pointerDown(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        drawActive = true;
        activeId = e.pointerId;
        const pressure = pressureMap.mapXToY(e.pressure);

        canvasWorker.postMessage({
            type: 'pointerDown',
            event: [{
                x: e.offsetX - rect.x,
                y: e.offsetY - rect.y,
                pressure
            }],
            color,
            radius,
            erase,
        });
    }
}

/** @param {PointerEvent} e */
function pointerUp(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        const pressure = pressureMap.mapXToY(e.pressure);
        drawActive = false;
        activeId = null;
        canvasWorker.postMessage({
            type: 'pointerUp',
            event: [{
                x: e.offsetX - rect.x,
                y: e.offsetY - rect.y,
                pressure
            }],
        })
    }
}

/** @param {PointerEvent} e */
function pointerMove(e) {
    if (!drawActive || e.pointerId != activeId) return;

    // Use getCoalescedEvents if available; otherwise, fall back to a single-event array.
    const coalescedEvents = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    // Extract only x, y, and pressure values in order
    const eventData = coalescedEvents.map(e => ({
        x: e.offsetX - rect.x,
        y: e.offsetY - rect.y,
        pressure: pressureMap.mapXToY(e.pressure),
    }));

    // if (eventData.length === 0) {
    //     eventData.push({ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: e.pressure })
    // }

    canvasWorker.postMessage({
        type: 'pointerMove',
        event: eventData,
    })
}

export function initPen(recti) {
    rect = { x: 16384 - recti.x / 2, y: 16384 - recti.y / 2 }; // magic values, 16384 = half of 32768 to get the center, and subtract half of width and height of canvas to fit x y values to canvas

    bground.addEventListener('pointerdown', pointerDown);
    bground.addEventListener('pointermove', pointerMove);
    bground.addEventListener('pointerup', pointerUp);
    bground.addEventListener('pointercancel', pointerUp);
}