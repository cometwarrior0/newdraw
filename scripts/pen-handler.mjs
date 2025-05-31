import { createPressureMap } from "./pressure-map.mjs";

const bground = document.getElementById("bground");
let worker, rect, pressureMap;
let drawActive = false;
let activeId = null;

/** @param {PointerEvent} e */
function pointerDown(e) {
    if (e.pointerType === 'pen') {
        drawActive = true;
        activeId = e.pointerId;
        worker.postMessage({
            type: 'pointerDown',
            event: [{ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: e.pressure }],
        })
    }
}

/** @param {PointerEvent} e */
function pointerUp(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        drawActive = false;
        activeId = null;
        worker.postMessage({
            type: 'pointerUp',
            event: [{ x: e.offsetX - rect.x, y: e.offsetY - rect.y, pressure: e.pressure }],
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
        pressure: e.pressure
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
    rect = recti;
    pressureMap = createPressureMap();

    bground.addEventListener('pointerdown', pointerDown);
    bground.addEventListener('pointermove', pointerMove);
    bground.addEventListener('pointerup', pointerUp);
    bground.addEventListener('pointercancel', pointerUp);
}