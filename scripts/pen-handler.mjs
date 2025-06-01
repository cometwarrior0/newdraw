import { pressureMap } from "./pressure-map.mjs";
import { color } from "./color-picker.mjs";
import { radius } from "./head-size.mjs";
import { erase } from "./eraser.mjs";

const bground = document.getElementById("bground");
let worker, rect;
let drawActive = false;
let activeId = null;

/** @param {PointerEvent} e */
function pointerDown(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        const p = pressureMap.mapXToY(e.pressure);
        if (p === -1) {
            return;
        }
        drawActive = true;
        activeId = e.pointerId;
        worker.postMessage({
            type: 'pointerDown',
            event: [{ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: p }],
            color: color,
            radius: radius,
            erase: erase,
        });
    }
}

/** @param {PointerEvent} e */
function pointerUp(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        const p = Math.max(pressureMap.mapXToY(e.pressure), 0);
        drawActive = false;
        activeId = null;
        worker.postMessage({
            type: 'pointerUp',
            event: [{ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: p }],
        })
    }
}

/** @param {PointerEvent} e */
function pointerMove(e) {
    if (!drawActive || e.pointerId != activeId) return;
    if (pressureMap.mapXToY(e.pressure) === -1) {
        worker.postMessage({
            type: 'pointerUp',
            event: [{ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: 0 }],
        })
    }
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

    worker.postMessage({
        type: 'pointerMove',
        event: eventData,
    })
}

export function initPen(workeri, recti) {
    worker = workeri;
    rect = { x: 16384 - recti.x / 2, y: 16384 - recti.y / 2 }; // magic values, 16384 = half of 32768 to get the center, and subtract half of width and height of canvas to fit x y values to canvas

    bground.addEventListener('pointerdown', pointerDown);
    bground.addEventListener('pointermove', pointerMove);
    bground.addEventListener('pointerup', pointerUp);
    bground.addEventListener('pointercancel', pointerUp);
}